package DC4U::Generator;

use strict;
use warnings;
use v5.32;

use DC4U::Theme;

=head1 NAME

DC4U::Generator - Generates documents in various formats

=head1 SYNOPSIS

    my $generator = DC4U::Generator->new();
    my $output = $generator->generate($parsed_data, 'PDF', $config);

=head1 DESCRIPTION

Generates legal documents in various output formats using Perl modules.
Supports PDF, HTML, TXT, MD, RMD, and DOCX formats.

=cut

sub new {
    my $class = shift;
    my $self = {
        generators => {
            'PDF' => \&_generate_pdf,
            'HTML' => \&_generate_html,
            'TXT' => \&_generate_txt,
            'MD' => \&_generate_md,
            'RMD' => \&_generate_rmd,
            'DOCX' => \&_generate_docx
        }
    };
    bless $self, $class;
    return $self;
}

=head2 generate

Generates document in specified format.

=cut

sub generate {
    my ($self, $parsed_data, $format, $config) = @_;
    
    unless (exists $self->{generators}->{$format}) {
        die "Unsupported output format: $format";
    }
    
    return $self->{generators}->{$format}->($parsed_data, $config);
}

=head2 _generate_pdf

Generates PDF document.

=cut

sub _generate_pdf {
    my ($data, $config) = @_;
    my $html_content = _build_charge_content($data, $config);
    my $theme_css    = _theme_css($config);
    my $full_html = "<html><head><style>\n$theme_css</style></head><body>\n$html_content\n</body></html>";
    # pandoc HTML->PDF
    my $pandoc_path = `which pandoc` || '/opt/homebrew/bin/pandoc';
    chomp $pandoc_path;
    unless (-x $pandoc_path) {
        die "Error: pandoc not found. Install via: brew install pandoc";
    }
    require File::Temp;
    my ($fh_in, $in_file) = File::Temp::tempfile(SUFFIX => '.html', UNLINK => 1);
    binmode $fh_in, ':encoding(UTF-8)';
    print $fh_in $full_html;
    close $fh_in;
    my ($fh_out, $out_file) = File::Temp::tempfile(SUFFIX => '.pdf', UNLINK => 1);
    close $fh_out;
    my $cmd = "$pandoc_path -s \"$in_file\" -o \"$out_file\" 2>&1";
    my $output = `$cmd`;
    if ($? != 0) {
        die "PDF generation failed (pandoc): $output";
    }
    open my $pdf_fh, '<', $out_file or die "Cannot read generated PDF: $!";
    binmode $pdf_fh;
    local $/;
    my $content = <$pdf_fh>;
    close $pdf_fh;
    return $content;
}

=head2 _generate_html

Generates HTML document.

=cut

sub _generate_html {
    my ($data, $config) = @_;

    my $content   = _build_charge_content($data, $config);
    my $theme_css = _theme_css($config);

    # use external CSS from config or default path
    my $css_ref = 'charge.css';
    if ($config && $config->can('get')) {
        my $css_file = $config->get('formats.html.css_file');
        if ($css_file && -f $css_file) {
            # embed file contents
            open my $fh, '<', $css_file;
            my $css = do { local $/; <$fh> };
            close $fh;
            # Theme block goes AFTER the stylesheet so its :root vars win
            # over the defaults baked into charge.css.
            return <<"HTML";
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Draft Charge</title>
    <style>
$css
$theme_css    </style>
</head>
<body>
    $content
</body>
</html>
HTML
        }
    }
    return <<"HTML";
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Draft Charge</title>
    <link rel="stylesheet" href="$css_ref">
    <style>
$theme_css    </style>
</head>
<body>
    $content
</body>
</html>
HTML
}

# Resolve the active theme from config (falling back to the default) and
# return its :root { --dc4u-*: ... } CSS block. Returns an empty string if
# the configured theme name is unknown - charge.css's own :root defaults
# then apply.
sub _theme_css {
    my ($config) = @_;
    my $name;
    if ($config && $config->can('get')) {
        $name = $config->get('theme');
    }
    $name //= DC4U::Theme->default_name;
    return DC4U::Theme->css_block($name);
}

=head2 _generate_txt

Generates plain text document.

=cut

sub _generate_txt {
    my ($data, $config) = @_;
    
    my $content = _build_charge_content($data, $config);
    
    # Remove HTML tags and format for plain text
    $content =~ s/<[^>]+>//g;
    $content =~ s/&nbsp;/ /g;
    $content =~ s/&amp;/&/g;
    $content =~ s/&lt;/</g;
    $content =~ s/&gt;/>/g;
    
    return $content;
}

=head2 _generate_md

Generates Markdown document.

=cut

sub _generate_md {
    my ($data, $config) = @_;
    
    my $content = _build_charge_content($data, $config);
    
    # Convert HTML to Markdown
    $content =~ s/<h1[^>]*>(.*?)<\/h1>/# $1\n\n/g;
    $content =~ s/<h2[^>]*>(.*?)<\/h2>/## $1\n\n/g;
    $content =~ s/<p[^>]*>(.*?)<\/p>/$1\n\n/g;
    $content =~ s/<br\s*\/?>\s*/\n/g;
    $content =~ s/<[^>]+>//g;
    $content =~ s/&nbsp;/ /g;
    $content =~ s/&amp;/&/g;
    $content =~ s/&lt;/</g;
    $content =~ s/&gt;/>/g;
    
    return $content;
}

=head2 _generate_rmd

Generates R Markdown document.

=cut

sub _generate_rmd {
    my ($data, $config) = @_;
    
    my $content = _build_charge_content($data, $config);
    
    return <<"RMD";
---
output: pdf_document
---

$content
RMD
}

=head2 _generate_docx

Generates DOCX document (via RTF).

=cut

sub _generate_docx {
    my ($data, $config) = @_;

    eval { require Archive::Zip; };
    if ($@) {
        die "Archive::Zip required for DOCX output. Install via: cpan Archive::Zip";
    }

    my $content = _build_charge_content($data, $config);
    # strip to plain text for OOXML
    $content =~ s/<br\s*\/?>/\n/gi;
    $content =~ s/<\/(?:p|div|h[1-6]|li|tr)>/\n/gi;
    $content =~ s/<[^>]+>//g;
    $content =~ s/&nbsp;/ /g;
    $content =~ s/&amp;/&/g;
    $content =~ s/&lt;/</g;
    $content =~ s/&gt;/>/g;

    # build paragraphs XML
    my @lines = split /\n/, $content;
    my $body_xml = '';
    for my $line (@lines) {
        next unless $line =~ /\S/;
        $line =~ s/&/&amp;/g;
        $line =~ s/</&lt;/g;
        $line =~ s/>/&gt;/g;
        $body_xml .= "<w:p><w:r><w:t xml:space=\"preserve\">$line</w:t></w:r></w:p>\n";
    }

    my $document_xml = <<"XML";
<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
<w:body>
$body_xml
</w:body>
</w:document>
XML

    my $content_types = <<'XML';
<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>
</Types>
XML

    my $rels = <<'XML';
<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>
</Relationships>
XML

    my $zip = Archive::Zip->new();
    $zip->addString($content_types, '[Content_Types].xml');
    $zip->addString($rels, '_rels/.rels');
    $zip->addString($document_xml, 'word/document.xml');

    my $output = '';
    open my $fh, '>', \$output or die "Cannot write to string: $!";
    binmode $fh;
    $zip->writeToFileHandle($fh);
    close $fh;
    return $output;
}

=head2 _build_charge_content

Builds the charge content in HTML format.

=cut

sub _build_charge_content {
    my ($data, $config) = @_;

    # use Template module if config provides jurisdiction
    if ($config && $config->can('get')) {
        my $jurisdiction = $config->get('jurisdiction') // 'singapore';
        my $result = eval {
            require DC4U::Template;
            my $tmpl = DC4U::Template->new();
            my $template_name = "${jurisdiction}_charge";
            $tmpl->render($template_name, $data, 'HTML');
        };
        return $result if defined $result && !$@;
    }

    my $suspect = $data->{suspect_info};
    my $charge = $data->{charge_info};
    my $officer = $data->{officer_info};
    
    return <<"HTML";
<div class="header">
    <h1>Criminal Procedure Code 2010</h1>
    <h2>(CHAPTER 68)</h2>
    <h2>REVISED EDITION 2012</h2>
    <h2>SECTIONS 123-125</h2>
    <h1>CHARGE</h1>
</div>

<div class="charge-section">
    <p>You,</p>
    
    <div class="suspect-info">
        <p><span class="bold">Name:</span> $suspect->{name}</p>
        <p><span class="bold">NRIC:</span> $suspect->{nric}</p>
        <p><span class="bold">Race:</span> $suspect->{race}</p>
        <p><span class="bold">Age:</span> $suspect->{age}</p>
        <p><span class="bold">Sex:</span> $suspect->{gender}</p>
        <p><span class="bold">Nationality:</span> $suspect->{nationality}</p>
    </div>
    
    <p>are charged that you, on (or about) $charge->{date} at [location, add as necessary], Singapore, did [add brief summary of charge], <em>to wit</em> $charge->{explanation}, and you have thereby committed an offence under $data->{statute_info}.</p>
</div>

<div class="officer-info">
    <p>$officer->{name}</p>
    <p>$officer->{role_division}</p>
    <p>$officer->{date}</p>
</div>
HTML
}

=head2 _pdf_wrap

Word-wraps a line of text to fit within a given pixel width.

=cut

sub _pdf_wrap {
    my ($text, $font, $size, $max_w) = @_;
    return ('') unless defined $text && length($text);
    my @result;
    my @words = split /\s+/, $text;
    my $line = '';
    for my $word (@words) {
        my $test = length($line) ? "$line $word" : $word;
        # approximate width: avg char width ~= font_size * 0.5
        my $approx_w = length($test) * $size * 0.5;
        if ($approx_w > $max_w && length($line)) {
            push @result, $line;
            $line = $word;
        } else {
            $line = $test;
        }
    }
    push @result, $line if length($line);
    return @result ? @result : ('');
}

1;

__END__

=head1 AUTHOR

DC4U Development Team

=head1 LICENSE

This software is licensed under the MIT License.

=cut
