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

Format-aware watermarking. The HTML/PDF case overlays a fixed-position
diagonal stamp coloured with C<--dc4u-accent>, so the watermark inherits
the active theme. TXT/MD/RMD prepend a banner line. PDF reuses HTML (PDFs
are produced by pandoc'ing HTML in DC4U::Generator).

DOCX is currently a no-op - the OOXML emitted by Generator is minimal
and would need its own paragraph-styling pass.

=cut

# Format dispatch. Anything not listed is returned untouched.
my %APPLY = (
    HTML => \&_html,
    PDF  => \&_html,    # PDF is rendered from HTML upstream
    TXT  => \&_text,
    MD   => \&_text,
    RMD  => \&_text,
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

1;

__END__

=head1 AUTHOR

DC4U Development Team

=head1 LICENSE

This software is licensed under the MIT License.

=cut
