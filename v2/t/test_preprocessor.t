#!/usr/bin/env perl

use strict;
use warnings;
use v5.32;

use Test::More;
use File::Temp qw(tempdir);
use FindBin;
use lib "$FindBin::Bin/../lib";

use_ok('DC4U::Preprocessor');

# Front-matter
my $with_fm = <<'DC';
---
case_no: A-2025-1
hearing: 12 March 2025
---

`HTML`
<a;b;c;1;M;d>
[T; 01/01/2025; foo]
@s1 X@
{Y; Z; 02/01/2025}
DC

my $pp = DC4U::Preprocessor->new();
my ($body, $meta) = $pp->process($with_fm);
is($meta->{case_no}, 'A-2025-1', 'front-matter case_no parsed');
is($meta->{hearing}, '12 March 2025', 'front-matter hearing parsed');
unlike($body, qr/^---/, 'front-matter stripped from body');
like($body, qr/`HTML`/, 'body preserved');

# No front-matter -> empty meta, body unchanged
my $no_fm = "`HTML`\n<a;b;c;1;M;d>\n";
my ($b2, $m2) = DC4U::Preprocessor->new->process($no_fm);
is_deeply($m2, {}, 'no front-matter -> empty hash');
is($b2, $no_fm, 'body unchanged when no front-matter');

# @def + ${var}
my $with_def = <<'DC';
@def $io "Officer Smith; IO, CID; 02/01/2024"
@def $statute "s379 Penal Code"
`HTML`
<X;Y;Z;1;M;W>
[T; 01/01/2024; foo]
@${statute}@
{${io}}
DC

my ($b3, $m3) = DC4U::Preprocessor->new->process($with_def);
unlike($b3, qr/\@def/, '@def lines stripped');
like($b3, qr/Officer Smith/, '${io} expanded');
like($b3, qr/s379 Penal Code/, '${statute} expanded');

# @include - use a real temp dir
my $tmp = tempdir(CLEANUP => 1);
open my $fh, '>', "$tmp/sub.dc" or die $!;
print $fh "<INCLUDED;X;Y;1;M;Z>\n";
close $fh;
open my $main, '>', "$tmp/main.dc" or die $!;
print $main "\@include sub.dc\n[T; 01/01/2024; foo]\n";
close $main;

my $main_text = do { open my $mfh, '<', "$tmp/main.dc"; local $/; <$mfh> };
my ($b4, undef) = DC4U::Preprocessor->new->process(
    $main_text, source_path => "$tmp/main.dc"
);
like($b4, qr/INCLUDED/, '@include expanded');
unlike($b4, qr/\@include/, '@include directive stripped');

# Circular @include should die
open my $a, '>', "$tmp/a.dc"; print $a "\@include b.dc\n"; close $a;
open my $b, '>', "$tmp/b.dc"; print $b "\@include a.dc\n"; close $b;
my $a_text = do { open my $afh, '<', "$tmp/a.dc"; local $/; <$afh> };
eval {
    DC4U::Preprocessor->new->process($a_text, source_path => "$tmp/a.dc");
};
like($@, qr/circular|depth/i, 'circular @include is caught');

# Unknown ${var} left alone, not expanded into empty
my ($b5) = DC4U::Preprocessor->new->process('hello ${nope} world');
like($b5, qr/\$\{nope\}/, 'unknown var preserved');

done_testing();
