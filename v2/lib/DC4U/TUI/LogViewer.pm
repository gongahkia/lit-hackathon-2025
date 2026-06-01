package DC4U::TUI::LogViewer;

use strict;
use warnings;
use v5.32;
use Curses;

=head1 NAME

DC4U::TUI::LogViewer - TUI screen for viewing session logs

=cut

sub new {
    my ($class, %opts) = @_;
    my $self = {
        top      => $opts{top}      || 3,
        bottom   => $opts{bottom}   || 20,
        width    => $opts{width}    || 80,
        log_file => $opts{log_file} || 'dc4u_tui.log',
        scroll   => 0,
        lines    => [],
    };
    bless $self, $class;
    $self->_load_log();
    return $self;
}

sub _load_log {
    my $self = shift;
    my @lines;
    if (-f $self->{log_file}) {
        open my $fh, '<', $self->{log_file} or return;
        @lines = <$fh>;
        close $fh;
        chomp @lines;
    } else {
        @lines = ('(no log file found)');
    }
    $self->{lines} = \@lines;
    # scroll to bottom by default (most recent entries)
    my $visible = $self->{bottom} - $self->{top} - 1;
    my $max_scroll = scalar(@lines) - $visible;
    $self->{scroll} = $max_scroll > 0 ? $max_scroll : 0;
}

=head2 run

Shows scrollable log viewer. Press q/Esc to return.

=cut

sub run {
    my ($self, $win) = @_;
    my $visible = $self->{bottom} - $self->{top} - 1;
    while (1) {
        $self->_draw($win, $visible);
        my $ch = getch();
        next unless defined $ch;
        if ($ch eq 'q' || $ch eq 'Q') {
            return;
        }
        my $code = (length($ch) == 1) ? ord($ch) : $ch;
        if ($code == 27) { # esc
            return;
        } elsif ($code == KEY_UP || $ch eq 'k') {
            $self->{scroll}-- if $self->{scroll} > 0;
        } elsif ($code == KEY_DOWN || $ch eq 'j') {
            my $max = scalar(@{$self->{lines}}) - $visible;
            $self->{scroll}++ if $self->{scroll} < $max;
        } elsif ($ch eq 'g' || $code == KEY_HOME) { # top
            $self->{scroll} = 0;
        } elsif ($ch eq 'G' || $code == KEY_END) { # bottom
            my $max = scalar(@{$self->{lines}}) - $visible;
            $self->{scroll} = $max > 0 ? $max : 0;
        } elsif ($code == KEY_PPAGE) { # page up
            $self->{scroll} -= $visible;
            $self->{scroll} = 0 if $self->{scroll} < 0;
        } elsif ($code == KEY_NPAGE) { # page down
            my $max = scalar(@{$self->{lines}}) - $visible;
            $self->{scroll} += $visible;
            $self->{scroll} = $max if $self->{scroll} > $max;
        } elsif ($ch eq 'r' || $ch eq 'R') { # reload
            $self->_load_log();
        }
    }
}

sub _draw {
    my ($self, $win, $visible) = @_;
    my $w = $self->{width};
    my $h = getmaxy($win);
    my $lines = $self->{lines};
    my $total = scalar(@$lines);

    # title bar
    attron(COLOR_PAIR(1) | A_BOLD);
    for my $r (0..2) { move($r, 0); addstr(' ' x $w); }
    my $title = 'DC4U - Session Logs';
    move(1, int(($w - length($title)) / 2)); addstr($title);
    attroff(COLOR_PAIR(1) | A_BOLD);

    # subheader: line count + scroll position
    move($self->{top}, 0);
    attron(A_BOLD | A_UNDERLINE);
    my $hdr = sprintf("  Log (%d lines)  [scroll: %d/%d]",
        $total, $self->{scroll} + 1, $total);
    addstr(substr($hdr, 0, $w));
    attroff(A_BOLD | A_UNDERLINE);
    clrtoeol();

    for my $i (0 .. $visible - 1) {
        my $idx = $self->{scroll} + $i;
        my $y = $self->{top} + 1 + $i;
        move($y, 0);
        clrtoeol();
        next if $idx > $#$lines;
        my $line = $lines->[$idx];
        # colorize by level
        if ($line =~ /\[ERROR\]|\[FATAL\]/) {
            attron(COLOR_PAIR(3)); # red
            addstr(substr($line, 0, $w));
            attroff(COLOR_PAIR(3));
        } elsif ($line =~ /\[WARN\]/) {
            attron(COLOR_PAIR(5)); # yellow
            addstr(substr($line, 0, $w));
            attroff(COLOR_PAIR(5));
        } elsif ($line =~ /\[DEBUG\]/) {
            attron(A_DIM);
            addstr(substr($line, 0, $w));
            attroff(A_DIM);
        } else {
            addstr(substr($line, 0, $w));
        }
    }

    # help bar
    attron(COLOR_PAIR(1));
    move($h - 2, 0); addstr(' ' x $w);
    move($h - 1, 0); addstr(' ' x $w);
    move($h - 2, 0); addstr(' Up/Down=scroll  g/G=top/bottom  PgUp/PgDn  r=reload  q=back');
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
