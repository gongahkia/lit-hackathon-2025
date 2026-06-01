#!/usr/bin/env perl

use strict;
use warnings;
use v5.32;

use Test::More;
use FindBin;
use lib "$FindBin::Bin/../lib";

use_ok('DC4U::Anonymize');

my $sg = <<'DC';
`HTML`
<John Doe; S0000001I; Chinese; 30; M; Singaporean>
[Theft; 01/01/2024; took wallet]
@s379 Penal Code@
{Officer Tan; IO, CID; 02/01/2024}
DC

my $uk = <<'DC';
`HTML`
<Jane Roe; 15/06/1985; 10 Downing St, London>
[Burglary; 02/02/2024; 1 Example Rd; entered without consent]
@s9 Theft Act 1968@
{Prosecutor Smith; CPS; 03/02/2024}
DC

# REDACT
my $r = DC4U::Anonymize->scrub($sg, strategy => 'redact');
unlike($r, qr/John Doe/,    'redact strips name');
unlike($r, qr/S0000001I/,   'redact strips NRIC');
like($r,   qr/REDACTED/,    'redact inserts marker');

$r = DC4U::Anonymize->scrub($uk, strategy => 'redact');
unlike($r, qr/Jane Roe/,    'redact strips UK name');
unlike($r, qr/Downing St/,  'redact strips UK address');
unlike($r, qr/15\/06\/1985/, 'redact strips UK DOB');

# HASH (deterministic)
my $h1 = DC4U::Anonymize->scrub($sg, strategy => 'hash', salt => 'A');
my $h2 = DC4U::Anonymize->scrub($sg, strategy => 'hash', salt => 'A');
is($h1, $h2, 'hash with same salt is deterministic');

my $h3 = DC4U::Anonymize->scrub($sg, strategy => 'hash', salt => 'B');
isnt($h1, $h3, 'hash with different salt differs');
unlike($h1, qr/John Doe/, 'hash strips name');
like($h1,   qr/NAME-/,    'hash tags hashed name');

# FAKE
my $f = DC4U::Anonymize->scrub($sg, strategy => 'fake');
unlike($f, qr/John Doe/, 'fake strips name');
like($f,   qr/Jane Doe/, 'fake substitutes plausible name');

# Officer left alone by default
$r = DC4U::Anonymize->scrub($sg, strategy => 'redact');
like($r, qr/Officer Tan/, 'officer kept by default');

$r = DC4U::Anonymize->scrub($sg, strategy => 'redact', scrub_officer => 1);
unlike($r, qr/Officer Tan/, 'officer scrubbed when scrub_officer => 1');

# Statute and explanation are not PII - left alone
$r = DC4U::Anonymize->scrub($sg, strategy => 'redact');
like($r, qr/s379 Penal Code/, 'statute kept');
like($r, qr/took wallet/,     'explanation kept');

done_testing();
