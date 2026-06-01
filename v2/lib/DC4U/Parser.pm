package DC4U::Parser;

use strict;
use warnings;
use v5.32;

=head1 NAME

DC4U::Parser - Parses and validates tokenized .dc content

=head1 SYNOPSIS

    my $parser = DC4U::Parser->new();
    my $result = $parser->parse($tokens);

=head1 DESCRIPTION

Parses tokenized .dc content and validates syntax. Returns structured data
for document generation with comprehensive error handling.

=cut

sub new {
    my ($class, %opts) = @_;
    my $jurisdiction = $opts{jurisdiction} || 'singapore';
    my $required = {
        singapore => {
            suspect => [qw/name nric race age gender nationality/],
            charge  => [qw/title date explanation/],
            statute => [qw/text/],
            officer => [qw/name role_division date/],
        },
        uk => {
            suspect => [qw/name dob address/],
            charge  => [qw/title date explanation/],
            statute => [qw/text/],
            officer => [qw/name role_division date/],
        },
        australia => {
            suspect => [qw/name dob address/],
            charge  => [qw/title date explanation/],
            statute => [qw/text/],
            officer => [qw/name role_division date/],
        },
        india => {
            suspect => [qw/name dob address/],
            charge  => [qw/title date explanation/],
            statute => [qw/text/],
            officer => [qw/name role_division date/],
        },
        malaysia => {
            suspect => [qw/name nric race age gender nationality/],
            charge  => [qw/title date explanation/],
            statute => [qw/text/],
            officer => [qw/name role_division date/],
        },
    };
    my $self = {
        jurisdiction    => $jurisdiction,
        required_fields => $required->{$jurisdiction} || $required->{singapore},
    };
    bless $self, $class;
    return $self;
}

=head2 parse

Parses tokens and returns structured data.

=cut

sub parse {
    my ($self, $tokens, $options) = @_;
    
    # allow jurisdiction override from options
    if ($options && $options->{jurisdiction}) {
        $self->{jurisdiction} = $options->{jurisdiction};
        my $required = {
            singapore => {
                suspect => [qw/name nric race age gender nationality/],
                charge  => [qw/title date explanation/],
                statute => [qw/text/],
                officer => [qw/name role_division date/],
            },
            uk => {
                suspect => [qw/name dob address/],
                charge  => [qw/title date explanation/],
                statute => [qw/text/],
                officer => [qw/name role_division date/],
            },
            australia => {
                suspect => [qw/name dob address/],
                charge  => [qw/title date explanation/],
                statute => [qw/text/],
                officer => [qw/name role_division date/],
            },
            india => {
                suspect => [qw/name dob address/],
                charge  => [qw/title date explanation/],
                statute => [qw/text/],
                officer => [qw/name role_division date/],
            },
            malaysia => {
                suspect => [qw/name nric race age gender nationality/],
                charge  => [qw/title date explanation/],
                statute => [qw/text/],
                officer => [qw/name role_division date/],
            },
        };
        $self->{required_fields} = $required->{$self->{jurisdiction}} || $required->{singapore};
    }
    
    my $result = {
        output_format => $options->{output_format} || '',
        suspect_info => {},
        charge_info => {},
        statute_info => '',
        officer_info => {},
        case_ref => '',
        witness_info => '',
        court_info => '',
        comments => [],
        error => undef
    };
    
    my @stack;
    my $current_section = '';
    my $current_content = '';
    
    my $i = 0;
    while ($i <= $#$tokens) {
        my $token = $tokens->[$i];
        my $type = $token->{type};
        my $value = $token->{value};
        
        # handle opening tokens
        if ($type eq 'OUTPUT_FORMAT') {
            if ($result->{output_format}) {
                if ($i + 1 <= $#$tokens && $tokens->[$i + 1]->{type} eq 'WORD') {
                    $i++; # skip the format value token
                }
                $i++;
                next;
            }
            if ($i + 1 <= $#$tokens && $tokens->[$i + 1]->{type} eq 'WORD') {
                $result->{output_format} = $tokens->[$i + 1]->{value};
                $i++; # skip the format value token
            } else {
                return { error => "Output format not specified after ` at line " . $token->{line} };
            }
        }
        elsif ($type eq 'L_SUSPECT_INFO') {
            push @stack, 'SUSPECT_INFO';
            $current_section = 'suspect';
            $current_content = '';
        }
        elsif ($type eq 'R_SUSPECT_INFO') {
            if (@stack && $stack[-1] eq 'SUSPECT_INFO') {
                pop @stack;
                if ($self->{jurisdiction} =~ /^(uk|australia|india)$/) {
                    $result->{suspect_info} = $self->_parse_suspect_info_uk($current_content);
                } else {
                    $result->{suspect_info} = $self->_parse_suspect_info($current_content);
                }
                $current_section = '';
            } else {
                return { error => "Unmatched suspect info closing at line " . $token->{line} };
            }
        }
        elsif ($type eq 'L_CHARGE_INFO') {
            push @stack, 'CHARGE_INFO';
            $current_section = 'charge';
            $current_content = '';
        }
        elsif ($type eq 'R_CHARGE_INFO') {
            if (@stack && $stack[-1] eq 'CHARGE_INFO') {
                pop @stack;
                if ($self->{jurisdiction} =~ /^(uk|australia|india)$/) {
                    $result->{charge_info} = $self->_parse_charge_info_uk($current_content);
                } else {
                    $result->{charge_info} = $self->_parse_charge_info($current_content);
                }
                $current_section = '';
            } else {
                return { error => "Unmatched charge info closing at line " . $token->{line} };
            }
        }
        elsif ($type eq 'STATUTE_INFO') {
            if ($result->{statute_info}) {
                $i++;
                next;
            }
            my $statute_content = '';
            for my $j ($i + 1 .. $#$tokens) {
                if ($tokens->[$j]->{type} eq 'STATUTE_INFO') {
                    $result->{statute_info} = $statute_content;
                    $i = $j; # skip to closing @
                    last;
                } else {
                    $statute_content .= $tokens->[$j]->{value};
                }
            }
        }
        elsif ($type eq 'L_CHARGING_OFFICER_INFO') {
            push @stack, 'OFFICER_INFO';
            $current_section = 'officer';
            $current_content = '';
        }
        elsif ($type eq 'R_CHARGING_OFFICER_INFO') {
            if (@stack && $stack[-1] eq 'OFFICER_INFO') {
                pop @stack;
                if ($self->{jurisdiction} =~ /^(uk|australia|india)$/) {
                    $result->{officer_info} = $self->_parse_officer_info_uk($current_content);
                } else {
                    $result->{officer_info} = $self->_parse_officer_info($current_content);
                }
                $current_section = '';
            } else {
                return { error => "Unmatched officer info closing at line " . $token->{line} };
            }
        }
        elsif ($type eq 'COMMENT') {
            my $val = $token->{value};
            $val =~ s/^#\s*//;
            push @{$result->{comments}}, $val;
            $i++;
        }
        elsif ($type eq 'WORD') {
            if ($current_section) {
                $current_content .= $value;
            }
        }
        $i++;
    }
    
    # Validate required fields
    my $validation_error = $self->_validate_required_fields($result);
    if ($validation_error) {
        return { error => $validation_error };
    }
    
    return $result;
}

=head2 _parse_suspect_info

Parses suspect information from content.

=cut

sub _parse_suspect_info {
    my ($self, $content) = @_;
    
    my @fields = split /;/, $content;
    if (@fields != 6) {
        die "Invalid suspect information format. Expected 6 fields, got " . scalar(@fields);
    }
    
    return {
        name => $fields[0],
        nric => $fields[1],
        race => $fields[2],
        age => int($fields[3]),
        gender => $fields[4],
        nationality => $fields[5]
    };
}

=head2 _parse_charge_info

Parses charge information from content.

=cut

sub _parse_charge_info {
    my ($self, $content) = @_;
    
    my @fields = split /;/, $content;
    if (@fields != 3) {
        die "Invalid charge information format. Expected 3 fields, got " . scalar(@fields);
    }
    
    return {
        title => $fields[0],
        date => $self->_parse_date($fields[1]),
        explanation => $fields[2]
    };
}

=head2 _parse_officer_info

Parses officer information from content.

=cut

sub _parse_officer_info {
    my ($self, $content) = @_;
    
    my @fields = split /;/, $content;
    if (@fields != 3) {
        die "Invalid officer information format. Expected 3 fields, got " . scalar(@fields);
    }
    
    return {
        name => $fields[0],
        role_division => $fields[1],
        date => $self->_parse_date($fields[2])
    };
}

=head2 _parse_date

Parses date in DD/MM/YYYY format.

=cut

sub _parse_date {
    my ($self, $date_str) = @_;
    
    # clean up (trim leading/trailing spaces but preserve internal spaces for written dates)
    $date_str =~ s/^\s+|\s+$//g;
    
    my @months = qw/January February March April May June
                    July August September October November December/;
    my %month_map;
    for my $i (0 .. $#months) {
        $month_map{lc($months[$i])} = $i + 1;
        $month_map{lc(substr($months[$i], 0, 3))} = $i + 1; # abbreviated
    }
    
    # DD/MM/YYYY or D/M/YYYY numeric format
    if ($date_str =~ /^(\d{1,2})\s*\/\s*(\d{1,2})\s*\/\s*(\d{4})$/) {
        my ($day, $month, $year) = ($1, $2, $3);
        if ($day < 1 || $day > 31 || $month < 1 || $month > 12 || $year < 1) {
            die "Invalid date: $date_str";
        }
        return "$day $months[$month-1] $year";
    }
    # written format: "19 August 2019" or "19 Aug 2019"
    elsif ($date_str =~ /^(\d{1,2})\s+([A-Za-z]+)\s+(\d{4})$/) {
        my ($day, $month_name, $year) = ($1, $2, $3);
        my $month_num = $month_map{lc($month_name)};
        unless ($month_num) {
            die "Invalid month name: $month_name in date: $date_str";
        }
        if ($day < 1 || $day > 31 || $year < 1) {
            die "Invalid date: $date_str";
        }
        return "$day $months[$month_num-1] $year";
    }
    # "August 19, 2019" format
    elsif ($date_str =~ /^([A-Za-z]+)\s+(\d{1,2}),?\s+(\d{4})$/) {
        my ($month_name, $day, $year) = ($1, $2, $3);
        my $month_num = $month_map{lc($month_name)};
        unless ($month_num) {
            die "Invalid month name: $month_name in date: $date_str";
        }
        if ($day < 1 || $day > 31 || $year < 1) {
            die "Invalid date: $date_str";
        }
        return "$day $months[$month_num-1] $year";
    }
    else {
        die "Invalid date format: $date_str. Expected DD/MM/YYYY or 'D Month YYYY'";
    }
}

=head2 _validate_required_fields

Validates that all required fields are present.

=cut

sub _validate_required_fields {
    my ($self, $result) = @_;
    
    # Check output format
    unless ($result->{output_format}) {
        return "Output format not specified";
    }
    
    # Check suspect info
    for my $field (@{$self->{required_fields}->{suspect}}) {
        unless ($result->{suspect_info}->{$field}) {
            return "Missing required suspect field: $field";
        }
    }
    
    # Check charge info
    for my $field (@{$self->{required_fields}->{charge}}) {
        unless ($result->{charge_info}->{$field}) {
            return "Missing required charge field: $field";
        }
    }
    
    # Check statute
    unless ($result->{statute_info}) {
        return "Statute information not provided";
    }
    
    # Check officer info
    for my $field (@{$self->{required_fields}->{officer}}) {
        unless ($result->{officer_info}->{$field}) {
            return "Missing required officer field: $field";
        }
    }
    
    return undef; # No errors
}

=head2 _parse_suspect_info_uk

Parses UK suspect information: name; dob; address

=cut

sub _parse_suspect_info_uk {
    my ($self, $content) = @_;
    my @fields = split /;/, $content;
    if (@fields != 3) {
        die "Invalid UK suspect information format. Expected 3 fields (name; dob; address), got " . scalar(@fields);
    }
    return {
        name    => $fields[0],
        dob     => $self->_parse_date($fields[1]),
        address => $fields[2],
    };
}

=head2 _parse_charge_info_uk

Parses UK charge information: title; date; location; explanation

=cut

sub _parse_charge_info_uk {
    my ($self, $content) = @_;
    my @fields = split /;/, $content;
    if (@fields < 3 || @fields > 4) {
        die "Invalid UK charge information format. Expected 3-4 fields, got " . scalar(@fields);
    }
    my $result = {
        title       => $fields[0],
        date        => $self->_parse_date($fields[1]),
        explanation => $fields[-1],
    };
    $result->{charge_location} = $fields[2] if @fields == 4;
    return $result;
}

=head2 _parse_officer_info_uk

Parses UK officer (prosecutor) information: name; role; date

=cut

sub _parse_officer_info_uk {
    my ($self, $content) = @_;
    my @fields = split /;/, $content;
    if (@fields != 3) {
        die "Invalid UK officer information format. Expected 3 fields, got " . scalar(@fields);
    }
    return {
        name          => $fields[0],
        role_division => $fields[1], # "prosecutor" terminology
        date          => $self->_parse_date($fields[2]),
    };
}

1;

__END__

=head1 AUTHOR

DC4U Development Team

=head1 LICENSE

This software is licensed under the MIT License.

=cut
