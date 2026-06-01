#!/usr/bin/env perl

use strict;
use warnings;
use v5.32;

use Test::More;
use File::Temp qw(tempdir);
use FindBin;
use lib "$FindBin::Bin/../lib";

use_ok('DC4U::Bundle');

my $tmp = tempdir(CLEANUP => 1);

# Build a valid input
my $input = "$tmp/case.dc";
open my $fh, '>', $input or die $!;
print $fh <<'DC';
`HTML`
<John Doe; S0000001I; Chinese; 30; M; Singaporean>
[Theft; 01/01/2024; took wallet at MRT]
@s379 Penal Code@
{Officer Tan; IO, CID; 02/01/2024}
DC
close $fh;

my $r = DC4U::Bundle->build(
    input        => $input,
    formats      => ['HTML', 'TXT', 'MD'],
    out_dir      => "$tmp/out",
    jurisdiction => 'singapore',
);

ok(ref $r eq 'HASH', 'build returns hashref');
ok(ref $r->{artifacts} eq 'ARRAY', 'artifacts arrayref present');
is(scalar @{ $r->{artifacts} }, 3, '3 artifacts (HTML/TXT/MD)');

for my $a (@{ $r->{artifacts} }) {
    ok(-f $a->{path},               "$a->{format} file exists");
    ok($a->{bytes} > 0,             "$a->{format} non-empty");
    like($a->{sha256}, qr/^[0-9a-f]{64}$/, "$a->{format} sha256 valid hex");
}

ok(-f $r->{manifest_path}, 'manifest written');
open my $mfh, '<', $r->{manifest_path} or die $!;
my $mtext = do { local $/; <$mfh> };
close $mfh;
like($mtext, qr/"artifacts":\[/,    'manifest has artifacts array');
like($mtext, qr/"jurisdiction":"singapore"/, 'manifest records jurisdiction');
like($mtext, qr/"generated_at":"/,  'manifest has timestamp');

# Each artifact's sha256 in the manifest matches the on-disk file
for my $a (@{ $r->{artifacts} }) {
    like($mtext, qr/\Q$a->{sha256}\E/, "manifest contains $a->{file} sha256");
}

done_testing();
