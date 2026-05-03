package DC4U::Anonymize;

use strict;
use warnings;
use v5.32;

use Digest::SHA qw(sha256_hex);

=head1 NAME

DC4U::Anonymize - Strip PII from .dc source files

=head1 SYNOPSIS

    use DC4U::Anonymize;
    my $clean = DC4U::Anonymize->scrub($dc_text, strategy => 'redact');
    my $clean = DC4U::Anonymize->scrub($dc_text, strategy => 'hash',  salt => 'abc');
    my $clean = DC4U::Anonymize->scrub($dc_text, strategy => 'fake');

=head1 DESCRIPTION

Operates on raw .dc text rather than parsed structures so the output is
itself a valid .dc file - re-renderable, lintable, and shareable as a
sample. Three strategies:

  * redact - replace value with a fixed token (REDACTED, 0000-0000, ...)
  * hash   - SHA-256 of (value + salt), truncated. Stable across files.
  * fake   - drop in plausible synthetic values (Jane Doe, Generic St.)

Targets the four PII-bearing brackets:

  <suspect>   - name, NRIC, address, DOB
  [charge]    - addresses inside the explanation
  @statute@   - left alone (statute references aren't PII)
  {officer}   - officer name (kept by default; pass scrub_officer => 1
                to anonymize this too)

=cut

my %REDACT_DEFAULTS = (
    name        => 'REDACTED NAME',
    nric        => 'X0000000X',
    dob         => '01/01/1900',
    address     => 'REDACTED ADDRESS',
    age         => '0',
    explanation => 'REDACTED',
);

my %FAKE_DEFAULTS = (
    name        => 'Jane Doe',
    nric        => 'S0000001I',
    dob         => '01/01/1990',
    address     => '1 Example Street, City',
    age         => '30',
);

=head2 scrub

Returns the anonymized .dc string.

=cut

sub scrub {
    my (undef, $text, %opts) = @_;
    my $strategy        = $opts{strategy}        // 'redact';
    my $salt            = $opts{salt}            // 'dc4u';
    my $scrub_officer   = $opts{scrub_officer}   // 0;
    my $scrub_dates     = $opts{scrub_dates}     // 0;

    my $repl = sub {
        my ($field, $value) = @_;
        $value =~ s/^\s+|\s+$//g;
        return _redact($field) if $strategy eq 'redact';
        return _hashed($field, $value, $salt) if $strategy eq 'hash';
        return _faked($field) if $strategy eq 'fake';
        return $value;
    };

    # Suspect block: <name; nric; race; age; gender; nationality>  (SG/MY)
    #             or <name; dob; address>                          (UK/AU/IN)
    $text =~ s/<([^>]+)>/'<' . _scrub_suspect_fields($1, $repl) . '>'/ge;

    # Officer block: {name; role; date}. Use !! delimiters to avoid the
    # brace-balance confusion that bites s{...}{...} when the pattern
    # itself contains literal braces.
    if ($scrub_officer) {
        $text =~ s!\{([^\}]+)\}!'{' . _scrub_officer_fields($1, $repl, $scrub_dates) . '}'!ge;
    }

    # Dates inside [ ... ] charge block
    if ($scrub_dates) {
        $text =~ s/\[([^\]]+)\]/'[' . _scrub_charge_dates($1, $repl) . ']'/ge;
    }

    return $text;
}

# Field-by-field anonymization. Knows both the 6-field (SG/MY) and
# 3-field (UK/AU/IN) suspect shapes - dispatches by arity.
sub _scrub_suspect_fields {
    my ($body, $repl) = @_;
    my @f = split /;/, $body, -1;
    if (@f == 6) {
        $f[0] = $repl->('name', $f[0]);
        $f[1] = $repl->('nric', $f[1]);
        # race, age, gender, nationality are class-level, not PII
    } elsif (@f == 3) {
        $f[0] = $repl->('name',    $f[0]);
        $f[1] = $repl->('dob',     $f[1]);
        $f[2] = $repl->('address', $f[2]);
    }
    return join(';', @f);
}

sub _scrub_officer_fields {
    my ($body, $repl, $scrub_dates) = @_;
    my @f = split /;/, $body, -1;
    return $body unless @f == 3;
    $f[0] = $repl->('name', $f[0]);
    $f[2] = $repl->('dob',  $f[2]) if $scrub_dates;
    return join(';', @f);
}

sub _scrub_charge_dates {
    my ($body, $repl) = @_;
    my @f = split /;/, $body, -1;
    return $body unless @f >= 2;
    $f[1] = ' ' . $repl->('dob', $f[1]);
    return join(';', @f);
}

sub _redact { return $REDACT_DEFAULTS{$_[0]} // 'REDACTED' }
sub _faked  { return $FAKE_DEFAULTS{$_[0]}   // 'REDACTED' }

# Stable hash: short hex prefix tagged with field name so consumers can
# tell at a glance what was anonymized.
sub _hashed {
    my ($field, $value, $salt) = @_;
    my $h = substr(sha256_hex("$salt|$field|$value"), 0, 10);
    return uc("$field-$h");
}

1;

__END__

=head1 AUTHOR

DC4U Development Team

=head1 LICENSE

This software is licensed under the MIT License.

=cut
