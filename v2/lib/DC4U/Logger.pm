package DC4U::Logger;

use strict;
use warnings;
use v5.32;

=head1 NAME

DC4U::Logger - Logging system for DC4U

=head1 SYNOPSIS

    my $logger = DC4U::Logger->new('INFO');
    $logger->info('Processing file');
    $logger->error('Error occurred');

=head1 DESCRIPTION

Provides logging functionality for DC4U with different log levels.

=cut

sub new {
    my ($class, $level, %opts) = @_;
    my $self = {
        level => $level || 'INFO',
        levels => {
            'DEBUG' => 0,
            'INFO'  => 1,
            'WARN'  => 2,
            'ERROR' => 3,
            'FATAL' => 4
        },
        log_file => $opts{log_file},
        fh       => undef,
    };
    if ($self->{log_file}) {
        open my $fh, '>>', $self->{log_file}
            or die "Cannot open log file $self->{log_file}: $!";
        $fh->autoflush(1);
        $self->{fh} = $fh;
    }
    bless $self, $class;
    return $self;
}

=head2 debug

Logs debug message.

=cut

sub debug {
    my ($self, $message) = @_;
    $self->_log('DEBUG', $message);
}

=head2 info

Logs info message.

=cut

sub info {
    my ($self, $message) = @_;
    $self->_log('INFO', $message);
}

=head2 warn

Logs warning message.

=cut

sub warn {
    my ($self, $message) = @_;
    $self->_log('WARN', $message);
}

=head2 error

Logs error message.

=cut

sub error {
    my ($self, $message) = @_;
    $self->_log('ERROR', $message);
}

=head2 fatal

Logs fatal message.

=cut

sub fatal {
    my ($self, $message) = @_;
    $self->_log('FATAL', $message);
}

=head2 _log

Internal logging method. Writes to log_file if set, else STDERR.

=cut

sub _log {
    my ($self, $level, $message) = @_;
    
    return unless $self->{levels}->{$level} >= $self->{levels}->{$self->{level}};
    
    my $timestamp = localtime();
    my $log_entry = "[$timestamp] [$level] $message\n";
    
    if ($self->{fh}) {
        print { $self->{fh} } $log_entry;
    } else {
        print STDERR $log_entry;
    }
}

1;

__END__

=head1 AUTHOR

DC4U Development Team

=head1 LICENSE

This software is licensed under the MIT License.

=cut
