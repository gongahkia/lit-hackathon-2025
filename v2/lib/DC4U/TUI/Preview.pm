package DC4U::TUI::Preview;

use strict;
use warnings;
use v5.32;
use Curses;

=head1 NAME

DC4U::TUI::Preview - TUI preview screen for generated charge output

=cut

sub new {
    my ($class, %opts) = @_;
    my $self = {
        top    => $opts{top}    || 3,
        bottom => $opts{bottom} || 20,
        width  => $opts{width}  || 80,
        scroll => 0,
    };
    bless $self, $class;
    return $self;
}

=head2 show

Renders the generated charge output as formatted terminal text.
HTML tags stripped, fields highlighted with ANSI colors.
Returns 1 if user confirms write, undef if cancelled.

=cut

sub show {
    my ($self, $win, $result) = @_;
    my $raw = ref $result eq 'HASH' ? ($result->{output} // '') : ($result // '');
    my $text = _strip_html($raw);
    my @lines = split /\n/, $text;
    @lines = grep { /\S/ } @lines; # remove blank lines for density
    my $visible = $self->{bottom} - $self->{top};

    while (1) {
        $self->_draw_lines($win, \@lines, $visible);
        my $ch = getch();
        next unless defined $ch;
        if ($ch eq 'q' || $ch eq 'Q') {
            return undef;
        }
        my $code = (length($ch) == 1) ? ord($ch) : $ch;
        if ($code == KEY_UP || $ch eq 'k') {
            $self->{scroll}-- if $self->{scroll} > 0;
        } elsif ($code == KEY_DOWN || $ch eq 'j') {
            $self->{scroll}++ if $self->{scroll} + $visible < scalar(@lines);
        } elsif ($code == 10 || $code == 13 || $code == KEY_ENTER) {
            return 1;
        }
    }
}

sub _draw_lines {
    my ($self, $win, $lines, $visible) = @_;
    my $w = $self->{width};
    my $h = getmaxy($win);

    # title bar
    attron(COLOR_PAIR(1) | A_BOLD);
    for my $r (0..2) { move($r, 0); addstr(' ' x $w); }
    my $title = 'DC4U - Preview Output';
    move(1, int(($w - length($title)) / 2)); addstr($title);
    attroff(COLOR_PAIR(1) | A_BOLD);

    for my $i (0 .. $visible - 1) {
        my $idx = $self->{scroll} + $i;
        my $y = $self->{top} + $i;
        move($y, 0);
        clrtoeol();
        next if $idx > $#$lines;
        my $line = $lines->[$idx];
        # highlight field labels (Name:, NRIC:, etc.)
        if ($line =~ /^(\s*\S+:)(.*)$/) {
            attron(COLOR_PAIR(5) | A_BOLD);
            addstr(substr($1, 0, $w));
            attroff(COLOR_PAIR(5) | A_BOLD);
            addstr(substr($2, 0, $w - length($1)));
        } elsif ($line =~ /CHARGE|Criminal Procedure|Criminal Justice/i) {
            attron(A_BOLD | A_UNDERLINE);
            addstr(substr($line, 0, $w));
            attroff(A_BOLD | A_UNDERLINE);
        } else {
            addstr(substr($line, 0, $w));
        }
    }

    # help bar
    attron(COLOR_PAIR(1));
    move($h - 2, 0); addstr(' ' x $w);
    move($h - 1, 0); addstr(' ' x $w);
    move($h - 2, 0); addstr(' Up/Down=scroll  Enter=confirm write to disk  q=cancel');
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
    $html =~ s/&quot;/"/g;
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
