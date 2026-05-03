#!/usr/bin/env perl

use strict;
use warnings;
use v5.32;

use Test::More;
use File::Temp qw(tempdir);
use FindBin;
use lib "$FindBin::Bin/../lib";

# Point Theme at a temp directory before loading it.
my $tmp = tempdir(CLEANUP => 1);
$ENV{DC4U_THEME_DIR} = $tmp;

use_ok('DC4U::Theme');

# Built-ins still present
ok(DC4U::Theme->exists('classic'), 'classic still exists');

# Scaffold a user theme
my $path = DC4U::Theme->scaffold_user_theme('my-theme', 'gruvbox-dark');
ok(-f $path, 'scaffold writes file');
like($path, qr|\Q$tmp\E/my-theme\.yaml$|, 'scaffold path under user dir');

# Scaffold refuses to clobber by default
eval { DC4U::Theme->scaffold_user_theme('my-theme', 'gruvbox-dark') };
like($@, qr/Refusing to overwrite/, 'scaffold refuses to clobber');

# After scaffolding, the theme should be picked up by available()/exists()
SKIP: {
    eval { require YAML::Tiny; 1 } or skip 'YAML::Tiny not installed', 4;

    # Force a re-scan by reloading the package state. The cleanest way is
    # to spawn a sub-perl - the parent process already cached USER_LOADED.
    my $cmd = qq{perl -I$FindBin::Bin/../lib -e 'use DC4U::Theme;}
        . qq{ \$ENV{DC4U_THEME_DIR}=q{$tmp};}
        . qq{ print join("\\n", DC4U::Theme->available)'};
    my $out = `$cmd`;
    like($out, qr/my-theme/, 'user theme loaded by sub-perl');

    # Validation: a theme file missing required fields is dropped
    open my $bad, '>', "$tmp/broken.yaml" or die $!;
    print $bad "label: broken\ndesc: only label\n";
    close $bad;
    $cmd = qq{perl -I$FindBin::Bin/../lib -e 'use DC4U::Theme;}
        . qq{ \$ENV{DC4U_THEME_DIR}=q{$tmp};}
        . qq{ print DC4U::Theme->exists("broken") ? "loaded" : "rejected"'};
    is(`$cmd`, 'rejected', 'malformed user theme rejected');

    # User theme can\'t shadow a built-in
    open my $shadow, '>', "$tmp/classic.yaml" or die $!;
    print $shadow "label: shadow\ncss:\n  bg: '#000000'\n  fg: '#000000'\n  accent: '#000000'\n  header_bg: '#000000'\n  header_fg: '#000000'\n  border: '#000000'\n  suspect_bg: '#000000'\n  suspect_fg: '#000000'\n  error: '#000000'\n  success: '#000000'\n  highlight: '#000000'\n  link: '#000000'\ntui:\n  1: [white, black]\n  2: [white, black]\n  3: [white, black]\n  4: [white, black]\n  5: [white, black]\n";
    close $shadow;
    $cmd = qq{perl -I$FindBin::Bin/../lib -e 'use DC4U::Theme;}
        . qq{ \$ENV{DC4U_THEME_DIR}=q{$tmp};}
        . qq{ print DC4U::Theme->label("classic")'};
    my $label = `$cmd`;
    unlike($label, qr/shadow/, 'user theme cannot shadow built-in');
    like($label, qr/Classic/, 'built-in classic label preserved');
}

done_testing();
