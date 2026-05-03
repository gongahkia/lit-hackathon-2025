package DC4U::Watermark;

use strict;
use warnings;
use v5.32;

=head1 NAME

DC4U::Watermark - Apply DRAFT/CONFIDENTIAL/etc. watermark to generated output

=head1 SYNOPSIS

    use DC4U::Watermark;
    my $stamped = DC4U::Watermark->apply($html, 'HTML', 'DRAFT');

=head1 DESCRIPTION

Format-aware watermarking:

  * HTML / PDF - fixed-position diagonal stamp coloured with the active
                 theme's C<--dc4u-accent>
  * TXT/MD/RMD - prepended banner line
  * DOCX       - styled bold paragraph injected at the top of the body
                 (true MS Word page-overlay watermarks need a header XML
                 part - this is the simplest treatment that survives
                 round-tripping through Word)

PDF reuses the HTML path because PDFs are produced by pandoc'ing HTML in
DC4U::Generator.

=cut

# Format dispatch. Anything not listed is returned untouched.
my %APPLY = (
    HTML => \&_html,
    PDF  => \&_html,    # PDF is rendered from HTML upstream
    TXT  => \&_text,
    MD   => \&_text,
    RMD  => \&_text,
    DOCX => \&_docx,
);

=head2 apply

Returns the stamped output. Pass-through if format is unsupported or label
is empty.

=cut

sub apply {
    my (undef, $output, $format, $label) = @_;
    return $output unless defined $label && length $label;
    return $output unless defined $format && exists $APPLY{ uc $format };
    return $APPLY{ uc $format }->($output, $label);
}

sub _html {
    my ($html, $label) = @_;
    my $safe = $label;
    $safe =~ s/&/&amp;/g; $safe =~ s/</&lt;/g; $safe =~ s/>/&gt;/g;

    # CSS overlay - fixed-position so it floats above content on every page.
    # Uses --dc4u-accent so themes pick it up. Falls back to gray if the
    # variable is undefined.
    my $stamp = <<"HTML";
<style>
  .dc4u-watermark {
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%) rotate(-30deg);
    font-size: 96pt;
    font-weight: bold;
    color: var(--dc4u-accent, #888);
    opacity: 0.12;
    pointer-events: none;
    z-index: 9999;
    user-select: none;
    text-transform: uppercase;
    letter-spacing: 0.1em;
    white-space: nowrap;
  }
  \@media print { .dc4u-watermark { opacity: 0.18; } }
</style>
<div class="dc4u-watermark">$safe</div>
HTML

    # Inject before </body> if present, otherwise append.
    if ($html =~ s{</body>}{$stamp</body>}i) {
        return $html;
    }
    return $html . $stamp;
}

sub _text {
    my ($txt, $label) = @_;
    my $up    = uc $label;
    my $width = 60;
    my $pad   = int( ($width - length($up) - 2) / 2 );
    $pad = 1 if $pad < 1;
    my $bar = '*' x $width;
    my $line = '*' . (' ' x $pad) . $up . (' ' x ($width - 2 - $pad - length($up))) . '*';
    return "$bar\n$line\n$bar\n\n" . $txt;
}

# DOCX path: open the .docx (which is a zip), find word/document.xml,
# inject a styled paragraph at the start of <w:body>, write back.
#
# Uses File::Temp rather than scalar filehandles because Archive::Zip's
# read/write paths call seek/tell, which are flaky against in-memory
# IO::Scalar emulations.
#
# Returns the original bytes unchanged if Archive::Zip is missing or the
# OOXML structure isn't what we expect - the watermark must never break
# the artifact.
sub _docx {
    my ($bytes, $label) = @_;
    return $bytes unless eval { require Archive::Zip; require File::Temp; 1 };

    my $safe = $label;
    $safe =~ s/&/&amp;/g; $safe =~ s/</&lt;/g; $safe =~ s/>/&gt;/g;

    # Styled paragraph: centered, bold, 24pt (sz is half-points so 48 = 24pt),
    # mid-grey colour. Word renders this as a clearly visible header above
    # the body content - not a true page-overlay watermark, but unmissable
    # and survives round-tripping through Word.
    my $stamp_xml = qq{<w:p><w:pPr><w:jc w:val="center"/>}
                  . qq{<w:spacing w:after="240"/></w:pPr>}
                  . qq{<w:r><w:rPr><w:b/><w:sz w:val="48"/>}
                  . qq{<w:color w:val="888888"/></w:rPr>}
                  . qq{<w:t xml:space="preserve">$safe</w:t></w:r></w:p>};

    my ($in_fh, $in_path) = File::Temp::tempfile(SUFFIX => '.docx', UNLINK => 1);
    binmode $in_fh;
    print $in_fh $bytes;
    close $in_fh;

    my $zip = Archive::Zip->new();
    return $bytes unless $zip->read($in_path) == 0;  # AZ_OK

    my $doc = $zip->contents('word/document.xml');
    return $bytes unless defined $doc && length $doc;

    # Inject right after the opening <w:body> tag. Tolerant of attributes
    # on the body element.
    unless ($doc =~ s{(<w:body[^>]*>)}{$1$stamp_xml}) {
        return $bytes;  # body tag not found - leave bytes untouched
    }
    $zip->contents('word/document.xml', $doc);

    my (undef, $out_path) = File::Temp::tempfile(SUFFIX => '.docx', UNLINK => 1);
    return $bytes unless $zip->writeToFileNamed($out_path) == 0;

    open my $rfh, '<', $out_path or return $bytes;
    binmode $rfh;
    local $/;
    my $out = <$rfh>;
    close $rfh;
    return $out;
}

1;

__END__

=head1 AUTHOR

DC4U Development Team

=head1 LICENSE

This software is licensed under the MIT License.

=cut
