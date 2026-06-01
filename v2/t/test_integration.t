#!/usr/bin/env perl

use strict;
use warnings;
use v5.32;

use Test::More;
use FindBin;
use lib "$FindBin::Bin/../lib";

use DC4U;

my $sample_file = "$FindBin::Bin/../../samples/v2/test_simple.dc";

unless (-f $sample_file) {
    plan skip_all => "Sample file $sample_file not found";
    exit;
}

plan tests => 9;

for my $format (qw/HTML TXT MD/) {
    my $results = DC4U::process_dc_file($sample_file, $format, {output_format => $format});
    ok($results && @$results > 0, "$format: output generated");
    my $output = $results->[0]{output};
    ok($output =~ /John Doe/i, "$format: contains suspect name");
    ok($output =~ /s379|Penal Code|Officer Smith/i, "$format: contains statute or officer");
}

done_testing();
