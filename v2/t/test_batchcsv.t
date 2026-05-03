#!/usr/bin/env perl

use strict;
use warnings;
use v5.32;

use Test::More;
use File::Temp qw(tempdir);
use FindBin;
use lib "$FindBin::Bin/../lib";

use_ok('DC4U::BatchCSV');

my $tmp = tempdir(CLEANUP => 1);

open my $cfh, '>', "$tmp/data.csv" or die $!;
print $cfh "name,nric,age,explanation\n";
print $cfh qq{Tan Ah Kow,S0000001I,25,"stole a wallet, again"\n};
print $cfh qq{Lim Beng Seng,S0000002G,30,assaulted V at Bedok\n};
close $cfh;

open my $tfh, '>', "$tmp/template.dc" or die $!;
print $tfh <<'DC';
`HTML`
<{{name}}; {{nric}}; Chinese; {{age}}; M; Singaporean>
[Theft; 01/01/2025; {{explanation}}]
@s379 Penal Code@
{IO Smith; IO, CID; 02/01/2025}
DC
close $tfh;

my $r = DC4U::BatchCSV->run(
    csv       => "$tmp/data.csv",
    template  => "$tmp/template.dc",
    out_dir   => "$tmp/out",
    format    => 'TXT',
    id_column => 'nric',
);

is($r->{rows_processed}, 2, '2 rows processed');
is(scalar @{ $r->{results} }, 2, '2 result entries');
ok(-f "$tmp/out/S0000001I.txt", 'first row written under id_column name');
ok(-f "$tmp/out/S0000002G.txt", 'second row written under id_column name');

open my $rf, '<', "$tmp/out/S0000001I.txt" or die $!;
my $body = do { local $/; <$rf> };
close $rf;
like($body, qr/Tan Ah Kow/,     'placeholder substituted into output');
like($body, qr/stole a wallet/, 'comma-quoted CSV value preserved');

# Falls back to row_NNNN naming when no id_column
my $r2 = DC4U::BatchCSV->run(
    csv      => "$tmp/data.csv",
    template => "$tmp/template.dc",
    out_dir  => "$tmp/out2",
    format   => 'TXT',
);
ok(-f "$tmp/out2/row_0001.txt", 'fallback row_NNNN naming');
ok(-f "$tmp/out2/row_0002.txt", 'fallback row_0002.txt');

done_testing();
