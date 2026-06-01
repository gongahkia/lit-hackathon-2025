package DC4U::TUI::DirBrowser;

use strict;
use warnings;
use v5.32;
use Curses;
use Cwd qw(getcwd abs_path);
use File::Basename qw(dirname);

=head1 NAME

DC4U::TUI::DirBrowser - TUI screen for selecting an output directory

=cut

sub new {
    my ($class, %opts) = @_;
    my $self = {
        top    => $opts{top}    || 3,
        bottom => $opts{bottom} || 20,
        width  => $opts{width}  || 80,
        cwd    => $opts{start_dir} || getcwd(),
        cursor => 0,
        scroll => 0,
        entries => [],
    };
    bless $self, $class;
    $self->_scan_dir();
    return $self;
}

sub _scan_dir {
    my $self = shift;
    my $dir = $self->{cwd};
    my @entries;
    opendir(my $dh, $dir) or return;
    while (my $e = readdir($dh)) {
        next if $e eq '.';
        my $full = "$dir/$e";
        if ($e eq '..') {
            push @entries, { name => '..', path => abs_path($full) // dirname($dir), is_dir => 1 };
        } elsif (-d $full && $e !~ /^\./) {
            push @entries, { name => "$e/", path => $full, is_dir => 1 };
        }
    }
    closedir($dh);
    # sort: .. first, then dirs alphabetically
    @entries = sort {
        if ($a->{name} eq '..') { return -1; }
        if ($b->{name} eq '..') { return 1; }
        lc($a->{name}) cmp lc($b->{name});
    } @entries;
    $self->{entries} = \@entries;
    $self->{cursor} = 0;
    $self->{scroll} = 0;
}

=head2 run

Browse directories and select one.
Returns selected directory path or undef on quit.

=cut

sub run {
    my ($self, $win) = @_;
    my $visible = $self->{bottom} - $self->{top} - 2;
    while (1) {
        erase();
        $self->_draw($win, $visible);
        my $ch = getch();
        next unless defined $ch;
        if ($ch eq 'q' || $ch eq 'Q') {
            return undef;
        }
        my $code = (length($ch) == 1) ? ord($ch) : $ch;
        if ($code == KEY_UP || $ch eq 'k') {
            $self->{cursor}-- if $self->{cursor} > 0;
            $self->{scroll}-- if $self->{cursor} < $self->{scroll};
        } elsif ($code == KEY_DOWN || $ch eq 'j') {
            if ($self->{cursor} < $#{$self->{entries}}) {
                $self->{cursor}++;
                $self->{scroll}++ if $self->{cursor} >= $self->{scroll} + $visible;
            }
        } elsif ($code == KEY_BACKSPACE || $code == 127 || $ch eq '-') { # go up
            $self->{cwd} = dirname($self->{cwd});
            $self->_scan_dir();
        } elsif ($code == 10 || $code == 13 || $code == KEY_ENTER) { # enter dir
            my $entry = $self->{entries}[$self->{cursor}];
            next unless $entry;
            $self->{cwd} = $entry->{path};
            $self->_scan_dir();
        } elsif ($ch eq ' ' || $ch eq 's' || $ch eq 'S') { # select current
            return $self->{cwd};
        }
    }
}

sub _draw {
    my ($self, $win, $visible) = @_;
    my $w = $self->{width};
    my $h = getmaxy($win);

    # title bar
    attron(COLOR_PAIR(1) | A_BOLD);
    for my $r (0..2) { move($r, 0); addstr(' ' x $w); }
    my $title = 'DC4U - Select Output Directory';
    my $cx = int(($w - length($title)) / 2);
    $cx = 0 if $cx < 0;
    move(1, $cx); addstr($title);
    attroff(COLOR_PAIR(1) | A_BOLD);

    # current path
    move($self->{top}, 0);
    attron(A_DIM);
    my $path_label = " Current: $self->{cwd}";
    addstr(substr($path_label, 0, $w));
    attroff(A_DIM);
    clrtoeol();

    # column header
    move($self->{top} + 1, 0);
    attron(A_BOLD | A_UNDERLINE);
    my $hdr = sprintf("  %-40s", "Directory Name");
    addstr(substr($hdr, 0, $w));
    attroff(A_BOLD | A_UNDERLINE);
    clrtoeol();

    # entries
    for my $i (0 .. $visible - 1) {
        my $idx = $self->{scroll} + $i;
        my $y = $self->{top} + 2 + $i;
        move($y, 0);
        clrtoeol();
        next if $idx > $#{$self->{entries}};
        my $e = $self->{entries}[$idx];
        my $sel = ($idx == $self->{cursor});
        my $line = sprintf("%s %-40s",
            $sel ? '>' : ' ', $e->{name});
        
        if ($sel) {
            attron(A_REVERSE);
            addstr(substr($line, 0, $w));
            attroff(A_REVERSE);
        } else {
            attron(A_BOLD); # dirs are bold
            addstr(substr($line, 0, $w));
            attroff(A_BOLD);
        }
    }

    # help bar
    my $help = ' Up/Down=nav  Enter=open  Space/s=select current  Bksp=up  q=quit';
    attron(COLOR_PAIR(1));
    move($h - 2, 0); addstr(' ' x $w);
    move($h - 1, 0); addstr(' ' x $w);
    move($h - 2, 0); addstr(substr($help, 0, $w));
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
