#!/usr/bin/env perl

use strict;
use warnings;
use v5.32;

use Test::More;
use FindBin;
use lib "$FindBin::Bin/../lib";

use_ok('DC4U::Watermark');

# HTML: stamp injected before </body>, uses --dc4u-accent var
my $html = "<html><body><p>x</p></body></html>";
my $stamped = DC4U::Watermark->apply($html, 'HTML', 'DRAFT');
like($stamped, qr/dc4u-watermark/, 'HTML stamp injected');
like($stamped, qr/DRAFT/,         'HTML stamp uses label');
like($stamped, qr/--dc4u-accent/,  'HTML stamp references theme var');
like($stamped, qr/<\/body>/,       'closing body tag preserved');

# HTML escaping
my $escaped = DC4U::Watermark->apply($html, 'HTML', '<script>');
like($escaped, qr/&lt;script&gt;/, 'label HTML-escaped');

# PDF goes through the HTML path
my $pdf = DC4U::Watermark->apply($html, 'PDF', 'DRAFT');
like($pdf, qr/dc4u-watermark/, 'PDF stamp injected via HTML path');

# TXT: banner prepended
my $txt = DC4U::Watermark->apply("body text", 'TXT', 'CONFIDENTIAL');
like($txt, qr/CONFIDENTIAL/, 'TXT banner contains label');
like($txt, qr/^\*+/, 'TXT banner starts with asterisks');

# MD/RMD: banner
for my $f (qw(MD RMD)) {
    my $b = DC4U::Watermark->apply("body", $f, 'INTERNAL');
    like($b, qr/INTERNAL/, "$f banner applied");
}

# Pass-through cases
is(DC4U::Watermark->apply($html, 'HTML', undef), $html, 'undef label = passthrough');
is(DC4U::Watermark->apply($html, 'HTML', ''),    $html, 'empty label = passthrough');
is(DC4U::Watermark->apply($html, 'DOCX', 'X'),   $html, 'unsupported format = passthrough');
is(DC4U::Watermark->apply($html, 'XYZ',  'X'),   $html, 'unknown format = passthrough');

done_testing();
