package DC4U::TUI::FormatSelector;

use strict;
use warnings;
use v5.32;
use Curses;

=head1 NAME

DC4U::TUI::FormatSelector - TUI screen for selecting output format

=cut

my @FORMATS = (
    { key => 'PDF',  desc => 'Portable Document Format — printable charge sheet' },
    { key => 'HTML', desc => 'Web page with styled charge layout' },
    { key => 'TXT',  desc => 'Plain text — no formatting, universal' },
    { key => 'MD',   desc => 'Markdown — lightweight markup for docs' },
    { key => 'RMD',  desc => 'R Markdown — Knit to PDF via RStudio' },
    { key => 'DOCX', desc => 'Microsoft Word document' },
);

sub new {
    my ($class, %opts) = @_;
    my $self = {
        top    => $opts{top}    || 3,
        bottom => $opts{bottom} || 20,
        width  => $opts{width}  || 80,
        cursor => 0,
    };
    bless $self, $class;
    return $self;
}

=head2 run

Renders radio-button list with one-line description per format.
Returns selected format string or undef on quit.

=cut

sub run {
    my ($self, $win) = @_;
    while (1) {
        $self->_draw($win);
        my $ch = getch();
        next unless defined $ch;
        if ($ch eq 'q' || $ch eq 'Q') {
            return undef;
        }
        my $code = (length($ch) == 1) ? ord($ch) : $ch;
        if ($code == KEY_UP || $ch eq 'k') {
            $self->{cursor}-- if $self->{cursor} > 0;
        } elsif ($code == KEY_DOWN || $ch eq 'j') {
            $self->{cursor}++ if $self->{cursor} < $#FORMATS;
        } elsif ($code == 10 || $code == 13 || $code == KEY_ENTER) {
            return $FORMATS[$self->{cursor}]{key};
        }
    }
}

sub _draw {
    my ($self, $win) = @_;
    my $w = $self->{width};
    my $h = getmaxy($win);

    # title bar
    attron(COLOR_PAIR(1) | A_BOLD);
    for my $r (0..2) { move($r, 0); addstr(' ' x $w); }
    my $title = 'DC4U - Select Output Format';
    move(1, int(($w - length($title)) / 2)); addstr($title);
    attroff(COLOR_PAIR(1) | A_BOLD);

    for my $i (0 .. $#FORMATS) {
        my $y = $self->{top} + $i;
        move($y, 0);
        clrtoeol();
        my $f = $FORMATS[$i];
        my $sel = ($i == $self->{cursor});
        my $radio = $sel ? '(*)' : '( )';
        my $line = sprintf("  %s  %-6s - %s", $radio, $f->{key}, $f->{desc});
        if ($sel) {
            attron(A_REVERSE);
            addstr(substr($line, 0, $w));
            attroff(A_REVERSE);
        } else {
            addstr(substr($line, 0, $w));
        }
    }

    # help bar
    attron(COLOR_PAIR(1));
    move($h - 2, 0); addstr(' ' x $w);
    move($h - 1, 0); addstr(' ' x $w);
    move($h - 2, 0); addstr(' Up/Down=navigate  Enter=select format  q=back');
    attroff(COLOR_PAIR(1));

    refresh();
}

1;

__END__

=head1 AUTHOR

DC4U Development Team

=head1 LICENSE

This software is licensed under the MIT License.

=cut
