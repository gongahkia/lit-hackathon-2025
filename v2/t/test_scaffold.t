#!/usr/bin/env perl

use strict;
use warnings;
use v5.32;

use Test::More;
use File::Temp qw(tempfile);
use FindBin;
use lib "$FindBin::Bin/../lib";

use_ok('DC4U::Scaffold');
use_ok('DC4U::Lint');

my @j = DC4U::Scaffold->jurisdictions;
ok(scalar(@j) >= 5, 'at least 5 jurisdictions scaffolded');

for my $jur (@j) {
    my $text = DC4U::Scaffold->build($jur);
    ok($text, "scaffold for $jur is non-empty");
    like($text, qr/`PDF`/, "$jur scaffold opens with format");
    like($text, qr/<.+>/s, "$jur scaffold has suspect block");
    like($text, qr/\[.+\]/s, "$jur scaffold has charge block");
    like($text, qr/\@.+\@/s, "$jur scaffold has statute block");
    like($text, qr/\{.+\}/s, "$jur scaffold has officer block");
}

# Scaffold should pass Lint (this is the whole point - a clean scaffold
# starts free of warnings so Lint output during real use is signal-only).
for my $jur (qw(singapore uk australia india malaysia)) {
    my $text = DC4U::Scaffold->build($jur);
    my $lint = DC4U::Lint->new(jurisdiction => $jur);
    my $issues = $lint->lint_string($text);
    is(DC4U::Lint->has_errors($issues), 0,
        "$jur scaffold has no lint errors");
}

# write() refuses to overwrite by default
my ($fh, $path) = tempfile(SUFFIX => '.dc', UNLINK => 1);
print $fh "existing content\n";
close $fh;
eval { DC4U::Scaffold->write('singapore', $path) };
like($@, qr/Refusing to overwrite/, 'write refuses to clobber existing file');

# write with --force overwrites
DC4U::Scaffold->write('singapore', $path, 1);
open my $rfh, '<', $path or die $!;
my $written = do { local $/; <$rfh> };
close $rfh;
like($written, qr/`PDF`/, 'write --force replaces content');
unlike($written, qr/existing content/, 'old content gone after --force');

done_testing();
