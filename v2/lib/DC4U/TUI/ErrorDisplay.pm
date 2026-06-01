package DC4U::TUI::ErrorDisplay;

use strict;
use warnings;
use v5.32;
use Curses;

=head1 NAME

DC4U::TUI::ErrorDisplay - TUI screen for displaying parse/generation errors

=cut

sub new {
    my ($class, %opts) = @_;
    my $self = {
        top    => $opts{top}    || 3,
        bottom => $opts{bottom} || 20,
        width  => $opts{width}  || 80,
    };
    bless $self, $class;
    return $self;
}

=head2 show

Renders error with source line context, caret pointing to error column,
and suggested fix text. Waits for keypress.

=cut

sub show {
    my ($self, $win, $error) = @_;
    my $w = $self->{width};
    my $y = $self->{top};

    # error title
    move($y, 2);
    attron(COLOR_PAIR(3) | A_BOLD);
    addstr("ERROR");
    attroff(COLOR_PAIR(3) | A_BOLD);
    $y++;

    # parse error string for line/column info
    my ($err_line, $err_col, $err_msg) = _parse_error($error);

    # separator
    move($y, 2);
    addstr('─' x ($w - 4));
    $y++;

    # error message
    my @msg_lines = _wrap($err_msg, $w - 6);
    for my $ml (@msg_lines) {
        last if $y >= $self->{bottom} - 3;
        move($y, 4);
        attron(COLOR_PAIR(3));
        addstr(substr($ml, 0, $w - 6));
        attroff(COLOR_PAIR(3));
        $y++;
    }
    $y++;

    # source context with caret
    if (defined $err_line && defined $err_col) {
        if ($y < $self->{bottom} - 2) {
            move($y, 4);
            addstr(sprintf("at line %d, column %d", $err_line, $err_col));
            $y++;
        }
        if ($y < $self->{bottom} - 1) {
            move($y, 4);
            attron(COLOR_PAIR(5));
            addstr((' ' x ($err_col - 1)) . '^ here');
            attroff(COLOR_PAIR(5));
            $y++;
        }
    }
    $y++;

    # suggested fix
    my $fix = _suggest_fix($err_msg);
    if ($fix && $y < $self->{bottom} - 1) {
        move($y, 2);
        attron(COLOR_PAIR(4));
        addstr("Suggestion: $fix");
        attroff(COLOR_PAIR(4));
    }

    refresh();
    getch(); # wait for keypress
}

sub _parse_error {
    my $err = shift // '';
    my ($line, $col, $msg);
    if ($err =~ /at line (\d+),?\s*column (\d+)/i) {
        $line = $1;
        $col  = $2;
    } elsif ($err =~ /at line (\d+)/i) {
        $line = $1;
        $col  = 1;
    }
    $msg = $err;
    $msg =~ s/\s+at\s+\S+\s+line\s+\d+.*//; # strip perl die location
    return ($line, $col, $msg);
}

sub _suggest_fix {
    my $msg = shift // '';
    return 'Check that all 6 suspect fields are separated by semicolons (;)'
        if $msg =~ /suspect.*format/i;
    return 'Check that charge has 3 fields: title; date; explanation'
        if $msg =~ /charge.*format/i;
    return 'Check that officer info has 3 fields: name; role; date'
        if $msg =~ /officer.*format/i;
    return 'Use DD/MM/YYYY format or "D Month YYYY" format'
        if $msg =~ /date/i;
    return 'Specify output format with backtick: `PDF`'
        if $msg =~ /output format/i;
    return 'Ensure matching delimiters: < > [ ] { } @ @ # #'
        if $msg =~ /unmatched/i;
    return undef;
}

sub _wrap {
    my ($text, $max) = @_;
    my @lines;
    while (length($text) > $max) {
        my $cut = rindex($text, ' ', $max);
        $cut = $max if $cut <= 0;
        push @lines, substr($text, 0, $cut);
        $text = substr($text, $cut);
        $text =~ s/^\s+//;
    }
    push @lines, $text if length($text);
    return @lines;
}

1;

__END__

=head1 AUTHOR

DC4U Development Team

=head1 LICENSE

This software is licensed under the MIT License.

=cut
