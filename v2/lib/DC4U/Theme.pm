package DC4U::Theme;

use strict;
use warnings;
use v5.32;

=head1 NAME

DC4U::Theme - Color scheme registry for TUI and HTML output

=head1 SYNOPSIS

    use DC4U::Theme;

    my @names = DC4U::Theme->available;          # ('classic', 'gruvbox-dark', ...)
    my $t     = DC4U::Theme->get('gruvbox-dark');

    # CSS variables for HTML/PDF output
    my $css = DC4U::Theme->css_block('gruvbox-dark');

    # Curses color pairs, returned as
    #   { 1 => ['white', 'blue'], 2 => ['black', 'white'], ... }
    my $pairs = DC4U::Theme->curses_pairs('gruvbox-dark');

=head1 DESCRIPTION

Single source of truth for color schemes used across DC4U surfaces:

  * Curses TUI  - five color-pair slots (header, content, error, success,
                  highlight). Mapped to the 8 baseline curses colors plus
                  bright variants via A_BOLD.
  * HTML output - eleven CSS custom properties consumed by charge.css and
                  injected at render time.

Themes are intentionally declarative (pure data) so adding a new one is a
single hash entry; no glue code is required.

=cut

# 8 baseline curses color names. The TUI layer maps these to the
# COLOR_BLACK..COLOR_WHITE constants. Append "+bold" to request the
# bright variant via A_BOLD.
my @CURSES_OK = qw(black red green yellow blue magenta cyan white);
my %CURSES_OK = map { $_ => 1 } @CURSES_OK;

# Default theme - matches the previous hardcoded look so existing users see
# no visual regression on upgrade.
my $CLASSIC = {
    label => 'Classic (default)',
    desc  => 'The original DC4U palette. Black ink, light suspect panel.',
    css   => {
        bg          => '#ffffff',
        fg          => '#333333',
        accent      => '#333333',
        header_bg   => '#ffffff',
        header_fg   => '#000000',
        border      => '#333333',
        suspect_bg  => '#f9f9f9',
        suspect_fg  => '#333333',
        error       => '#b00020',
        success     => '#006400',
        highlight   => '#b8860b',
        link        => '#0645ad',
    },
    tui => {
        1 => ['white',  'blue'],   # header / status bar
        2 => ['black',  'white'],  # content
        3 => ['red',    'black'],  # error
        4 => ['green',  'black'],  # success
        5 => ['yellow', 'black'],  # highlight
    },
};

my $GRUVBOX_DARK = {
    label => 'Gruvbox Dark',
    desc  => 'Warm retro palette by morhetz. Brown background, amber accents.',
    css   => {
        bg          => '#282828',
        fg          => '#ebdbb2',
        accent      => '#fabd2f',
        header_bg   => '#3c3836',
        header_fg   => '#fbf1c7',
        border      => '#665c54',
        suspect_bg  => '#3c3836',
        suspect_fg  => '#ebdbb2',
        error       => '#fb4934',
        success     => '#b8bb26',
        highlight   => '#fabd2f',
        link        => '#83a598',
    },
    tui => {
        1 => ['yellow', 'black'],
        2 => ['white',  'black'],
        3 => ['red',    'black'],
        4 => ['green',  'black'],
        5 => ['yellow', 'black'],
    },
};

my $GRUVBOX_LIGHT = {
    label => 'Gruvbox Light',
    desc  => 'Cream background variant of Gruvbox.',
    css   => {
        bg          => '#fbf1c7',
        fg          => '#3c3836',
        accent      => '#b57614',
        header_bg   => '#ebdbb2',
        header_fg   => '#3c3836',
        border      => '#7c6f64',
        suspect_bg  => '#ebdbb2',
        suspect_fg  => '#3c3836',
        error       => '#9d0006',
        success     => '#79740e',
        highlight   => '#b57614',
        link        => '#076678',
    },
    tui => {
        1 => ['black',  'yellow'],
        2 => ['black',  'white'],
        3 => ['red',    'white'],
        4 => ['green',  'white'],
        5 => ['magenta','white'],
    },
};

my $SOLARIZED_DARK = {
    label => 'Solarized Dark',
    desc  => 'Ethan Schoonover\'s precise palette, dark variant.',
    css   => {
        bg          => '#002b36',
        fg          => '#839496',
        accent      => '#268bd2',
        header_bg   => '#073642',
        header_fg   => '#93a1a1',
        border      => '#586e75',
        suspect_bg  => '#073642',
        suspect_fg  => '#93a1a1',
        error       => '#dc322f',
        success     => '#859900',
        highlight   => '#b58900',
        link        => '#268bd2',
    },
    tui => {
        1 => ['cyan',   'black'],
        2 => ['white',  'black'],
        3 => ['red',    'black'],
        4 => ['green',  'black'],
        5 => ['yellow', 'black'],
    },
};

my $SOLARIZED_LIGHT = {
    label => 'Solarized Light',
    desc  => 'Solarized with the cream/buff background.',
    css   => {
        bg          => '#fdf6e3',
        fg          => '#657b83',
        accent      => '#268bd2',
        header_bg   => '#eee8d5',
        header_fg   => '#586e75',
        border      => '#93a1a1',
        suspect_bg  => '#eee8d5',
        suspect_fg  => '#586e75',
        error       => '#dc322f',
        success     => '#859900',
        highlight   => '#b58900',
        link        => '#268bd2',
    },
    tui => {
        1 => ['black',  'cyan'],
        2 => ['black',  'white'],
        3 => ['red',    'white'],
        4 => ['green',  'white'],
        5 => ['magenta','white'],
    },
};

my $NORD = {
    label => 'Nord',
    desc  => 'Arctic, north-bluish palette by Arctic Ice Studio.',
    css   => {
        bg          => '#2e3440',
        fg          => '#d8dee9',
        accent      => '#88c0d0',
        header_bg   => '#3b4252',
        header_fg   => '#eceff4',
        border      => '#4c566a',
        suspect_bg  => '#3b4252',
        suspect_fg  => '#e5e9f0',
        error       => '#bf616a',
        success     => '#a3be8c',
        highlight   => '#ebcb8b',
        link        => '#81a1c1',
    },
    tui => {
        1 => ['white',  'blue'],
        2 => ['white',  'black'],
        3 => ['red',    'black'],
        4 => ['green',  'black'],
        5 => ['cyan',   'black'],
    },
};

my $DRACULA = {
    label => 'Dracula',
    desc  => 'High-contrast purple/pink palette by Zeno Rocha.',
    css   => {
        bg          => '#282a36',
        fg          => '#f8f8f2',
        accent      => '#bd93f9',
        header_bg   => '#44475a',
        header_fg   => '#f8f8f2',
        border      => '#6272a4',
        suspect_bg  => '#44475a',
        suspect_fg  => '#f8f8f2',
        error       => '#ff5555',
        success     => '#50fa7b',
        highlight   => '#f1fa8c',
        link        => '#8be9fd',
    },
    tui => {
        1 => ['magenta', 'black'],
        2 => ['white',   'black'],
        3 => ['red',     'black'],
        4 => ['green',   'black'],
        5 => ['yellow',  'black'],
    },
};

my $MONOKAI = {
    label => 'Monokai',
    desc  => 'Wimer Hazenberg\'s vivid green/pink classic.',
    css   => {
        bg          => '#272822',
        fg          => '#f8f8f2',
        accent      => '#a6e22e',
        header_bg   => '#3e3d32',
        header_fg   => '#f8f8f2',
        border      => '#75715e',
        suspect_bg  => '#3e3d32',
        suspect_fg  => '#f8f8f2',
        error       => '#f92672',
        success     => '#a6e22e',
        highlight   => '#e6db74',
        link        => '#66d9ef',
    },
    tui => {
        1 => ['green',   'black'],
        2 => ['white',   'black'],
        3 => ['magenta', 'black'],
        4 => ['green',   'black'],
        5 => ['yellow',  'black'],
    },
};

my $TOKYO_NIGHT = {
    label => 'Tokyo Night',
    desc  => 'Cool blue-purple inspired by neon-lit Tokyo nights.',
    css   => {
        bg          => '#1a1b26',
        fg          => '#a9b1d6',
        accent      => '#7aa2f7',
        header_bg   => '#24283b',
        header_fg   => '#c0caf5',
        border      => '#414868',
        suspect_bg  => '#24283b',
        suspect_fg  => '#c0caf5',
        error       => '#f7768e',
        success     => '#9ece6a',
        highlight   => '#e0af68',
        link        => '#7dcfff',
    },
    tui => {
        1 => ['blue',    'black'],
        2 => ['white',   'black'],
        3 => ['red',     'black'],
        4 => ['green',   'black'],
        5 => ['cyan',    'black'],
    },
};

my $CATPPUCCIN = {
    label => 'Catppuccin Mocha',
    desc  => 'Warm pastel palette - Mocha (darkest) flavour.',
    css   => {
        bg          => '#1e1e2e',
        fg          => '#cdd6f4',
        accent      => '#cba6f7',
        header_bg   => '#313244',
        header_fg   => '#f5e0dc',
        border      => '#585b70',
        suspect_bg  => '#313244',
        suspect_fg  => '#cdd6f4',
        error       => '#f38ba8',
        success     => '#a6e3a1',
        highlight   => '#f9e2af',
        link        => '#89b4fa',
    },
    tui => {
        1 => ['magenta', 'black'],
        2 => ['white',   'black'],
        3 => ['red',     'black'],
        4 => ['green',   'black'],
        5 => ['yellow',  'black'],
    },
};

my %THEMES = (
    'classic'         => $CLASSIC,
    'gruvbox-dark'    => $GRUVBOX_DARK,
    'gruvbox-light'   => $GRUVBOX_LIGHT,
    'solarized-dark'  => $SOLARIZED_DARK,
    'solarized-light' => $SOLARIZED_LIGHT,
    'nord'            => $NORD,
    'dracula'         => $DRACULA,
    'monokai'         => $MONOKAI,
    'tokyo-night'     => $TOKYO_NIGHT,
    'catppuccin'      => $CATPPUCCIN,
);

# Stable order for menus / docs.
my @ORDER = qw(
    classic
    gruvbox-dark
    gruvbox-light
    solarized-dark
    solarized-light
    nord
    dracula
    monokai
    tokyo-night
    catppuccin
);

# User themes loaded from ~/.config/dc4u/themes/*.yaml at first use.
# Cached so we only walk the directory once per process.
my $USER_LOADED = 0;

# CSS keys a user theme must define. Mirrors the built-in themes.
my @CSS_REQUIRED = qw(
    bg fg accent header_bg header_fg border
    suspect_bg suspect_fg error success highlight link
);

=head2 available

Returns the list of theme names in display order. User themes are appended
in alphabetical order after built-ins.

=cut

sub available {
    _load_user_themes() unless $USER_LOADED;
    my %builtin = map { $_ => 1 } @ORDER;
    my @user = sort grep { !$builtin{$_} } keys %THEMES;
    return (@ORDER, @user);
}

=head2 user_theme_dir

Returns the directory user themes are loaded from. Honors
C<$DC4U_THEME_DIR> if set, otherwise defaults to
C<$XDG_CONFIG_HOME/dc4u/themes> or C<~/.config/dc4u/themes>.

=cut

sub user_theme_dir {
    return $ENV{DC4U_THEME_DIR} if $ENV{DC4U_THEME_DIR};
    my $base = $ENV{XDG_CONFIG_HOME} // ($ENV{HOME} ? "$ENV{HOME}/.config" : '.config');
    return "$base/dc4u/themes";
}

# Loads every *.yaml in user_theme_dir(), validates structure, registers.
# Silently skips malformed files - the CLI 'theme validate' subcommand is
# the right place to surface those errors loudly.
sub _load_user_themes {
    $USER_LOADED = 1;
    my $dir = user_theme_dir();
    return unless -d $dir;

    eval { require YAML::Tiny; 1 } or return;  # YAML required for user themes

    opendir(my $dh, $dir) or return;
    while (my $f = readdir($dh)) {
        next unless $f =~ /\.ya?ml$/i;
        my $path = "$dir/$f";
        my $name = $f;
        $name =~ s/\.ya?ml$//i;

        # Don't let a user theme shadow a built-in.
        next if exists $THEMES{$name};

        my $y = eval { YAML::Tiny->read($path) };
        next unless $y && $y->[0] && ref $y->[0] eq 'HASH';
        my $t = _normalize_user_theme($y->[0]);
        next unless $t;  # validation failed
        $THEMES{$name} = $t;
    }
    closedir($dh);
}

# Validate + normalize a user theme hashref. Returns the canonical form
# (with label/desc/css/tui keys) or undef if structurally invalid.
sub _normalize_user_theme {
    my $raw = shift;
    return undef unless ref $raw eq 'HASH';

    my $css = $raw->{css};
    return undef unless ref $css eq 'HASH';
    for my $k (@CSS_REQUIRED) {
        return undef unless defined $css->{$k} && $css->{$k} =~ /^#[0-9a-fA-F]{6}$/;
    }

    my $tui = $raw->{tui};
    return undef unless ref $tui eq 'HASH';
    for my $slot (1..5) {
        my $pair = $tui->{$slot};
        return undef unless ref $pair eq 'ARRAY' && @$pair == 2;
        for my $c (@$pair) {
            return undef unless defined $c && exists $CURSES_OK{$c};
        }
    }

    return {
        label => $raw->{label} // 'User theme',
        desc  => $raw->{desc}  // '',
        css   => { %$css },
        tui   => { map { $_ => [ @{ $tui->{$_} } ] } keys %$tui },
    };
}

=head2 scaffold_user_theme

Writes a starter YAML theme file based on the named built-in. Returns the
absolute path. Refuses to overwrite an existing file unless C<$force>.

=cut

sub scaffold_user_theme {
    my (undef, $name, $base_name, $force) = @_;
    require File::Path;
    my $dir = user_theme_dir();
    File::Path::make_path($dir) unless -d $dir;

    my $path = "$dir/${name}.yaml";
    if (-e $path && !$force) {
        die "Refusing to overwrite existing theme file: $path (pass --force)\n";
    }

    my $base = __PACKAGE__->get($base_name);
    my $css  = $base->{css};
    my $tui  = $base->{tui};

    my $body = "label: \"$name (custom)\"\n";
    $body   .= "desc: \"User-defined theme based on $base_name\"\n\n";
    $body   .= "css:\n";
    for my $k (@CSS_REQUIRED) {
        $body .= sprintf("  %s: \"%s\"\n", $k, $css->{$k});
    }
    $body   .= "\n# TUI color pairs. Each slot is [foreground, background].\n";
    $body   .= "# Allowed names: black red green yellow blue magenta cyan white\n";
    $body   .= "tui:\n";
    for my $slot (1..5) {
        my ($fg, $bg) = @{ $tui->{$slot} };
        $body .= sprintf("  %d: [%s, %s]\n", $slot, $fg, $bg);
    }

    open my $fh, '>:encoding(UTF-8)', $path or die "Cannot write $path: $!";
    print $fh $body;
    close $fh;
    return $path;
}

=head2 exists

Returns true iff the given name is a registered theme.

=cut

sub exists {
    my (undef, $name) = @_;
    return defined $name && exists $THEMES{$name};
}

=head2 default_name

Returns the name of the default theme. (Not named C<default> to avoid the
Perl C<given/when> reserved word.)

=cut

sub default_name { return 'classic'; }

=head2 get

Returns the raw theme hashref. Falls back to the default theme if the name
is unknown so callers don't need to guard against typos.

=cut

sub get {
    my (undef, $name) = @_;
    return $THEMES{$name} if defined $name && exists $THEMES{$name};
    return $THEMES{ default_name() };
}

=head2 label / desc

Convenience accessors used by the TUI selector.

=cut

sub label { my (undef, $n) = @_; return __PACKAGE__->get($n)->{label}; }
sub desc  { my (undef, $n) = @_; return __PACKAGE__->get($n)->{desc}; }

=head2 css_vars

Returns the CSS variable hashref for the named theme.

=cut

sub css_vars {
    my (undef, $name) = @_;
    return { %{ __PACKAGE__->get($name)->{css} } };
}

=head2 css_block

Returns a ready-to-embed CSS C<:root { ... }> block defining one custom
property per theme key. charge.css consumes these via C<var(--dc4u-bg)>.

=cut

sub css_block {
    my (undef, $name) = @_;
    my $vars = __PACKAGE__->css_vars($name);
    my $body = join "\n", map { "    --dc4u-$_: $vars->{$_};" } sort keys %$vars;
    return ":root {\n$body\n}\n";
}

=head2 curses_pairs

Returns the pair-number -> [fg_name, bg_name] map. Color names are members
of @CURSES_OK; the TUI layer maps them to COLOR_* constants.

=cut

sub curses_pairs {
    my (undef, $name) = @_;
    my $pairs = __PACKAGE__->get($name)->{tui};
    # Defensive copy - callers must not mutate the registry.
    return { map { $_ => [ @{ $pairs->{$_} } ] } keys %$pairs };
}

=head2 valid_curses_color

True iff the given name is one of the 8 baseline curses colors. Used by
tests to guarantee themes stay portable to vanilla 8-color terminals.

=cut

sub valid_curses_color {
    my (undef, $c) = @_;
    return defined $c && exists $CURSES_OK{$c};
}

1;

__END__

=head1 ADDING A THEME

  1. Define a hashref with C<label>, C<desc>, C<css> (11 keys), and C<tui>
     (5 pair slots, each [fg, bg] using @CURSES_OK names).
  2. Add it to C<%THEMES> and to C<@ORDER>.
  3. Add a row to t/test_theme.t (no per-theme assertions needed; the
     existing checks iterate C<available()>).

=head1 AUTHOR

DC4U Development Team

=head1 LICENSE

This software is licensed under the MIT License.

=cut
