package DC4U::Audit;

use strict;
use warnings;
use v5.32;

use Digest::SHA qw(sha256_hex);
use File::Path qw(make_path);
use File::Basename qw(dirname);

=head1 NAME

DC4U::Audit - Append-only audit log for generated charges

=head1 SYNOPSIS

    use DC4U::Audit;
    my $audit = DC4U::Audit->new;
    $audit->record({
        input        => 'case123.dc',
        jurisdiction => 'singapore',
        format       => 'PDF',
        output       => $pdf_bytes,
        outfile      => 'case123.pdf',
    });

=head1 DESCRIPTION

Writes one JSON line per generated artifact to C<~/.dc4u/audit.log> (or
C<$DC4U_AUDIT_LOG> if set). Each entry records timestamp, OS user,
input/output paths, jurisdiction, format, byte size, and SHA-256 of the
artifact - so the chain of custody is verifiable later.

JSON is emitted by hand to keep this module dependency-free (the existing
codebase already avoids JSON::PP/JSON::XS).

=cut

sub new {
    my ($class, %opts) = @_;
    my $path = $opts{path}
        // $ENV{DC4U_AUDIT_LOG}
        // _default_log_path();

    my $self = { path => $path };
    bless $self, $class;
    return $self;
}

sub _default_log_path {
    my $home = $ENV{HOME} // (getpwuid($<))[7] // '.';
    return "$home/.dc4u/audit.log";
}

=head2 path

Returns the path the logger is writing to. Useful for printing in CLI
"audited to: <path>" lines.

=cut

sub path { return $_[0]->{path}; }

=head2 record

Append one entry. Required keys: input, jurisdiction, format. Optional:
output (the artifact bytes - hashed but not stored), outfile, charge_count,
extra (hashref of additional fields).

=cut

sub record {
    my ($self, $entry) = @_;
    return 0 unless $entry && $entry->{input} && $entry->{format};

    my $dir = dirname($self->{path});
    make_path($dir) unless -d $dir;

    my $sha = '';
    my $size = 0;
    if (defined $entry->{output}) {
        $sha  = sha256_hex($entry->{output});
        $size = length $entry->{output};
    }

    my %row = (
        ts           => _iso_now(),
        user         => $ENV{USER} // (getpwuid($<))[0] // 'unknown',
        input        => $entry->{input},
        jurisdiction => $entry->{jurisdiction} // '',
        format       => uc($entry->{format}),
        outfile      => $entry->{outfile}      // '',
        charge_count => $entry->{charge_count} // 1,
        sha256       => $sha,
        bytes        => $size,
    );
    if (ref $entry->{extra} eq 'HASH') {
        $row{$_} = $entry->{extra}{$_} for keys %{ $entry->{extra} };
    }

    open my $fh, '>>', $self->{path}
        or return 0;  # silent failure - audit log must never break the user's run
    print $fh _to_json(\%row), "\n";
    close $fh;
    return 1;
}

=head2 tail

Read the last $n lines. Backs the C<dc4u audit --tail N> subcommand and
the TUI's LogViewer.

=cut

sub tail {
    my ($self, $n) = @_;
    $n //= 20;
    return [] unless -f $self->{path};
    open my $fh, '<', $self->{path} or return [];
    my @lines = <$fh>;
    close $fh;
    chomp @lines;
    return [ @lines[ -$n .. -1 ] ] if @lines > $n;
    return [ @lines ];
}

# UTC ISO-8601 with seconds precision, no subsecond.
sub _iso_now {
    my @t = gmtime();
    return sprintf "%04d-%02d-%02dT%02d:%02d:%02dZ",
        $t[5] + 1900, $t[4] + 1, $t[3], $t[2], $t[1], $t[0];
}

# Minimal JSON encoder for flat hashes of strings/numbers. Good enough
# for the audit row shape; not a general JSON library.
sub _to_json {
    my $h = shift;
    my @parts;
    for my $k (sort keys %$h) {
        my $v = $h->{$k};
        push @parts, qq{"$k":} . _json_value($v);
    }
    return '{' . join(',', @parts) . '}';
}

sub _json_value {
    my $v = shift;
    return 'null' unless defined $v;
    if ($v =~ /^-?\d+(?:\.\d+)?$/) {
        return $v;
    }
    $v =~ s/\\/\\\\/g;
    $v =~ s/"/\\"/g;
    $v =~ s/\n/\\n/g;
    $v =~ s/\r/\\r/g;
    $v =~ s/\t/\\t/g;
    return qq{"$v"};
}

1;

__END__

=head1 AUTHOR

DC4U Development Team

=head1 LICENSE

This software is licensed under the MIT License.

=cut
