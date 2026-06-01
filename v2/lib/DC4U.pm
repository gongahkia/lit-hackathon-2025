package DC4U;

use strict;
use warnings;
use v5.32;

our $VERSION = '2.0.0';

use DC4U::Lexer;
use DC4U::Parser;
use DC4U::Generator;
use DC4U::Template;
use DC4U::Config;
use DC4U::Logger;
use DC4U::Preprocessor;

use Exporter 'import';
our @EXPORT_OK = qw(process_dc_file process_dc_string);

=head1 NAME

DC4U - Draft Charges 4 U - Legal Document Generator

=head1 VERSION

Version 2.0.0

=head1 SYNOPSIS

    use DC4U;
    
    # Process a .dc file
    my $result = DC4U::process_dc_file('input.dc', 'output.pdf');
    
    # Process a .dc string
    my $result = DC4U::process_dc_string($dc_content, 'HTML');

=head1 DESCRIPTION

DC4U is a legal document generator that converts human-readable markup format (.dc) 
into various output formats for legal draft charges. Version 2.0 features a complete 
Perl rewrite with modular architecture, enhanced CLI interface, and comprehensive 
template system.

=head1 METHODS

=cut

=head2 process_dc_file

Process a .dc file and generate output in specified format.

=cut

sub process_dc_file {
    my ($input_file, $output_format, $options) = @_;

    # Initialize logger
    my $logger = DC4U::Logger->new($options->{log_level} || 'INFO');

    # Load configuration
    my $config = DC4U::Config->new($options->{config_file});

    # Read input file
    open my $fh, '<', $input_file or die "Cannot open $input_file: $!";
    my $content = do { local $/; <$fh> };
    close $fh;

    # Preprocess (@include / @def / ${var} / YAML front-matter) unless
    # disabled. Tracking source_path so relative includes resolve.
    unless ($options->{no_preprocess}) {
        my $pp = DC4U::Preprocessor->new();
        my ($expanded, $meta) = $pp->process($content, source_path => $input_file);
        $content = $expanded;
        $options->{front_matter} = $meta if $meta && %$meta;
    }

    return process_dc_string($content, $output_format, $options);
}

=head2 process_dc_string

Process a .dc string and generate output in specified format.

=cut

sub process_dc_string {
    my ($content, $output_format, $options) = @_;
    
    # Initialize logger
    my $logger = DC4U::Logger->new($options->{log_level} || 'INFO');
    
    # Load configuration
    my $config = DC4U::Config->new($options->{config_file});
    
    # Split content by separators
    my @charge_blocks = split /^---$/m, $content;
    
    my $jurisdiction = $options->{jurisdiction} // $config->get('jurisdiction') // 'singapore';
    $options->{jurisdiction} = $jurisdiction;
    $config->set('jurisdiction', $jurisdiction);

    # Theme precedence (highest first):
    #   1. explicit --theme / $options->{theme}
    #   2. <jurisdiction>.theme nested config (e.g. uk.theme: solarized-light)
    #   3. top-level config theme
    #   4. DC4U::Theme default (classic)
    if (defined $options->{theme}) {
        $config->set('theme', $options->{theme});
    } else {
        my $jur_theme = $config->get("$jurisdiction.theme");
        if (defined $jur_theme) {
            $config->set('theme', $jur_theme);
        }
    }
    my @results;

    for my $i (0 .. $#charge_blocks) {
        my $block = $charge_blocks[$i];
        next unless $block =~ /\S/; # Skip empty blocks

        $logger->info("Processing charge block " . ($i + 1));

        # Lex the content
        my $lexer = DC4U::Lexer->new();
        my $tokens = $lexer->tokenize($block);

        # Parse the tokens
        my $parser = DC4U::Parser->new(jurisdiction => $options->{jurisdiction});
        my $parsed_data = $parser->parse($tokens, $options);
        
        if ($parsed_data->{error}) {
            $logger->error("Parse error in charge block " . ($i + 1) . ": " . $parsed_data->{error});
            next;
        }
        
        # Generate output
        my $generator = DC4U::Generator->new();
        my $output = $generator->generate($parsed_data, $output_format, $config);
        
        push @results, {
            charge_number => $i + 1,
            output => $output,
            format => $output_format
        };
    }
    
    return \@results;
}

1;

__END__

=head1 AUTHOR

DC4U Development Team

=head1 LICENSE

This software is licensed under the MIT License.

=cut
