#!/usr/bin/env perl

use strict;
use warnings;
use v5.32;

use Test::More;
use FindBin;
use lib "$FindBin::Bin/../lib";

use_ok('DC4U::Theme');

# Required keys per surface. Bumping these is a deliberate breaking change
# - update Theme.pm and charge.css together when this changes.
my @CSS_KEYS = qw(
    bg fg accent header_bg header_fg border
    suspect_bg suspect_fg error success highlight link
);
my @TUI_SLOTS = (1, 2, 3, 4, 5);

my @themes = DC4U::Theme->available;
ok(scalar(@themes) >= 9, 'at least 9 themes registered');

ok(DC4U::Theme->exists('classic'),         'classic registered');
ok(DC4U::Theme->exists('gruvbox-dark'),    'gruvbox-dark registered');
ok(DC4U::Theme->exists('gruvbox-light'),   'gruvbox-light registered');
ok(DC4U::Theme->exists('solarized-dark'),  'solarized-dark registered');
ok(DC4U::Theme->exists('solarized-light'), 'solarized-light registered');
ok(DC4U::Theme->exists('nord'),            'nord registered');
ok(DC4U::Theme->exists('dracula'),         'dracula registered');
ok(DC4U::Theme->exists('monokai'),         'monokai registered');
ok(DC4U::Theme->exists('tokyo-night'),     'tokyo-night registered');
ok(DC4U::Theme->exists('catppuccin'),      'catppuccin registered');

ok(!DC4U::Theme->exists('nonexistent'), 'unknown theme reports false');
ok(!DC4U::Theme->exists(undef),         'undef name reports false');

is(DC4U::Theme->default_name, 'classic', 'default theme is classic');

# Per-theme structural checks
for my $name (@themes) {
    my $css = DC4U::Theme->css_vars($name);
    is(ref $css, 'HASH', "$name: css_vars returns hashref");
    for my $k (@CSS_KEYS) {
        ok(defined $css->{$k}, "$name: css_vars defines $k");
        like($css->{$k}, qr/^#[0-9a-fA-F]{6}$/, "$name: $k is a valid hex color");
    }

    my $pairs = DC4U::Theme->curses_pairs($name);
    is(ref $pairs, 'HASH', "$name: curses_pairs returns hashref");
    for my $slot (@TUI_SLOTS) {
        ok(exists $pairs->{$slot}, "$name: curses_pairs has slot $slot");
        is(ref $pairs->{$slot}, 'ARRAY', "$name: slot $slot is arrayref");
        is(scalar @{ $pairs->{$slot} }, 2, "$name: slot $slot is [fg, bg]");
        ok(DC4U::Theme->valid_curses_color($pairs->{$slot}[0]),
            "$name: slot $slot fg is a baseline curses color");
        ok(DC4U::Theme->valid_curses_color($pairs->{$slot}[1]),
            "$name: slot $slot bg is a baseline curses color");
    }

    my $block = DC4U::Theme->css_block($name);
    like($block, qr/:root\s*\{/,           "$name: css_block opens :root");
    like($block, qr/--dc4u-bg:/,           "$name: css_block defines --dc4u-bg");
    like($block, qr/--dc4u-fg:/,           "$name: css_block defines --dc4u-fg");
    like($block, qr/\}\s*\z/,              "$name: css_block is balanced");
}

# Unknown name falls back to default rather than dying
my $fallback = DC4U::Theme->get('does-not-exist');
is(ref $fallback, 'HASH', 'get() falls back to default for unknown name');
is_deeply($fallback, DC4U::Theme->get('classic'),
    'get() unknown == get(classic)');

# Defensive copy: mutating returned curses_pairs must not affect registry
my $p1 = DC4U::Theme->curses_pairs('nord');
$p1->{1}[0] = 'red';
my $p2 = DC4U::Theme->curses_pairs('nord');
isnt($p2->{1}[0], 'red', 'curses_pairs returns defensive copy');

done_testing();
