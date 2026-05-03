#!/usr/bin/env perl

use strict;
use warnings;
use v5.32;

use Test::More;
use File::Temp qw(tempdir);
use FindBin;
use lib "$FindBin::Bin/../lib";

use_ok('DC4U::Diff');

my $a_text = <<'DC';
`HTML`
<John Doe; S0000001I; Chinese; 30; M; Singaporean>
[Theft; 01/01/2024; took wallet]
@s379 Penal Code@
{Officer Tan; IO, CID; 02/01/2024}
DC

my $b_text = $a_text;
$b_text =~ s/John Doe/Jane Doe/;
$b_text =~ s/took wallet/took purse/;

my $tmp = tempdir(CLEANUP => 1);
for my $name (qw(a b)) {
    open my $fh, '>', "$tmp/$name.dc" or die $!;
    print $fh ($name eq 'a' ? $a_text : $b_text);
    close $fh;
}

# Identical files -> no changes
my $d_same = DC4U::Diff->compare("$tmp/a.dc", "$tmp/a.dc");
is(DC4U::Diff->has_changes($d_same), 0, 'identical files: no changes');
like(DC4U::Diff->format_text($d_same), qr/unchanged/, 'format mentions unchanged');

# Differing files
my $d = DC4U::Diff->compare("$tmp/a.dc", "$tmp/b.dc");
is(DC4U::Diff->has_changes($d), 1, 'differing files: has_changes true');
my @charge1_fields = @{ $d->{charges}[0]{fields} };
my %changed = map { $_->{field} => 1 } @charge1_fields;
ok($changed{'suspect.name'},        'name change detected');
ok($changed{'charge.explanation'},  'explanation change detected');

my $report = DC4U::Diff->format_text($d);
like($report, qr/John Doe/,  'old value in report');
like($report, qr/Jane Doe/,  'new value in report');
like($report, qr/suspect\.name/, 'field path in report');

# Different charge counts
open my $multi, '>', "$tmp/multi.dc" or die $!;
print $multi $a_text, "\n---\n", $a_text;
close $multi;
my $d2 = DC4U::Diff->compare("$tmp/a.dc", "$tmp/multi.dc");
is(scalar @{ $d2->{charges} }, 2, 'reports 2 charges total');
is($d2->{charges}[1]{status}, 'added', 'extra charge marked added');

done_testing();
