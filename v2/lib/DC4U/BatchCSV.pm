package DC4U::BatchCSV;

use strict;
use warnings;
use v5.32;

use File::Path qw(make_path);
use File::Basename qw(basename);

=head1 NAME

DC4U::BatchCSV - Render many .dc charges from a CSV + template

=head1 SYNOPSIS

    use DC4U::BatchCSV;
    my $report = DC4U::BatchCSV->run(
        csv      => 'suspects.csv',
        template => 'skeleton.dc',
        out_dir  => './out',
        format   => 'PDF',
        on_render => sub { my ($row, $path) = @_; print "wrote $path\n" },
    );

=head1 DESCRIPTION

Treats a C<.dc> file as a Mustache-lite template containing C<{{column}}>
placeholders matching CSV header names. For each CSV row, substitutes
values, runs the file through DC4U::process_dc_string, and writes the
output to C<out_dir/<row_id>.<ext>>.

CSV parsing is intentionally minimal - handles double-quoted fields with
embedded commas and doubled-quote escaping (RFC 4180), but not multi-line
fields. If you need that, install Text::CSV and we'll switch to it; for
now the dependency-free path covers 95% of the actual data lawyers feed in.

=cut

sub run {
    my ($class, %opts) = @_;
    my $csv_path  = $opts{csv}      or die "csv required";
    my $tmpl_path = $opts{template} or die "template required";
    my $out_dir   = $opts{out_dir}  // './out';
    my $format    = uc($opts{format} // 'PDF');
    my $on_render = $opts{on_render};
    my $jurisdiction = $opts{jurisdiction};
    my $id_column = $opts{id_column}; # optional CSV column to use as filename

    make_path($out_dir) unless -d $out_dir;

    open my $tfh, '<', $tmpl_path or die "Cannot open template $tmpl_path: $!";
    my $tmpl = do { local $/; <$tfh> };
    close $tfh;

    my @rows = _read_csv($csv_path);
    die "CSV $csv_path has no data rows\n" unless @rows >= 1;
    my $header = shift @rows;

    require DC4U;

    my $ext = lc($format);
    $ext = 'Rmd' if $ext eq 'rmd';

    my @results;
    my $row_n = 0;
    for my $row (@rows) {
        $row_n++;
        my %fields;
        @fields{ @$header } = @$row;

        my $body = _substitute($tmpl, \%fields);
        my $opts_h = { output_format => $format };
        $opts_h->{jurisdiction} = $jurisdiction if $jurisdiction;
        my $rendered = DC4U::process_dc_string($body, $format, $opts_h);

        my $stem = $id_column && exists $fields{$id_column}
            ? _safe_filename($fields{$id_column})
            : sprintf("row_%04d", $row_n);
        my $out_path = "$out_dir/${stem}.${ext}";

        # process_dc_string returns arrayref of charge results
        my $payload = $rendered && @$rendered
            ? join("\n\n--- charge ---\n\n",
                map { ref($_) eq 'HASH' ? $_->{output} : $_ } @$rendered)
            : '';

        open my $ofh, '>', $out_path or die "Cannot write $out_path: $!";
        binmode $ofh if $format =~ /^(PDF|DOCX)$/;
        print $ofh $payload;
        close $ofh;

        push @results, { row => $row_n, fields => \%fields, output => $out_path };
        $on_render->(\%fields, $out_path) if $on_render;
    }

    return {
        rows_processed => scalar(@results),
        out_dir        => $out_dir,
        results        => \@results,
    };
}

# Mustache-lite: {{name}}. Missing keys leave the placeholder intact so
# the downstream Lint catches them.
sub _substitute {
    my ($tmpl, $fields) = @_;
    $tmpl =~ s/\{\{(\w+)\}\}/exists $fields->{$1} ? $fields->{$1} : "{{$1}}"/ge;
    return $tmpl;
}

# RFC4180-ish CSV reader. Handles "quoted, fields" and "doubled""quotes".
# Returns a list of arrayrefs (one per line, including the header).
sub _read_csv {
    my $path = shift;
    open my $fh, '<:encoding(UTF-8)', $path or die "Cannot open CSV $path: $!";
    my @rows;
    while (my $line = <$fh>) {
        chomp $line;
        next if $line eq '';
        push @rows, _parse_csv_line($line);
    }
    close $fh;
    return @rows;
}

sub _parse_csv_line {
    my $line = shift;
    my @fields;
    my $cur = '';
    my $in_quote = 0;
    my $i = 0;
    while ($i < length $line) {
        my $c = substr($line, $i, 1);
        if ($in_quote) {
            if ($c eq '"' && substr($line, $i+1, 1) eq '"') {
                $cur .= '"';
                $i += 2;
                next;
            }
            if ($c eq '"') {
                $in_quote = 0;
                $i++;
                next;
            }
            $cur .= $c;
            $i++;
        } else {
            if ($c eq ',') {
                push @fields, $cur;
                $cur = '';
                $i++;
                next;
            }
            if ($c eq '"' && $cur eq '') {
                $in_quote = 1;
                $i++;
                next;
            }
            $cur .= $c;
            $i++;
        }
    }
    push @fields, $cur;
    return \@fields;
}

# Strip filesystem-hostile characters so a CSV value like "S/N 12345"
# becomes "S_N_12345" rather than escaping out of $out_dir.
sub _safe_filename {
    my $s = shift;
    $s = '' unless defined $s;
    $s =~ s{[/\\:*?"<>|]}{_}g;
    $s =~ s/\s+/_/g;
    $s =~ s/^\.+//;
    return length($s) ? $s : 'row';
}

1;

__END__

=head1 AUTHOR

DC4U Development Team

=head1 LICENSE

This software is licensed under the MIT License.

=cut
