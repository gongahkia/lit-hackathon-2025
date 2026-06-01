#!/usr/bin/env perl

use strict;
use warnings;
use v5.32;

use Test::More;
use FindBin;
use lib "$FindBin::Bin/../lib";

use_ok('DC4U::Lint');

# Build a known-good Singapore charge from primitive strings so tests
# don't depend on the samples/ directory.
my $good_sg = <<'DC';
`HTML`
<John Doe; S0000001I; Chinese; 30; M; Singaporean>
[Theft; 01/01/2024; took the wallet without consent at MRT station]
@s379 Penal Code@
{Officer Tan; IO, CID; 02/01/2024}
DC

my $lint = DC4U::Lint->new(jurisdiction => 'singapore');
my $issues = $lint->lint_string($good_sg);
ok(defined $issues, 'lint_string returns defined');
is(ref $issues, 'ARRAY', 'returns arrayref');
is(DC4U::Lint->has_errors($issues), 0, 'good charge has no errors');

# NRIC checksum
my $bad_nric = $good_sg;
$bad_nric =~ s/S0000001I/S0000001Z/;  # wrong suffix
$issues = $lint->lint_string($bad_nric);
ok(scalar(grep { $_->{message} =~ /NRIC/ } @$issues),
    'NRIC checksum mismatch flagged');

# Placeholder text -> error
my $todo = $good_sg;
$todo =~ s/took the wallet without consent at MRT station/TODO write this/;
$issues = $lint->lint_string($todo);
ok(DC4U::Lint->has_errors($issues), 'TODO placeholder is an error');

# Statute lacking section number -> warn
my $no_section = $good_sg;
$no_section =~ s/\@s379 Penal Code\@/\@The Penal Code\@/;
$issues = $lint->lint_string($no_section);
ok(scalar(grep { $_->{message} =~ /numbered section/ } @$issues),
    'statute without section number warned');

# Date inversion -> warn
my $inverted = $good_sg;
$inverted =~ s|01/01/2024;|31/12/2024;|;  # charge date later than officer date
$issues = $lint->lint_string($inverted);
ok(scalar(grep { $_->{message} =~ /after officer/ } @$issues),
    'charge-date-after-officer-date warned');

# format_text returns a non-empty string
my $report = DC4U::Lint->format_text($issues);
like($report, qr/error|warn|OK/i, 'format_text produces a report');

# Future-dated charge -> warn (use a year clearly in the future)
my $future = $good_sg;
$future =~ s|01/01/2024;|01/01/2099;|;
$issues = $lint->lint_string($future);
ok(scalar(grep { $_->{message} =~ /future/i } @$issues),
    'future-dated charge warned');

done_testing();
