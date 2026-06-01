package DC4U::TUI::Progress;

use strict;
use warnings;
use v5.32;
use Curses;
use Time::HiRes qw(time sleep);

=head1 NAME

DC4U::TUI::Progress - TUI progress screen with pipeline steps

=cut

my @STEPS = ('Lexing', 'Parsing', 'Generating');
my @SPINNER = ('⠋','⠙','⠹','⠸','⠼','⠴','⠦','⠧','⠇','⠏');

sub new {
    my ($class, %opts) = @_;
    my $self = {
        top    => $opts{top}    || 3,
        bottom => $opts{bottom} || 20,
        width  => $opts{width}  || 80,
        start_time => 0,
    };
    bless $self, $class;
    return $self;
}

=head2 start

Displays animated progress for the processing pipeline.

=cut

sub start {
    my ($self, $win) = @_;
    $self->{start_time} = time();
    my $w = $self->{width};

    for my $si (0 .. $#STEPS) {
        my $step = $STEPS[$si];
        my $y = $self->{top} + $si * 2;
        # animate spinner for this step
        for my $frame (0 .. 5) {
            move($y, 2);
            clrtoeol();
            my $elapsed = sprintf("%.1fs", time() - $self->{start_time});
            my $spinner = $SPINNER[$frame % scalar(@SPINNER)];
            attron(COLOR_PAIR(5));
            addstr("$spinner $step... [$elapsed]");
            attroff(COLOR_PAIR(5));
            # progress bar
            move($y + 1, 4);
            clrtoeol();
            my $bar_w = int($w * 0.5);
            my $filled = int($bar_w * ($frame + 1) / 6);
            my $empty = $bar_w - $filled;
            addstr('[' . ('█' x $filled) . ('░' x $empty) . ']');
            refresh();
            sleep(0.08);
        }
        # mark complete
        move($y, 2);
        clrtoeol();
        attron(COLOR_PAIR(4));
        addstr("✓ $step — done");
        attroff(COLOR_PAIR(4));
        refresh();
    }
}

=head2 finish

Shows final status.

=cut

sub finish {
    my ($self, $win, $success) = @_;
    my $elapsed = sprintf("%.2fs", time() - $self->{start_time});
    my $y = $self->{top} + scalar(@STEPS) * 2 + 1;
    move($y, 2);
    clrtoeol();
    if ($success) {
        attron(COLOR_PAIR(4) | A_BOLD);
        addstr("Pipeline complete in $elapsed");
        attroff(COLOR_PAIR(4) | A_BOLD);
    } else {
        attron(COLOR_PAIR(3) | A_BOLD);
        addstr("Pipeline failed after $elapsed");
        attroff(COLOR_PAIR(3) | A_BOLD);
    }
    refresh();
    sleep(0.5);
}

1;

__END__

=head1 AUTHOR

DC4U Development Team

=head1 LICENSE

This software is licensed under the MIT License.

=cut
