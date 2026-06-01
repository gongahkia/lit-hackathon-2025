package DC4U::TUI;

use strict;
use warnings;
use v5.32;

use Curses;
use FindBin;
use lib "$FindBin::Bin/../lib";

use DC4U;
use DC4U::Config;
use DC4U::Logger;
use DC4U::Theme;
use DC4U::TUI::FileBrowser;
use DC4U::TUI::FormatSelector;
use DC4U::TUI::JurisdictionSelector;
use DC4U::TUI::ThemeSelector;
use DC4U::TUI::Progress;
use DC4U::TUI::Preview;
use DC4U::TUI::ErrorDisplay;
use DC4U::TUI::ChargeNav;
use DC4U::TUI::LogViewer;
use DC4U::TUI::DirBrowser;

# Map color name -> curses COLOR_* constant. Keep in sync with
# DC4U::Theme::CURSES_OK.
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

=head1 NAME

DC4U::TUI - Terminal User Interface controller

=head1 DESCRIPTION

Manages screen layout (header, content area, status bar) and dispatches
to sub-screens: FileBrowser, FormatSelector, JurisdictionSelector,
Progress, Preview, ErrorDisplay, ChargeNav.

=cut

sub new {
    my ($class, %opts) = @_;
    my $log_file = $opts{log_file} || 'dc4u_tui.log';
    my $self = {
        config   => DC4U::Config->new($opts{config_file}),
        logger   => DC4U::Logger->new('DEBUG', log_file => $log_file),
        screen   => undef,
        header_h => 3,
        status_h => 2,
        running  => 1,
    };
    bless $self, $class;
    return $self;
}

=head2 run

Main entry point. Initializes curses then drives the interactive flow:
select file → jurisdiction → format → process → preview → confirm write.

=cut

sub run {
    my $self = shift;
    $self->{logger}->info('TUI session started');
    $self->_init_curses();
    eval { $self->_main_flow(); };
    my $err = $@;
    $self->_end_curses();
    $self->{logger}->info('TUI session ended');
    die $err if $err;
}

sub _init_curses {
    my $self = shift;
    initscr();
    start_color() if has_colors();
    $self->_apply_theme($self->{config}->get('theme'));
    noecho();
    cbreak();
    curs_set(0);
    keypad(stdscr, 1);
    $self->{screen} = stdscr;
}

# Re-applies color pairs from the named theme. Safe to call mid-session
# (the ThemeSelector screen calls it after the user picks a new theme).
#
# Two paths:
#   1. true-color: terminal supports init_color() AND the user hasn't
#      opted out via $DC4U_NO_TRUECOLOR. We reprogram color slots
#      16..25 with the theme's exact hex RGB and pair them.
#   2. fallback: 8 baseline colors via $CURSES_COLOR. The 8-color names
#      in DC4U::Theme are picked to be the closest match for each slot
#      so the TUI still feels themed even without true-color.
sub _apply_theme {
    my ($self, $theme_name) = @_;
    return unless has_colors();

    my $theme = DC4U::Theme->get($theme_name);
    my $pairs = DC4U::Theme->curses_pairs($theme_name);

    if (!$ENV{DC4U_NO_TRUECOLOR} && _can_truecolor()) {
        _apply_theme_truecolor($theme);
    } else {
        for my $slot (sort { $a <=> $b } keys %$pairs) {
            my ($fg, $bg) = @{ $pairs->{$slot} };
            my $fg_c = $CURSES_COLOR{$fg} // COLOR_WHITE;
            my $bg_c = $CURSES_COLOR{$bg} // COLOR_BLACK;
            init_pair($slot, $fg_c, $bg_c);
        }
    }
    $self->{theme} = $theme_name;
}

# True-color path:
#   - Reprograms color indices 16..25 with theme hex RGB on the 0..1000
#     scale curses uses
#   - Indices intentionally above 16 so we don't clobber the standard
#     8 + 8-bright colors other terminal apps may rely on
sub _apply_theme_truecolor {
    my ($theme) = @_;
    my $css = $theme->{css};

    # Slot N: { fg_idx, bg_idx, fg_hex, bg_hex }
    # Mapping mirrors the semantic intent of pairs 1..5 in the fallback path.
    my @SLOTS = (
        # slot, fg_hex,             bg_hex
        [ 1,  $css->{header_fg}, $css->{header_bg} ],   # header / status
        [ 2,  $css->{fg},        $css->{bg} ],          # content
        [ 3,  $css->{error},     $css->{bg} ],          # error
        [ 4,  $css->{success},   $css->{bg} ],          # success
        [ 5,  $css->{highlight}, $css->{bg} ],          # highlight
    );

    # Allocate one curses color slot per unique hex value in the theme,
    # starting at 16 (above the bright-color range).
    my %hex_to_slot;
    my $next = 16;
    for my $entry (@SLOTS) {
        for my $hex (@$entry[1, 2]) {
            next if exists $hex_to_slot{$hex};
            my ($r, $g, $b) = _hex_to_curses_rgb($hex);
            init_color($next, $r, $g, $b);
            $hex_to_slot{$hex} = $next;
            $next++;
        }
    }

    for my $entry (@SLOTS) {
        my ($pair, $fg_hex, $bg_hex) = @$entry;
        init_pair($pair, $hex_to_slot{$fg_hex}, $hex_to_slot{$bg_hex});
    }
}

# Curses init_color expects RGB on a 0..1000 scale, not 0..255.
sub _hex_to_curses_rgb {
    my $hex = shift;
    $hex =~ s/^#//;
    my ($r, $g, $b) = map { hex } unpack 'A2A2A2', $hex;
    return (
        int($r * 1000 / 255),
        int($g * 1000 / 255),
        int($b * 1000 / 255),
    );
}

# True-color requires both can_change_color() (terminal lets us reprogram
# palette entries) AND COLORS >= 16 (we have somewhere to put them).
# init_color and can_change_color may not exist on all Curses builds, so
# wrap their probing in eval.
sub _can_truecolor {
    return 0 unless eval { can_change_color() };
    return 0 unless eval { COLORS() >= 16 };
    return 0 unless eval { defined &init_color };
    return 1;
}

sub _end_curses {
    endwin();
}

sub _draw_header {
    my ($self, $title) = @_;
    $title //= 'DC4U — Draft Charges 4 U';
    my $w = getmaxx($self->{screen});
    attron(COLOR_PAIR(1) | A_BOLD);
    for my $r (0 .. $self->{header_h} - 1) {
        move($r, 0);
        addstr(' ' x $w);
    }
    my $centered = int(($w - length($title)) / 2);
    $centered = 0 if $centered < 0;
    move(1, $centered);
    addstr($title);
    attroff(COLOR_PAIR(1) | A_BOLD);
}

sub _draw_status {
    my ($self, $msg) = @_;
    $msg //= '';
    my $h = getmaxy($self->{screen});
    my $w = getmaxx($self->{screen});
    my $y = $h - $self->{status_h};
    attron(COLOR_PAIR(1));
    for my $r ($y .. $h - 1) {
        move($r, 0);
        addstr(' ' x $w);
    }
    move($y, 1);
    addstr(substr($msg, 0, $w - 2));
    attroff(COLOR_PAIR(1));
}

sub _content_region {
    my $self = shift;
    my $h = getmaxy($self->{screen});
    my $w = getmaxx($self->{screen});
    my $top = $self->{header_h};
    my $bot = $h - $self->{status_h};
    return ($top, $bot, $w);
}

sub _clear_content {
    my $self = shift;
    my ($top, $bot, $w) = $self->_content_region();
    for my $r ($top .. $bot - 1) {
        move($r, 0);
        clrtoeol();
    }
}

sub _main_flow {
    my $self = shift;
    my $log = $self->{logger};

    # step 1: file browser (loops back if user opens log viewer)
    my ($top, $bot, $w) = $self->_content_region();
    my $file;
    while (1) {
        $log->info('Screen: FileBrowser');
        $self->_draw_header('DC4U - Select Input File');
        $self->_draw_status('Up/Down=navigate  Enter=select  l=view logs  q=quit');
        refresh();
        my $fb = DC4U::TUI::FileBrowser->new(
            top => $top, bottom => $bot, width => $w
        );
        $file = $fb->run($self->{screen});
        unless ($file) { $log->info('User quit at FileBrowser'); return; }
        if ($file eq '__VIEW_LOGS__') {
            $log->info('User opened LogViewer');
            erase();
            $self->_draw_header('DC4U - Session Logs');
            $self->_draw_status('Up/Down=scroll  g/G=top/bottom  r=reload  q=back');
            refresh();
            my $lv = DC4U::TUI::LogViewer->new(
                top => $top, bottom => $bot, width => $w,
                log_file => $self->{logger}->{log_file} // 'dc4u_tui.log',
            );
            $lv->run($self->{screen});
            next; # loop back to file browser
        }
        if ($file eq '__SELECT_THEME__') {
            $log->info('User opened ThemeSelector');
            erase();
            $self->_draw_header('DC4U - Select Color Theme');
            $self->_draw_status('Up/Down=navigate  Enter=apply  q=cancel');
            refresh();
            my $ts = DC4U::TUI::ThemeSelector->new(
                top => $top, bottom => $bot, width => $w,
                current => $self->{config}->get('theme'),
            );
            my $picked = $ts->run($self->{screen});
            if ($picked) {
                $log->info("Theme selected: $picked");
                $self->{config}->set('theme', $picked);
                $self->_apply_theme($picked);
            }
            next; # loop back to file browser
        }
        last; # valid file selected
    }
    $log->info("File selected: $file");

    # step 2: jurisdiction selector
    $log->info('Screen: JurisdictionSelector');
    $self->_clear_content();
    $self->_draw_header('DC4U — Select Jurisdiction');
    $self->_draw_status('Navigate with ↑↓, Enter to select');
    refresh();
    my $js = DC4U::TUI::JurisdictionSelector->new(
        top => $top, bottom => $bot, width => $w,
        config => $self->{config},
    );
    my $jurisdiction = $js->run($self->{screen});
    unless ($jurisdiction) { $log->info('User quit at JurisdictionSelector'); return; }
    $log->info("Jurisdiction selected: $jurisdiction");
    $self->{config}->set('jurisdiction', $jurisdiction);

    # step 3: format selector
    $log->info('Screen: FormatSelector');
    $self->_clear_content();
    $self->_draw_header('DC4U — Select Output Format');
    $self->_draw_status('Navigate with ↑↓, Enter to select');
    refresh();
    my $fs = DC4U::TUI::FormatSelector->new(
        top => $top, bottom => $bot, width => $w
    );
    my $format = $fs->run($self->{screen});
    unless ($format) { $log->info('User quit at FormatSelector'); return; }
    $log->info("Format selected: $format");

    # step 4: process with progress
    $log->info("Processing file=$file format=$format jurisdiction=$jurisdiction");
    $self->_clear_content();
    $self->_draw_header('DC4U — Processing');
    $self->_draw_status('Processing...');
    refresh();
    my $pg = DC4U::TUI::Progress->new(
        top => $top, bottom => $bot, width => $w
    );
    my ($results, $proc_err);
    $pg->start($self->{screen});
    eval {
        my $options = {
            output_format => $format,
            config_file   => $self->{config}->{config_file},
        };
        $results = DC4U::process_dc_file($file, $format, $options);
    };
    $proc_err = $@;
    $pg->finish($self->{screen}, !$proc_err);

    if ($proc_err) {
        $log->error("Processing error: $proc_err");
        $self->_clear_content();
        $self->_draw_header('DC4U — Error');
        $self->_draw_status('Press any key to exit');
        refresh();
        my $ed = DC4U::TUI::ErrorDisplay->new(
            top => $top, bottom => $bot, width => $w
        );
        $ed->show($self->{screen}, $proc_err);
        return;
    }

    unless ($results && @$results > 0) {
        $log->error('No output generated');
        $self->_clear_content();
        $self->_draw_header('DC4U — Error');
        $self->_draw_status('Press any key to exit');
        refresh();
        my $ed = DC4U::TUI::ErrorDisplay->new(
            top => $top, bottom => $bot, width => $w
        );
        $ed->show($self->{screen}, 'No output generated.');
        return;
    }

    $log->info('Processing complete, ' . scalar(@$results) . ' charge(s) generated');

    # step 5: preview (with charge nav if multiple charges)
    my $selected_result;
    if (@$results > 1) {
        $log->info('Screen: ChargeNav (' . scalar(@$results) . ' charges)');
        $self->_clear_content();
        $self->_draw_header('DC4U — Charge Navigator');
        $self->_draw_status('Tab between charges, Enter to preview');
        refresh();
        my $cn = DC4U::TUI::ChargeNav->new(
            top => $top, bottom => $bot, width => $w,
            results => $results,
        );
        $selected_result = $cn->run($self->{screen});
    } else {
        $selected_result = $results->[0];
    }
    unless ($selected_result) { $log->info('User quit at Preview/ChargeNav'); return; }

    $log->info('Screen: Preview');
    $self->_clear_content();
    $self->_draw_header('DC4U — Preview');
    $self->_draw_status('Enter to confirm write, q to cancel');
    refresh();
    my $pv = DC4U::TUI::Preview->new(
        top => $top, bottom => $bot, width => $w
    );
    my $confirmed = $pv->show($self->{screen}, $selected_result);
    unless ($confirmed) { $log->info('User cancelled write at Preview'); return; }

    # step 6: select output directory
    $log->info('Screen: DirBrowser (Output)');
    $self->_draw_header('DC4U - Select Output Directory');
    $self->_draw_status('Navigate/Enter to change dir, Space/s to select current as destination');
    refresh();

    require File::Basename;
    my ($name, $path, $suffix) = File::Basename::fileparse($file, qr/\.[^.]*$/);
    
    my $db = DC4U::TUI::DirBrowser->new(
        top => $top, bottom => $bot, width => $w,
        start_dir => $path,
    );
    my $out_dir = $db->run($self->{screen});
    unless ($out_dir) { $log->info('User quit at DirBrowser'); return; }

    # step 7: write to disk
    my $ext = lc($format);
    $ext = 'Rmd' if $ext eq 'rmd';
    my $outfile = "${out_dir}/${name}.${ext}";

    $log->info("Writing output to: $outfile");
    eval {
        open my $fh, '>', $outfile or die "Cannot write $outfile: $!";
        if ($ext eq 'pdf') {
            binmode $fh;
        } else {
            binmode $fh, ':encoding(UTF-8)';
        }
        
        if (ref $selected_result eq 'HASH') {
            print $fh $selected_result->{output};
        } else {
            print $fh $selected_result;
        }
        close $fh;
    };
    if ($@) {
        $log->error("Write error: $@");
        $self->_clear_content();
        $self->_draw_header('DC4U — Write Error');
        $self->_draw_status('Press any key');
        refresh();
        my $ed = DC4U::TUI::ErrorDisplay->new(
            top => $top, bottom => $bot, width => $w
        );
        $ed->show($self->{screen}, $@);
        return;
    }

    $log->info("File written successfully: $outfile");
    $self->_clear_content();
    $self->_draw_header('DC4U — Complete');
    $self->_draw_status('Press any key to exit');
    refresh();
    my ($ct, $cb, $cw) = $self->_content_region();
    my $msg = "File written: $outfile";
    attron(COLOR_PAIR(4) | A_BOLD);
    move(int(($ct + $cb) / 2), int(($cw - length($msg)) / 2));
    addstr($msg);
    attroff(COLOR_PAIR(4) | A_BOLD);
    refresh();
    getch();
}

1;

__END__

=head1 AUTHOR

DC4U Development Team

=head1 LICENSE

This software is licensed under the MIT License.

=cut
