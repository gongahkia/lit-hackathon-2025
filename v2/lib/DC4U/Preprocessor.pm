package DC4U::Preprocessor;

use strict;
use warnings;
use v5.32;

use File::Basename qw(dirname);
use File::Spec;

=head1 NAME

DC4U::Preprocessor - Expand @include, @def, ${var}, and YAML front-matter

=head1 SYNOPSIS

    use DC4U::Preprocessor;
    my $pp = DC4U::Preprocessor->new(base_dir => '.');
    my ($text, $meta) = $pp->process($raw_dc, source_path => 'case.dc');

=head1 DESCRIPTION

Runs before DC4U::Lexer so the lexer never sees preprocessor directives.

=head2 Supported directives

  ---                              # YAML front-matter (optional, leading)
  case_no: 2025-A-001              # arbitrary key/value
  hearing: 12 March 2025
  ---

  @include path/relative/to/this/file.dc
  @def $prosecutor "Officer Smith; IO, CID; 02/01/2025"
  @def $defendant "Jane Doe; S0000001I; Other; 30; F; SG"
  ${prosecutor}
  ${defendant}

C<@include> and C<@def> lines are themselves stripped from the output;
only the substituted bodies remain. C<${name}> expansion is recursive
(safely - cycles are detected and broken).

YAML is parsed with YAML::Tiny if installed, else with a minimal
key-value fallback that handles flat scalars only. The returned C<$meta>
hash is what callers (Generator, CLI banner, audit log) consume.

=cut

# Hard cap on @include depth so a circular @include can't OOM us.
use constant MAX_INCLUDE_DEPTH => 8;

# Hard cap on ${var} expansion passes - same reason.
use constant MAX_EXPAND_PASSES => 16;

sub new {
    my ($class, %opts) = @_;
    my $self = {
        base_dir => $opts{base_dir} // '.',
        defs     => {},
        seen     => {},  # include path -> 1, prevents revisits
    };
    bless $self, $class;
    return $self;
}

=head2 process

Returns C<($expanded_text, \%front_matter)>. C<source_path> is needed so
relative C<@include> paths resolve against the right directory.

=cut

sub process {
    my ($self, $text, %opts) = @_;
    my $source = $opts{source_path};
    my $base   = $source ? dirname($source) : $self->{base_dir};

    my ($body, $meta) = _strip_front_matter($text);
    $body = $self->_expand_includes($body, $base, 0);
    $body = $self->_collect_defs($body);
    $body = $self->_expand_vars($body);
    return ($body, $meta);
}

# Strip a leading YAML front-matter block of the form:
#   ---\n
#   key: value\n
#   ...
#   ---\n
# Anything not matching this exact shape is left in place.
sub _strip_front_matter {
    my $text = shift;
    return ($text, {}) unless $text =~ /^---\s*\n(.*?)\n---\s*\n/s;
    my $yaml_text = $1;
    my $rest      = $';
    my $meta      = _parse_yaml_or_simple($yaml_text);
    return ($rest, $meta);
}

sub _parse_yaml_or_simple {
    my $yaml_text = shift;
    if (eval { require YAML::Tiny; 1 }) {
        my $y = eval { YAML::Tiny->read_string("---\n$yaml_text\n") };
        if ($y && $y->[0] && ref $y->[0] eq 'HASH') {
            return $y->[0];
        }
    }
    # Fallback: flat key: value, one per line. Quotes stripped.
    my %out;
    for my $line (split /\n/, $yaml_text) {
        next if $line =~ /^\s*$/ || $line =~ /^\s*#/;
        next unless $line =~ /^\s*([^:#\s][^:]*?)\s*:\s*(.*?)\s*$/;
        my ($k, $v) = ($1, $2);
        $v =~ s/^["']|["']$//g;
        $out{$k} = $v;
    }
    return \%out;
}

sub _expand_includes {
    my ($self, $text, $base, $depth) = @_;
    if ($depth >= MAX_INCLUDE_DEPTH) {
        die "DC4U::Preprocessor: \@include depth limit (${\MAX_INCLUDE_DEPTH}) exceeded\n";
    }
    my $out = '';
    for my $line (split /(\n)/, $text) {
        if ($line =~ /^\s*\@include\s+(\S+)\s*$/) {
            my $rel = $1;
            my $abs = File::Spec->rel2abs($rel, $base);
            if ($self->{seen}{$abs}++) {
                die "DC4U::Preprocessor: circular \@include: $abs\n";
            }
            open my $fh, '<', $abs or die "DC4U::Preprocessor: cannot open \@include $abs: $!\n";
            my $inc = do { local $/; <$fh> };
            close $fh;
            $out .= $self->_expand_includes($inc, dirname($abs), $depth + 1);
        } else {
            $out .= $line;
        }
    }
    return $out;
}

# Walks the text, captures @def $name "value" lines into $self->{defs},
# strips them from the output. Value may be bare or double-quoted.
sub _collect_defs {
    my ($self, $text) = @_;
    my $out = '';
    for my $line (split /(\n)/, $text) {
        if ($line =~ /^\s*\@def\s+\$(\w+)\s+(.+?)\s*$/) {
            my ($name, $value) = ($1, $2);
            $value =~ s/^["']|["']$//g;
            $self->{defs}{$name} = $value;
            next; # strip
        }
        $out .= $line;
    }
    return $out;
}

# Repeatedly expand ${var} until no more substitutions are made (or we
# hit the safety limit). Iterative rather than recursive so the loop
# itself enforces the cycle break.
sub _expand_vars {
    my ($self, $text) = @_;
    my $defs = $self->{defs};
    return $text unless %$defs;

    for my $pass (1 .. MAX_EXPAND_PASSES) {
        my $changed = 0;
        $text =~ s{\$\{(\w+)\}}{
            if (exists $defs->{$1}) { $changed = 1; $defs->{$1} }
            else                     { '${' . $1 . '}' }
        }ge;
        last unless $changed;
    }
    return $text;
}

1;

__END__

=head1 AUTHOR

DC4U Development Team

=head1 LICENSE

This software is licensed under the MIT License.

=cut
