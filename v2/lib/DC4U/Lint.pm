package DC4U::Lint;

use strict;
use warnings;
use v5.32;

use DC4U::Lexer;
use DC4U::Parser;

=head1 NAME

DC4U::Lint - Pre-flight validator for .dc source files

=head1 SYNOPSIS

    use DC4U::Lint;
    my $lint = DC4U::Lint->new(jurisdiction => 'singapore');
    my $issues = $lint->lint_file('case.dc');
    for my $i (@$issues) {
        printf "%s [%s] %s\n", $i->{severity}, $i->{location}, $i->{message};
    }

=head1 DESCRIPTION

Catches the common ways a draft charge gets to the printer broken:

  * required field missing for the jurisdiction
  * NRIC checksum failure (Singapore)
  * date that won't parse, or a date in the future
  * statute reference that doesn't look like one
  * suspiciously short explanation / placeholder text leftover

Each issue is C<{ severity, location, message, charge }>. Severity is
C<error> or C<warn>. Errors mean the file will fail to render; warnings
mean it will render but probably wrong.

=cut

sub new {
    my ($class, %opts) = @_;
    my $self = {
        jurisdiction => $opts{jurisdiction} || 'singapore',
    };
    bless $self, $class;
    return $self;
}

=head2 lint_file

Reads, splits into charge blocks, lints each. Returns an arrayref of
issues across all charges.

=cut

sub lint_file {
    my ($self, $path) = @_;
    open my $fh, '<', $path or return [{
        severity => 'error', location => $path, charge => 0,
        message  => "Cannot open file: $!",
    }];
    my $content = do { local $/; <$fh> };
    close $fh;
    return $self->lint_string($content);
}

=head2 lint_string

Lints raw .dc content. Splits on C<^---$> to handle multi-charge files.

=cut

sub lint_string {
    my ($self, $content) = @_;
    my @issues;

    my @blocks = split /^---$/m, $content;
    my $charge = 0;
    for my $block (@blocks) {
        next unless $block =~ /\S/;
        $charge++;
        push @issues, $self->_lint_block($block, $charge);
    }
    return \@issues;
}

sub _lint_block {
    my ($self, $block, $n) = @_;
    my @issues;

    # Parse via the real pipeline so we're testing what the generator sees.
    my $lexer  = DC4U::Lexer->new();
    my $parser = DC4U::Parser->new(jurisdiction => $self->{jurisdiction});

    my $tokens = eval { $lexer->tokenize($block) };
    if ($@) {
        push @issues, {
            severity => 'error', charge => $n, location => "charge $n",
            message  => "Lexer: $@",
        };
        return @issues;
    }

    my $parsed = eval { $parser->parse($tokens, { output_format => 'TXT' }) };
    if ($@) {
        push @issues, {
            severity => 'error', charge => $n, location => "charge $n",
            message  => "Parser: $@",
        };
        return @issues;
    }
    if (ref $parsed eq 'HASH' && $parsed->{error}) {
        push @issues, {
            severity => 'error', charge => $n, location => "charge $n",
            message  => $parsed->{error},
        };
        # keep going - other checks may still apply
    }

    # NRIC checksum (SG / MY both use S/T/F/G/M prefix + 7 digits + letter).
    my $nric = $parsed->{suspect_info}{nric};
    if (defined $nric && length $nric) {
        my ($ok, $why) = _validate_sg_nric($nric);
        if (!$ok && $self->{jurisdiction} =~ /^(singapore|malaysia)$/) {
            push @issues, {
                severity => 'warn', charge => $n,
                location => "charge $n / suspect / nric",
                message  => "NRIC '$nric' looks malformed: $why",
            };
        }
    }

    # Statute reference sanity - should mention a section or "s<digits>".
    my $statute = $parsed->{statute_info};
    if (defined $statute && length $statute) {
        unless ($statute =~ /\b(?:s|sec(?:tion)?|art(?:icle)?)\.?\s*\d/i) {
            push @issues, {
                severity => 'warn', charge => $n,
                location => "charge $n / statute",
                message  => "Statute '$statute' doesn't reference a numbered section",
            };
        }
    }

    # Explanation should be substantive - placeholder text is a common slip.
    my $explanation = $parsed->{charge_info}{explanation};
    if (defined $explanation) {
        my $clean = $explanation;
        $clean =~ s/^\s+|\s+$//g;
        if (length($clean) < 15) {
            push @issues, {
                severity => 'warn', charge => $n,
                location => "charge $n / explanation",
                message  => "Explanation is very short ('$clean') - probably incomplete",
            };
        }
        if ($clean =~ /\b(TODO|TBD|XXX|FIXME|placeholder)\b/i) {
            push @issues, {
                severity => 'error', charge => $n,
                location => "charge $n / explanation",
                message  => "Explanation contains placeholder text",
            };
        }
    }

    # Dates must already have parsed (otherwise Parser would have died) but
    # cross-check that charge date is not after officer date - that's a
    # workflow inversion, not a parse error.
    my $cd = $parsed->{charge_info}{date};
    my $od = $parsed->{officer_info}{date};
    if ($cd && $od) {
        my $c_e = _date_epoch($cd);
        my $o_e = _date_epoch($od);
        if ($c_e && $o_e && $c_e > $o_e) {
            push @issues, {
                severity => 'warn', charge => $n,
                location => "charge $n / dates",
                message  => "Charge date ($cd) is after officer date ($od)",
            };
        }
    }

    # Future-dated charges are almost always a typo (year off by one is
    # the classic). Officer dates further than 1 day in the future are
    # likewise suspicious. Today's date is computed in epoch-units so it
    # compares apples-to-apples with _date_epoch.
    my $today_e = _today_epoch();
    for my $pair ([charge => $cd], [officer => $od]) {
        my ($which, $val) = @$pair;
        next unless defined $val;
        my $e = _date_epoch($val);
        next unless $e && $today_e && $e > $today_e;
        push @issues, {
            severity => 'warn', charge => $n,
            location => "charge $n / $which / date",
            message  => "$which date ($val) is in the future",
        };
    }

    return @issues;
}

# Today in the same encoding as _date_epoch so we can compare directly.
sub _today_epoch {
    my @t = localtime;
    my ($y, $m, $d) = ($t[5] + 1900, $t[4] + 1, $t[3]);
    return $y * 400 + $m * 32 + $d;
}

# Singapore NRIC checksum: prefix S/T/F/G/M, 7 digits, suffix letter.
# Algorithm per ICA spec (returns (1, undef) on pass, (0, reason) on fail).
sub _validate_sg_nric {
    my $nric = shift;
    $nric = uc $nric;
    $nric =~ s/\s+//g;
    return (0, "expected 9 chars, got " . length($nric))
        unless length($nric) == 9;
    my ($prefix, $digits, $suffix) = $nric =~ /^([STFGM])(\d{7})([A-Z])$/
        or return (0, "expected [STFGM]DDDDDDDA");

    my @w = (2, 7, 6, 5, 4, 3, 2);
    my $sum = 0;
    for my $i (0..6) {
        $sum += $w[$i] * substr($digits, $i, 1);
    }
    $sum += 4 if $prefix eq 'T' || $prefix eq 'G';
    $sum += 3 if $prefix eq 'M';
    my $rem = $sum % 11;

    # Suffix tables differ by prefix
    my @st = qw(J Z I H G F E D C B A); # S/T
    my @fg = qw(X W U T R Q P N M L K); # F/G
    my @m  = qw(K L J N P Q R T U W X); # M
    my $expected;
    if    ($prefix eq 'S' || $prefix eq 'T') { $expected = $st[$rem] }
    elsif ($prefix eq 'F' || $prefix eq 'G') { $expected = $fg[$rem] }
    else                                      { $expected = $m[$rem] }

    return $expected eq $suffix
        ? (1, undef)
        : (0, "checksum mismatch (expected suffix $expected)");
}

# Convert "<day> <Month> <year>" (the form Parser normalizes to) into an
# epoch suitable for ordering. Returns undef if parsing fails.
sub _date_epoch {
    my $s = shift;
    return undef unless defined $s;
    return undef unless $s =~ /^(\d{1,2})\s+(\w+)\s+(\d{4})$/;
    my ($d, $m, $y) = ($1, $2, $3);
    my %mo = (
        january   => 1,  february => 2,  march    => 3,  april    => 4,
        may       => 5,  june     => 6,  july     => 7,  august   => 8,
        september => 9,  october  => 10, november => 11, december => 12,
    );
    my $mn = $mo{lc $m} or return undef;
    # Crude but ordering-correct: y*400 + m*32 + d
    return $y * 400 + $mn * 32 + $d;
}

=head2 format_text

Render an issues arrayref as a human-readable text report. Returns a
string. Caller decides whether to print to stdout or pipe somewhere.

=cut

sub format_text {
    my (undef, $issues) = @_;
    return "OK: no issues found.\n" unless $issues && @$issues;
    my $out = '';
    my ($e, $w) = (0, 0);
    for my $i (@$issues) {
        my $tag = $i->{severity} eq 'error' ? 'ERROR' : 'WARN ';
        $out .= sprintf("  %s %s: %s\n", $tag, $i->{location}, $i->{message});
        $i->{severity} eq 'error' ? $e++ : $w++;
    }
    $out .= sprintf("\n%d error(s), %d warning(s)\n", $e, $w);
    return $out;
}

=head2 has_errors

Returns true iff the issues list contains at least one error (vs warnings).
Caller uses this for exit status.

=cut

sub has_errors {
    my (undef, $issues) = @_;
    return 0 unless $issues;
    return scalar grep { $_->{severity} eq 'error' } @$issues;
}

1;

__END__

=head1 AUTHOR

DC4U Development Team

=head1 LICENSE

This software is licensed under the MIT License.

=cut
