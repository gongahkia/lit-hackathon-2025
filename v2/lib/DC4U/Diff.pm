package DC4U::Diff;

use strict;
use warnings;
use v5.32;

use DC4U::Lexer;
use DC4U::Parser;

=head1 NAME

DC4U::Diff - Field-level semantic diff between two .dc files

=head1 SYNOPSIS

    use DC4U::Diff;
    my $diff = DC4U::Diff->compare('a.dc', 'b.dc', jurisdiction => 'singapore');
    print DC4U::Diff->format_text($diff);

=head1 DESCRIPTION

Byte-level diff (the kind C<git diff> does) is noisy on .dc files because
whitespace and field reordering swamp real changes. This produces a
field-aware diff:

  charge 1
    suspect.name        : "Ahmad bin Hassan"  ->  "Ahmad bin Yusof"
    charge.date         : "20 August 2024"    ->  "21 August 2024"
    statute             : (unchanged)
    officer.name        : "Sgt Raj Kumar"     ->  "Sgt Lim"

Charges are matched positionally (charge N in file A vs charge N in file
B). If the two files have different charge counts, the extras are reported
as added/removed. This is intentionally simpler than alignment-based
matching - lawyers reorder charges much less often than they amend them.

=cut

sub compare {
    my (undef, $path_a, $path_b, %opts) = @_;
    my $jurisdiction = $opts{jurisdiction} // 'singapore';
    my $a = _parse_file($path_a, $jurisdiction);
    my $b = _parse_file($path_b, $jurisdiction);

    my $max = $#$a > $#$b ? $#$a : $#$b;
    my @charges;
    for my $i (0..$max) {
        my $ca = $a->[$i];
        my $cb = $b->[$i];
        if (!$ca) {
            push @charges, { n => $i + 1, status => 'added',   data => $cb };
        } elsif (!$cb) {
            push @charges, { n => $i + 1, status => 'removed', data => $ca };
        } else {
            push @charges, {
                n        => $i + 1,
                status   => 'compared',
                fields   => _diff_fields($ca, $cb),
            };
        }
    }
    return { a => $path_a, b => $path_b, charges => \@charges };
}

sub _parse_file {
    my ($path, $jurisdiction) = @_;
    open my $fh, '<', $path or die "Cannot open $path: $!\n";
    my $content = do { local $/; <$fh> };
    close $fh;

    my @blocks = split /^---$/m, $content;
    my @parsed;
    for my $block (@blocks) {
        next unless $block =~ /\S/;
        my $tokens = DC4U::Lexer->new->tokenize($block);
        my $p = DC4U::Parser->new(jurisdiction => $jurisdiction);
        my $r = $p->parse($tokens, { output_format => 'TXT' });
        push @parsed, $r;
    }
    return \@parsed;
}

# Flatten the parsed-charge hash into "section.field" leaves so the diff
# is a flat list of changes, not a nested walk.
my @LEAVES = (
    [ 'output_format'           => sub { $_[0]->{output_format} } ],
    [ 'suspect.name'            => sub { $_[0]->{suspect_info}{name} } ],
    [ 'suspect.nric'            => sub { $_[0]->{suspect_info}{nric} } ],
    [ 'suspect.dob'             => sub { $_[0]->{suspect_info}{dob} } ],
    [ 'suspect.address'         => sub { $_[0]->{suspect_info}{address} } ],
    [ 'suspect.race'            => sub { $_[0]->{suspect_info}{race} } ],
    [ 'suspect.age'             => sub { $_[0]->{suspect_info}{age} } ],
    [ 'suspect.gender'          => sub { $_[0]->{suspect_info}{gender} } ],
    [ 'suspect.nationality'     => sub { $_[0]->{suspect_info}{nationality} } ],
    [ 'charge.title'            => sub { $_[0]->{charge_info}{title} } ],
    [ 'charge.date'             => sub { $_[0]->{charge_info}{date} } ],
    [ 'charge.location'         => sub { $_[0]->{charge_info}{charge_location} } ],
    [ 'charge.explanation'      => sub { $_[0]->{charge_info}{explanation} } ],
    [ 'statute'                 => sub { $_[0]->{statute_info} } ],
    [ 'officer.name'            => sub { $_[0]->{officer_info}{name} } ],
    [ 'officer.role_division'   => sub { $_[0]->{officer_info}{role_division} } ],
    [ 'officer.date'            => sub { $_[0]->{officer_info}{date} } ],
);

sub _diff_fields {
    my ($a, $b) = @_;
    my @out;
    for my $leaf (@LEAVES) {
        my ($name, $get) = @$leaf;
        my $va = $get->($a);
        my $vb = $get->($b);
        next if !defined $va && !defined $vb;
        my $ea = defined $va ? "$va" : '';
        my $eb = defined $vb ? "$vb" : '';
        next if $ea eq $eb;
        push @out, { field => $name, before => $va, after => $vb };
    }
    return \@out;
}

=head2 format_text

Render the diff hashref as a human-readable string. Keeps the same shape
as the SYNOPSIS example.

=cut

sub format_text {
    my (undef, $d) = @_;
    my $out = "--- $d->{a}\n+++ $d->{b}\n";
    for my $c (@{ $d->{charges} }) {
        $out .= "\ncharge $c->{n}";
        if ($c->{status} eq 'added') {
            $out .= " (only in $d->{b})\n";
            next;
        }
        if ($c->{status} eq 'removed') {
            $out .= " (only in $d->{a})\n";
            next;
        }
        my $fields = $c->{fields} // [];
        if (!@$fields) {
            $out .= " (unchanged)\n";
            next;
        }
        $out .= "\n";
        for my $f (@$fields) {
            my $bef = defined $f->{before} ? qq{"$f->{before}"} : '(none)';
            my $aft = defined $f->{after}  ? qq{"$f->{after}"}  : '(none)';
            $out .= sprintf("  %-25s : %s -> %s\n", $f->{field}, $bef, $aft);
        }
    }
    return $out;
}

=head2 has_changes

True iff any charge has at least one differing field, or if the two files
have different charge counts.

=cut

sub has_changes {
    my (undef, $d) = @_;
    for my $c (@{ $d->{charges} }) {
        return 1 if $c->{status} ne 'compared';
        return 1 if $c->{fields} && @{ $c->{fields} };
    }
    return 0;
}

1;

__END__

=head1 AUTHOR

DC4U Development Team

=head1 LICENSE

This software is licensed under the MIT License.

=cut
