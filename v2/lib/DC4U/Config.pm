package DC4U::Config;

use strict;
use warnings;
use v5.32;

=head1 NAME

DC4U::Config - Configuration management

=head1 SYNOPSIS

    my $config = DC4U::Config->new('config.yaml');
    my $value = $config->get('output_directory');

=head1 DESCRIPTION

Manages configuration settings for DC4U with support for YAML configuration files.

=cut

sub new {
    my ($class, $config_file) = @_;
    my $self = {
        config_file => $config_file,
        settings => {
            # Default settings
            output_directory => './output',
            log_level => 'INFO',
            jurisdiction => 'singapore',
            template_directory => './templates',
            default_format => 'PDF',
            date_format => 'DD/MM/YYYY',
            timezone => 'Asia/Singapore',
            theme => 'classic',
            
            # Singapore-specific settings
            singapore => {
                court_name => 'State Courts of Singapore',
                legal_act => 'Criminal Procedure Code 2010',
                act_chapter => 'CHAPTER 68',
                act_edition => 'REVISED EDITION 2012',
                sections => 'SECTIONS 123-125'
            },
            
            # UK-specific settings
            uk => {
                court_name => 'Magistrates Court',
                legal_act => 'Criminal Justice Act 2003',
                act_chapter => 'CHAPTER 44',
                act_edition => 'REVISED EDITION 2020',
                sections => 'SECTIONS 1-10'
            },
            
            # Australia defaults
            australia => {
                court_name => 'Local Court of New South Wales',
                legal_act => 'Crimes Act 1900 (NSW)',
                act_chapter => 'Act 40 of 1900',
                act_edition => 'Consolidated',
                sections => 'Section 117'
            },
            
            # India defaults
            india => {
                court_name => 'District Court',
                legal_act => 'Indian Penal Code 1860',
                act_chapter => 'Chapter XVII',
                act_edition => '1860 Act',
                sections => 'Section 379'
            },
            
            # Malaysia defaults
            malaysia => {
                court_name => 'Mahkamah Majistret',
                legal_act => 'Penal Code (Act 574)',
                act_chapter => 'Chapter XVII',
                act_edition => 'Revised 1976',
                sections => 'Section 379'
            }
        }
    };
    
    # Load configuration file if provided
    if ($config_file && -f $config_file) {
        $self->_load_config_file($config_file);
    }
    
    bless $self, $class;
    return $self;
}

=head2 get

Gets configuration value.

=cut

sub get {
    my ($self, $key) = @_;
    
    if ($key =~ /^(\w+)\.(\w+)$/) {
        my ($section, $subkey) = ($1, $2);
        return $self->{settings}->{$section}->{$subkey};
    }
    
    return $self->{settings}->{$key};
}

=head2 set

Sets configuration value.

=cut

sub set {
    my ($self, $key, $value) = @_;
    
    if ($key =~ /^(\w+)\.(\w+)$/) {
        my ($section, $subkey) = ($1, $2);
        $self->{settings}->{$section}->{$subkey} = $value;
    } else {
        $self->{settings}->{$key} = $value;
    }
}

=head2 get_jurisdiction_settings

Gets settings for current jurisdiction.

=cut

sub get_jurisdiction_settings {
    my $self = shift;
    my $jurisdiction = $self->get('jurisdiction');
    return $self->{settings}->{$jurisdiction};
}

=head2 _load_config_file

Loads configuration from YAML file.

=cut

sub _load_config_file {
    my ($self, $config_file) = @_;
    
    # Try to load YAML
    eval { require YAML::Tiny; };
    if ($@) {
        # Fallback to simple key=value format
        $self->_load_simple_config($config_file);
        return;
    }
    
    my $yaml = YAML::Tiny->read($config_file);
    if ($yaml) {
        my $config = $yaml->[0];
        $self->_merge_config($config);
    }
}

=head2 _load_simple_config

Loads simple key=value configuration.

=cut

sub _load_simple_config {
    my ($self, $config_file) = @_;
    
    open my $fh, '<', $config_file or return;
    
    while (my $line = <$fh>) {
        next if $line =~ /^\s*#/; # Skip comments
        next if $line =~ /^\s*$/;  # Skip empty lines
        
        if ($line =~ /^([^=]+)=(.*)$/) {
            my ($key, $value) = ($1, $2);
            $key =~ s/^\s+|\s+$//g;
            $value =~ s/^\s+|\s+$//g;
            $value =~ s/^["']|["']$//g; # Remove quotes
            
            $self->set($key, $value);
        }
    }
    
    close $fh;
}

=head2 _merge_config

Merges configuration data.

=cut

sub _merge_config {
    my ($self, $config) = @_;
    
    for my $key (keys %$config) {
        if (ref $config->{$key} eq 'HASH') {
            $self->{settings}->{$key} = { %{$self->{settings}->{$key} || {}}, %{$config->{$key}} };
        } else {
            $self->{settings}->{$key} = $config->{$key};
        }
    }
}

=head2 save_config

Saves configuration to file.

=cut

sub save_config {
    my ($self, $output_file) = @_;
    
    eval { require YAML::Tiny; };
    if ($@) {
        # Fallback to simple format
        $self->_save_simple_config($output_file);
        return;
    }
    
    my $yaml = YAML::Tiny->new();
    $yaml->[0] = $self->{settings};
    $yaml->write($output_file);
}

=head2 _save_simple_config

Saves configuration in simple format.

=cut

sub _save_simple_config {
    my ($self, $output_file) = @_;
    
    open my $fh, '>', $output_file or die "Cannot write to $output_file: $!";
    
    for my $key (sort keys %{$self->{settings}}) {
        my $value = $self->{settings}->{$key};
        if (ref $value eq 'HASH') {
            for my $subkey (sort keys %$value) {
                print $fh "$key.$subkey = $value->{$subkey}\n";
            }
        } else {
            print $fh "$key = $value\n";
        }
    }
    
    close $fh;
}

1;

__END__

=head1 AUTHOR

DC4U Development Team

=head1 LICENSE

This software is licensed under the MIT License.

=cut
