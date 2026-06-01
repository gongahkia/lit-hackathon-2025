package DC4U::TUI::ChargeNav;

use strict;
use warnings;
use v5.32;
use Curses;

=head1 NAME

DC4U::TUI::ChargeNav - TUI charge navigator for multi-charge .dc files

=cut

sub new {
    my ($class, %opts) = @_;
    my $self = {
        top     => $opts{top}     || 3,
        bottom  => $opts{bottom}  || 20,
        width   => $opts{width}   || 80,
        results => $opts{results} || [],
        cursor  => 0,
    };
    bless $self, $class;
    return $self;
}

=head2 run

Shows charge index sidebar, per-charge format override, and tab between charges.
Returns selected result hashref or undef on quit.

=cut

sub run {
    my ($self, $win) = @_;
    my $results = $self->{results};
    return undef unless @$results;
    my $sidebar_w = 25;
    my $preview_x = $sidebar_w + 1;
    my $visible = $self->{bottom} - $self->{top};

    while (1) {
        $self->_draw($win, $sidebar_w, $preview_x, $visible);
        my $ch = getch();
        next unless defined $ch;
        if ($ch eq 'q' || $ch eq 'Q') {
            return undef;
        }
        my $code = (length($ch) == 1) ? ord($ch) : $ch;
        if ($code == KEY_UP || $ch eq 'k') {
            $self->{cursor}-- if $self->{cursor} > 0;
        } elsif ($code == KEY_DOWN || $ch eq 'j') {
            $self->{cursor}++ if $self->{cursor} < $#$results;
        } elsif ($code == 9) { # tab
            $self->{cursor} = ($self->{cursor} + 1) % scalar(@$results);
        } elsif ($code == 10 || $code == 13 || $code == KEY_ENTER) {
            return $results->[$self->{cursor}];
        }
    }
}

sub _draw {
    my ($self, $win, $sidebar_w, $preview_x, $visible) = @_;
    my $results = $self->{results};
    my $w = $self->{width};
    my $h = getmaxy($win);

    # title bar
    attron(COLOR_PAIR(1) | A_BOLD);
    for my $r (0..2) { move($r, 0); addstr(' ' x $w); }
    my $title = 'DC4U - Charge Navigator';
    move(1, int(($w - length($title)) / 2)); addstr($title);
    attroff(COLOR_PAIR(1) | A_BOLD);

    # sidebar: charge index
    for my $i (0 .. $#$results) {
        my $y = $self->{top} + $i;
        last if $y >= $self->{bottom};
        move($y, 0);
        clrtoeol();
        my $r = $results->[$i];
        my $sel = ($i == $self->{cursor});
        my $label = sprintf("%s Charge %d [%s]",
            $sel ? '>' : ' ',
            $r->{charge_number} // ($i + 1),
            $r->{format} // '?',
        );
        if ($sel) {
            attron(A_REVERSE);
            addstr(substr($label, 0, $sidebar_w));
            attroff(A_REVERSE);
        } else {
            addstr(substr($label, 0, $sidebar_w));
        }
    }

    # vertical divider
    for my $y ($self->{top} .. $self->{bottom} - 1) {
        move($y, $sidebar_w);
        addstr('|');
    }

    # preview pane: show stripped output of selected charge
    my $cur = $results->[$self->{cursor}];
    my $raw = ref $cur eq 'HASH' ? ($cur->{output} // '') : '';
    my $text = _strip_html($raw);
    my @lines = split /\n/, $text;
    @lines = grep { /\S/ } @lines;
    my $pw = $w - $preview_x - 1;
    for my $i (0 .. $visible - 1) {
        my $y = $self->{top} + $i;
        move($y, $preview_x);
        my $content = $i <= $#lines ? $lines[$i] : '';
        addstr(substr($content, 0, $pw));
        clrtoeol();
    }

    # help bar
    attron(COLOR_PAIR(1));
    move($h - 2, 0); addstr(' ' x $w);
    move($h - 1, 0); addstr(' ' x $w);
    move($h - 2, 0); addstr(' Up/Down=navigate  Tab=cycle  Enter=preview  q=back');
    attroff(COLOR_PAIR(1));

    refresh();
}

sub _strip_html {
    my $html = shift;
    $html =~ s/<br\s*\/?>/\n/gi;
    $html =~ s/<\/(?:p|div|h[1-6]|li|tr)>/\n/gi;
    $html =~ s/<[^>]+>//g;
    $html =~ s/&nbsp;/ /g;
    $html =~ s/&amp;/&/g;
    $html =~ s/&lt;/</g;
    $html =~ s/&gt;/>/g;
    $html =~ s/^\s+//gm;
    return $html;
}

1;

__END__

=head1 AUTHOR

DC4U Development Team

=head1 LICENSE

This software is licensed under the MIT License.

=cut
