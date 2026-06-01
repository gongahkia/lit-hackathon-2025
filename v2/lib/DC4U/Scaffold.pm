package DC4U::Scaffold;

use strict;
use warnings;
use v5.32;

=head1 NAME

DC4U::Scaffold - Generate starter .dc files per jurisdiction

=head1 SYNOPSIS

    use DC4U::Scaffold;
    my $dc_text = DC4U::Scaffold->build('singapore');
    DC4U::Scaffold->write('singapore', 'new_case.dc');

=head1 DESCRIPTION

Removes the "what fields am I supposed to fill in?" friction. Each
jurisdiction template includes:

  * inline # comments naming the relevant act / chapter
  * field placeholders matching what the parser actually expects
  * a sample default format line so the file renders out of the box

The template strings are intentionally not loaded from disk - keeping them
in-module avoids template-not-found failures after install.

=cut

# Sample placeholder values are intentionally distinct from real PII so a
# scaffold left half-filled fails Lint loudly.
my %SAMPLE_NRIC_SG = (
    # NRIC checksum-valid synthetic - won't trip Lint warnings on the
    # untouched template, but is obviously fake by inspection.
    placeholder => 'S0000001I',
);

my %TEMPLATES = (
    singapore => <<'DC',
# Singapore - Penal Code charge
# Reference: Criminal Procedure Code 2010 (Cap. 68)
# Suspect:  <name; NRIC; race; age; gender; nationality>
# Charge:   [title; date (DD/MM/YYYY); explanation including location]
# Statute:  @section reference@
# Officer:  {name; role/division; date}
`PDF`
<FULL NAME HERE; S0000001I; Race; 30; M; Singaporean>
[CHARGE TITLE; 01/01/2025; describe what the accused did, where, and how, in one sentence]
@s379 Penal Code@
{IO NAME; IO, DIVISION; 02/01/2025}
DC

    uk => <<'DC',
# United Kingdom - Magistrates / Crown Court charge
# Reference: Criminal Justice Act 2003 (c. 44)
# Suspect:  <name; date of birth; address>
# Charge:   [title; date (DD/MM/YYYY); location; explanation]
# Statute:  @act and section@
# Officer:  {prosecutor name; role; date}
`PDF`
<FULL NAME HERE; 01/01/1990; 1 Example Street, London, EC1A 1AA>
[CHARGE TITLE; 01/01/2025; 1 Example Street; describe the offence as it would appear on the charge sheet]
@section 1 Theft Act 1968@
{Prosecutor Name; CPS London; 02/01/2025}
DC

    australia => <<'DC',
# Australia (NSW shown) - Local Court charge
# Reference: Crimes Act 1900 (NSW) / Criminal Code Act 1995 (Cth)
# Suspect:  <name; date of birth; address>
# Charge:   [title; date (DD/MM/YYYY); location; explanation]
# Statute:  @act and section@
# Officer:  {informant name; role; date}
`PDF`
<FULL NAME HERE; 01/01/1990; 1 Example Street, Sydney NSW 2000>
[CHARGE TITLE; 01/01/2025; 1 Example Street; describe the offence in plain language]
@section 117 Crimes Act 1900 (NSW)@
{Informant Name; NSW Police, Sydney LAC; 02/01/2025}
DC

    india => <<'DC',
# India - First Information Report / charge sheet
# Reference: Indian Penal Code 1860 / CrPC 1973 / BNS 2023 as applicable
# Suspect:  <name; date of birth; address>
# Charge:   [title; date (DD/MM/YYYY); location; explanation]
# Statute:  @section and act@
# Officer:  {investigating officer; role; date}
`PDF`
<FULL NAME HERE; 01/01/1990; House No. 1, Example Road, New Delhi 110001>
[CHARGE TITLE; 01/01/2025; Example Road; describe the offence as alleged]
@section 379 Indian Penal Code 1860@
{IO Name; IO, Example Police Station; 02/01/2025}
DC

    malaysia => <<'DC',
# Malaysia - Magistrates / Sessions Court pertuduhan
# Reference: Kanun Keseksaan (Akta 574) / Kanun Tatacara Jenayah
# Suspect:  <name; NRIC; race; age; gender; nationality>
# Charge:   [title; date (DD/MM/YYYY); explanation including location]
# Statute:  @seksyen reference@
# Officer:  {nama; jawatan; date}
`PDF`
<NAMA PENUH DI SINI; 800101010001; Melayu; 30; L; Malaysia>
[CHARGE TITLE; 01/01/2025; jelaskan kesalahan yang dituduh, tempat dan cara]
@seksyen 379 Kanun Keseksaan@
{Nama Pegawai; IO, Balai Polis; 02/01/2025}
DC
);

=head2 jurisdictions

Returns the list of jurisdictions that have a scaffold template.

=cut

sub jurisdictions { return sort keys %TEMPLATES; }

=head2 build

Returns the .dc text for the named jurisdiction. Falls back to Singapore
if the name is unknown.

=cut

sub build {
    my (undef, $jurisdiction) = @_;
    $jurisdiction //= 'singapore';
    return $TEMPLATES{$jurisdiction} // $TEMPLATES{singapore};
}

=head2 write

Convenience: write the scaffold to a path. Refuses to overwrite an
existing file unless C<$force> is true. Returns the path written, or dies
on conflict.

=cut

sub write {
    my (undef, $jurisdiction, $path, $force) = @_;
    if (-e $path && !$force) {
        die "Refusing to overwrite existing file: $path (pass --force)\n";
    }
    open my $fh, '>:encoding(UTF-8)', $path
        or die "Cannot write $path: $!\n";
    print $fh build(undef, $jurisdiction);
    close $fh;
    return $path;
}

1;

__END__

=head1 AUTHOR

DC4U Development Team

=head1 LICENSE

This software is licensed under the MIT License.

=cut
