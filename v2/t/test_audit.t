#!/usr/bin/env perl

use strict;
use warnings;
use v5.32;

use Test::More;
use File::Temp qw(tempdir);
use FindBin;
use lib "$FindBin::Bin/../lib";

use_ok('DC4U::Audit');

my $tmp = tempdir(CLEANUP => 1);
my $log = "$tmp/audit.log";

my $audit = DC4U::Audit->new(path => $log);
is($audit->path, $log, 'path accessor works');

# Write two entries
ok($audit->record({
    input        => 'a.dc',
    jurisdiction => 'singapore',
    format       => 'HTML',
    output       => 'hello',
    outfile      => 'a.html',
}), 'first record returns true');

ok($audit->record({
    input        => 'b.dc',
    jurisdiction => 'uk',
    format       => 'PDF',
    output       => 'world',
    outfile      => 'b.pdf',
}), 'second record returns true');

# Reading back
ok(-f $log, 'audit log file created');
open my $fh, '<', $log or die $!;
my @lines = <$fh>;
close $fh;
is(scalar(@lines), 2, 'two lines written');

like($lines[0], qr/"input":"a\.dc"/, 'first entry contains input field');
like($lines[0], qr/"format":"HTML"/, 'first entry has format');
like($lines[0], qr/"sha256":/,        'first entry has sha256');
like($lines[0], qr/"ts":"\d{4}-\d{2}-\d{2}T/, 'ISO timestamp');

# tail()
my $tail = $audit->tail(1);
is(scalar(@$tail), 1, 'tail(1) returns one line');
like($tail->[0], qr/b\.dc/, 'tail returns most recent');

# Missing required keys -> false, no write
my $audit2 = DC4U::Audit->new(path => "$tmp/audit2.log");
ok(!$audit2->record({}), 'record({}) fails');
ok(!-f "$tmp/audit2.log", 'no file created on bad input');

# Missing format -> false
ok(!$audit2->record({ input => 'x.dc' }), 'record without format fails');

done_testing();
