#!/usr/bin/env perl

use strict;
use warnings;
use v5.32;

use Test::More tests => 29;
use FindBin;
use lib "$FindBin::Bin/../lib";

# test module loading
use_ok('DC4U');
use_ok('DC4U::Lexer');
use_ok('DC4U::Parser');
use_ok('DC4U::Generator');
use_ok('DC4U::Template');
use_ok('DC4U::Config');
use_ok('DC4U::Logger');

# test Lexer
my $lexer = DC4U::Lexer->new();
ok($lexer, 'Lexer created');

my $test_input = '`PDF`<John Doe; S1234567A; Chinese; 30; M; Singaporean>[Theft; 01/01/2023; stole a wallet]@s379 Penal Code@{Officer Smith; IO, CID; 02/01/2023}';
my $tokens = $lexer->tokenize($test_input);
ok($tokens, 'Tokens generated');
ok(@$tokens > 0, 'Tokens array not empty');

# test Parser with options hash
my $parser = DC4U::Parser->new();
ok($parser, 'Parser created');

my $parsed = $parser->parse($tokens, {output_format => 'PDF'});
ok($parsed, 'Parsing completed');
ok($parsed->{output_format} eq 'PDF', 'Output format parsed correctly');
ok($parsed->{suspect_info}->{name} eq 'John Doe', 'Suspect name parsed');
ok($parsed->{charge_info}->{title} eq 'Theft', 'Charge title parsed');

# test Generator
my $generator = DC4U::Generator->new();
ok($generator, 'Generator created');

my $config = DC4U::Config->new();
ok($config, 'Config created');

my $html_output = $generator->generate($parsed, 'HTML', $config);
ok($html_output, 'HTML generation successful');
ok($html_output =~ /John Doe/, 'Generated HTML contains suspect name');

# test Template
my $template = DC4U::Template->new();
ok($template, 'Template created');

# test Logger
my $logger = DC4U::Logger->new('INFO');
ok($logger, 'Logger created');

# test error handling
my $invalid_tokens = [
    { type => 'OUTPUT_FORMAT', value => '`', line => 1 },
    { type => 'WORD', value => 'INVALID', line => 1 }
];
my $invalid_parsed = $parser->parse($invalid_tokens, {output_format => 'PDF'});
ok(!$invalid_parsed->{suspect_info}->{name}, 'Invalid input lacks suspect');

# test configuration
ok($config->get('jurisdiction') eq 'singapore', 'Default jurisdiction is Singapore');
ok($config->get('singapore.court_name') eq 'State Courts of Singapore', 'Singapore court name');

# test multi-charge split
my $multi_input = "`HTML`<John Doe; S1234567A; Chinese; 30; M; Singaporean>[Theft; 01/01/2023; stole a wallet]\@s379 Penal Code\@{Officer Smith; IO, CID; 02/01/2023}\n---\n`HTML`<Jane Doe; S7654321B; Malay; 25; F; Singaporean>[Robbery; 02/01/2023; robbed a shop]\@s392 Penal Code\@{Officer Lee; IO, CID; 03/01/2023}";
my $results = DC4U::process_dc_string($multi_input, 'HTML', {output_format => 'HTML'});
ok(ref $results eq 'ARRAY', 'Multi-charge returns arrayref');
ok(scalar @$results == 2, 'Multi-charge has 2 results');

# test written date parsing
my $parser2 = DC4U::Parser->new();
my $written_date_input = '`HTML`<John Doe; S1234567A; Chinese; 30; M; Singaporean>[Theft; 19 August 2019; stole a wallet]@s379 Penal Code@{Officer Smith; IO, CID; 02/01/2023}';
my $tokens2 = $lexer->tokenize($written_date_input);
my $parsed2 = $parser2->parse($tokens2, {output_format => 'HTML'});
ok($parsed2->{charge_info}->{date} eq '19 August 2019', 'Written date parsed correctly');

# test UK jurisdiction parsing
my $uk_parser = DC4U::Parser->new(jurisdiction => 'uk');
my $uk_input = '`HTML`<John Smith; 15/03/1990; 123 Baker Street>[Assault; 01/06/2023; London; punched a person]@s47 Offences Against the Person Act@{Prosecutor Jones; CPS; 02/06/2023}';
my $uk_tokens = $lexer->tokenize($uk_input);
my $uk_parsed = $uk_parser->parse($uk_tokens, {output_format => 'HTML', jurisdiction => 'uk'});
ok($uk_parsed->{suspect_info}->{name} eq 'John Smith', 'UK suspect name parsed');
ok($uk_parsed->{suspect_info}->{address} =~ /Baker Street/, 'UK suspect address parsed');

print "All tests passed!\n";
