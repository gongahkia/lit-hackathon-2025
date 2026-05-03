package DC4U::Watch;

use strict;
use warnings;
use v5.32;

=head1 NAME

DC4U::Watch - Recompile .dc files on save

=head1 SYNOPSIS

    use DC4U::Watch;
    DC4U::Watch->run(
        paths    => ['case.dc'],
        on_change => sub { my $p = shift; system("dc4u -f HTML $p"); },
        interval  => 0.5,
    );

=head1 DESCRIPTION

Mtime poller. Pure Perl - no inotify/FSEvents dependency, so it works the
same on Linux, macOS, and the dependency-light installs we ship with. The
trade-off is a one-poll latency (default 500ms) before a save is noticed,
which is fine for the human-typing-then-Cmd-S authoring loop this exists
to support.

The callback fires once on startup so the user sees the initial compile
without having to save first.

=cut

sub run {
    my ($class, %opts) = @_;
    my $paths     = $opts{paths}     or die "paths required";
    my $on_change = $opts{on_change} or die "on_change required";
    my $interval  = $opts{interval}  // 0.5;
    my $verbose   = $opts{verbose}   // 0;

    # Snapshot mtimes; absent files have mtime 0 so they fire on first
    # appearance.
    my %seen = map { $_ => _mtime($_) } @$paths;

    # Initial pass so the user sees the result immediately.
    for my $p (@$paths) {
        _safe_call($on_change, $p, 'initial', $verbose);
    }

    local $SIG{INT}  = sub { print STDERR "\nWatch stopped.\n"; exit 0; };
    local $SIG{TERM} = sub { exit 0; };

    while (1) {
        _sleep($interval);
        for my $p (@$paths) {
            my $now = _mtime($p);
            if ($now != $seen{$p}) {
                $seen{$p} = $now;
                _safe_call($on_change, $p, 'change', $verbose);
            }
        }
    }
}

sub _mtime {
    my $p = shift;
    my @s = stat $p;
    return @s ? $s[9] : 0;
}

# Trap callback exceptions so a transient parse error doesn't kill the
# watch loop - the user wants to keep editing and have it pick up the
# next save.
sub _safe_call {
    my ($cb, $path, $reason, $verbose) = @_;
    print STDERR "[watch] $reason: $path\n" if $verbose;
    eval { $cb->($path, $reason); 1 } or do {
        print STDERR "[watch] error compiling $path: $@";
    };
}

# Use Time::HiRes if available so 0.5s intervals work; fall back to
# CORE::sleep with a 1-second floor.
sub _sleep {
    my $s = shift;
    if (eval { require Time::HiRes; 1 }) {
        Time::HiRes::sleep($s);
    } else {
        sleep $s < 1 ? 1 : int($s);
    }
}

1;

__END__

=head1 AUTHOR

DC4U Development Team

=head1 LICENSE

This software is licensed under the MIT License.

=cut
