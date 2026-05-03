package DC4U::TUI::ThemeSelector;

use strict;
use warnings;
use v5.32;
use Curses;

use DC4U::Theme;

=head1 NAME

DC4U::TUI::ThemeSelector - TUI screen for picking a color theme

=head1 DESCRIPTION

Lists registered themes (DC4U::Theme->available) with a live swatch panel
showing how header, content, error, success, and highlight slots will render
in the highlighted theme. Returns the chosen theme name, or undef if the
user cancels.

The selector temporarily writes pair slots 11..15 with the previewed
theme's colors so the swatch reflects the actual theme without disturbing
the live UI pairs (1..5).

=cut

# Same name->constant map as TUI.pm. Duplicated rather than imported to
# keep this file usable when DC4U::TUI is not loaded (e.g. from a test).
my %CURSES_COLOR = (
    black   => COLOR_BLACK,
    red     => COLOR_RED,
    green   => COLOR_GREEN,
    yellow  => COLOR_YELLOW,
    blue    => COLOR_BLUE,
    magenta => COLOR_MAGENTA,
    cyan    => COLOR_CYAN,
    white   => COLOR_WHITE,
);

# Preview pair slots - chosen above the 1..5 range used by the chrome.
use constant {
    PREVIEW_HEADER  => 11,
    PREVIEW_CONTENT => 12,
    PREVIEW_ERROR   => 13,
    PREVIEW_SUCCESS => 14,
    PREVIEW_HIGHLIGHT => 15,
};

sub new {
    my ($class, %opts) = @_;
    my @names = DC4U::Theme->available;
    my $cur   = $opts{current} // DC4U::Theme->default_name;
    my $idx   = 0;
    for my $i (0 .. $#names) { $idx = $i, last if $names[$i] eq $cur; }

    my $self = {
        top    => $opts{top}    || 3,
        bottom => $opts{bottom} || 20,
        width  => $opts{width}  || 80,
        names  => \@names,
        cursor => $idx,
    };
    bless $self, $class;
    return $self;
}

=head2 run

Returns the chosen theme name, or undef on quit/cancel.

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
            $self->{cursor}++ if $self->{cursor} < $#{ $self->{names} };
        } elsif ($code == 10 || $code == 13 || $code == KEY_ENTER) {
            return $self->{names}[ $self->{cursor} ];
        }
    }
}

sub _set_preview_pairs {
    my $name = shift;
    my $pairs = DC4U::Theme->curses_pairs($name);
    my @slots = (
        [PREVIEW_HEADER,    $pairs->{1}],
        [PREVIEW_CONTENT,   $pairs->{2}],
        [PREVIEW_ERROR,     $pairs->{3}],
        [PREVIEW_SUCCESS,   $pairs->{4}],
        [PREVIEW_HIGHLIGHT, $pairs->{5}],
    );
    for my $s (@slots) {
        my ($slot, $colors) = @$s;
        my ($fg, $bg) = @$colors;
        my $fg_c = $CURSES_COLOR{$fg} // COLOR_WHITE;
        my $bg_c = $CURSES_COLOR{$bg} // COLOR_BLACK;
        init_pair($slot, $fg_c, $bg_c);
    }
}

sub _draw {
    my ($self, $win) = @_;
    my $w = $self->{width};
    my $h = getmaxy($win);

    # title bar (uses live pair 1)
    attron(COLOR_PAIR(1) | A_BOLD);
    for my $r (0..2) { move($r, 0); addstr(' ' x $w); }
    my $title = 'DC4U - Select Color Theme';
    move(1, int(($w - length($title)) / 2)); addstr($title);
    attroff(COLOR_PAIR(1) | A_BOLD);

    # left column: theme list
    my $list_w = 28;
    for my $i (0 .. $#{ $self->{names} }) {
        my $y = $self->{top} + $i;
        last if $y >= $self->{bottom} - 1;
        move($y, 0); clrtoeol();
        my $name = $self->{names}[$i];
        my $sel  = ($i == $self->{cursor});
        my $line = sprintf("  %s %-22s", $sel ? '>' : ' ', $name);
        if ($sel) {
            attron(A_REVERSE);
            addstr(substr($line, 0, $list_w));
            attroff(A_REVERSE);
        } else {
            addstr(substr($line, 0, $list_w));
        }
    }

    # right column: preview swatch for the highlighted theme
    my $picked = $self->{names}[ $self->{cursor} ];
    _set_preview_pairs($picked);
    my $px = $list_w + 2;
    my $py = $self->{top};

    move($py, $px); clrtoeol();
    attron(A_BOLD | A_UNDERLINE);
    addstr("Preview: " . DC4U::Theme->label($picked));
    attroff(A_BOLD | A_UNDERLINE);

    move($py + 1, $px); clrtoeol();
    addstr(DC4U::Theme->desc($picked));

    my @rows = (
        [PREVIEW_HEADER,    'Header / Status   '],
        [PREVIEW_CONTENT,   'Content           '],
        [PREVIEW_ERROR,     'Error             '],
        [PREVIEW_SUCCESS,   'Success           '],
        [PREVIEW_HIGHLIGHT, 'Highlight / Warn  '],
    );
    for my $i (0 .. $#rows) {
        my $y = $py + 3 + $i;
        last if $y >= $self->{bottom} - 1;
        move($y, $px); clrtoeol();
        my ($slot, $label) = @{ $rows[$i] };
        addstr($label);
        attron(COLOR_PAIR($slot) | A_BOLD);
        addstr('  Aa Draft Charge 0123  ');
        attroff(COLOR_PAIR($slot) | A_BOLD);
    }

    # CSS hex preview (for HTML/PDF output)
    my $vars = DC4U::Theme->css_vars($picked);
    my $hex_y = $py + 9;
    if ($hex_y < $self->{bottom} - 2) {
        move($hex_y, $px); clrtoeol();
        attron(A_BOLD | A_UNDERLINE);
        addstr('HTML output palette');
        attroff(A_BOLD | A_UNDERLINE);
        my @keys = qw(bg fg accent header_bg border error success highlight);
        my $row = $hex_y + 1;
        for my $k (@keys) {
            last if $row >= $self->{bottom} - 1;
            move($row, $px); clrtoeol();
            addstr(sprintf("  %-12s %s", $k, $vars->{$k} // ''));
            $row++;
        }
    }

    # help bar (uses live pair 1)
    attron(COLOR_PAIR(1));
    move($h - 2, 0); addstr(' ' x $w);
    move($h - 1, 0); addstr(' ' x $w);
    move($h - 2, 0); addstr(' Up/Down=navigate  Enter=apply theme  q=cancel');
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
