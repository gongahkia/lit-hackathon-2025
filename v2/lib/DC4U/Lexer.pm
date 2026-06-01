package DC4U::Lexer;

use strict;
use warnings;
use v5.32;

=head1 NAME

DC4U::Lexer - Tokenizes .dc markup language

=head1 SYNOPSIS

    my $lexer = DC4U::Lexer->new();
    my $tokens = $lexer->tokenize($dc_content);

=head1 DESCRIPTION

Tokenizes the .dc markup language into a structured array of tokens.
Supports enhanced syntax for DC4U v2.0.

=cut

sub new {
    my $class = shift;
    my $self = {
        # Enhanced grammar patterns for v2.0
        patterns => [
            # Output format
            ['OUTPUT_FORMAT', qr/`/],
            
            # Suspect information (enhanced for multiple suspects)
            ['L_SUSPECT_INFO', qr/</],
            ['R_SUSPECT_INFO', qr/>/],
            
            # Charge information
            ['L_CHARGE_INFO', qr/\[/],
            ['R_CHARGE_INFO', qr/\]/],
            
            # Statute information
            ['STATUTE_INFO', qr/@/],
            
            # Charging officer information
            ['L_CHARGING_OFFICER_INFO', qr/\{/],
            ['R_CHARGING_OFFICER_INFO', qr/\}/],
            
            # Comments
            # Comments
            ['COMMENT', qr/#[^\n]*/],
            
            # Enhanced word pattern for v2.0
            ['WORD', qr/[A-Za-z0-9;,.?$!%&'()*+_\/()\s-]+/],
            
            # New v2.0 patterns
            ['CASE_REF', qr/\[\[/],
            ['CASE_REF_END', qr/\]\]/],
            ['WITNESS_INFO', qr/\(/],
            ['WITNESS_INFO_END', qr/\)/],
            ['COURT_INFO', qr/\[\[\[/],
            ['COURT_INFO_END', qr/\]\]\]/],
        ]
    };
    bless $self, $class;
    return $self;
}

=head2 tokenize

Tokenizes input string into array of tokens.

=cut

sub tokenize {
    my ($self, $input) = @_;
    
    my @tokens;
    my $pos = 0;
    my $line = 1;
    my $column = 1;
    
    while ($pos < length($input)) {
        my $matched = 0;
        
        # Try each pattern
        for my $pattern (@{$self->{patterns}}) {
            my ($type, $regex) = @$pattern;
            
            if ($input =~ /\G($regex)/gc) {
                my $value = $1;
                push @tokens, {
                    type => $type,
                    value => $value,
                    line => $line,
                    column => $column,
                    position => $pos
                };
                
                # Update position tracking
                $pos = pos($input);
                $column += length($value);
                $matched = 1;
                last;
            }
        }
        
        unless ($matched) {
            # Handle whitespace
            if ($input =~ /\G(\s+)/gc) {
                $pos = pos($input);
                $column += length($1);
                $line += ($1 =~ tr/\n//);
                next;
            }
            
            # Unknown character
            my $char = substr($input, $pos, 1);
            die "Unknown character '$char' at line $line, column $column";
        }
    }
    
    return \@tokens;
}

=head2 get_token_types

Returns list of supported token types.

=cut

sub get_token_types {
    my $self = shift;
    return map { $_->[0] } @{$self->{patterns}};
}

1;

__END__

=head1 AUTHOR

DC4U Development Team

=head1 LICENSE

This software is licensed under the MIT License.

=cut