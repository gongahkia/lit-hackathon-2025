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
is(DC4U::Watermark->apply($html, 'XYZ',  'X'),   $html, 'unknown format = passthrough');

# DOCX: round-trip through Archive::Zip if available. Uses File::Temp
# rather than scalar filehandles because AZ's tell/seek behave poorly
# against in-memory IO::Scalar emulations.
SKIP: {
    eval { require Archive::Zip; require File::Temp; 1 }
        or skip 'Archive::Zip not installed', 5;

    my $doc_xml = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
        . '<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">'
        . '<w:body><w:p><w:r><w:t>hello</w:t></w:r></w:p></w:body></w:document>';

    my $z = Archive::Zip->new();
    $z->addString('<?xml version="1.0"?><Types/>', '[Content_Types].xml');
    $z->addString($doc_xml, 'word/document.xml');
    my (undef, $tmp_path) = File::Temp::tempfile(SUFFIX => '.docx', UNLINK => 1);
    is($z->writeToFileNamed($tmp_path), 0, 'fixture DOCX written');
    open my $rfh, '<', $tmp_path or die $!; binmode $rfh; local $/;
    my $bytes = <$rfh>; close $rfh;

    my $stamped = DC4U::Watermark->apply($bytes, 'DOCX', 'DRAFT');
    isnt($stamped, $bytes, 'DOCX bytes change after watermark');

    # Re-open the stamped DOCX and confirm the stamp is in document.xml
    my (undef, $stamped_path) = File::Temp::tempfile(SUFFIX => '.docx', UNLINK => 1);
    open my $sfh, '>', $stamped_path or die $!; binmode $sfh; print $sfh $stamped; close $sfh;
    my $z2 = Archive::Zip->new();
    is($z2->read($stamped_path), 0, 'stamped DOCX re-opens cleanly');
    my $doc2 = $z2->contents('word/document.xml');
    like($doc2, qr/DRAFT/,            'DOCX document.xml contains label');
    like($doc2, qr/<w:b\s*\/?>/,      'DOCX stamp uses bold run');
    like($doc2, qr/jc w:val="center"/, 'DOCX stamp is centered');

    # XML escaping of the label
    my $stamped2 = DC4U::Watermark->apply($bytes, 'DOCX', '<script>');
    my (undef, $stamped2_path) = File::Temp::tempfile(SUFFIX => '.docx', UNLINK => 1);
    open my $s2fh, '>', $stamped2_path or die $!; binmode $s2fh; print $s2fh $stamped2; close $s2fh;
    my $z3 = Archive::Zip->new();
    $z3->read($stamped2_path);
    like($z3->contents('word/document.xml'), qr/&lt;script&gt;/,
        'DOCX label XML-escaped');
}

# Bytes that aren't a valid DOCX (zip) should pass through, not crash.
is(DC4U::Watermark->apply('not a docx', 'DOCX', 'X'), 'not a docx',
    'invalid DOCX bytes pass through unchanged');

done_testing();
