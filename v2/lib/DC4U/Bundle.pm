package DC4U::Bundle;

use strict;
use warnings;
use v5.32;

use Digest::SHA qw(sha256_hex);
use File::Basename qw(fileparse basename);
use File::Path qw(make_path);
use File::Spec;

=head1 NAME

DC4U::Bundle - Render multi-format bundle + manifest, optionally zipped

=head1 SYNOPSIS

    use DC4U::Bundle;
    my $bundle = DC4U::Bundle->build(
        input    => 'case123.dc',
        formats  => ['PDF', 'DOCX', 'HTML', 'TXT'],
        out_dir  => './out',
        zip      => 'case123.zip',
        meta     => { case_no => 'A-2025-001' },
    );

=head1 DESCRIPTION

For workflows that need to hand a charge to a case-management system or
e-mail a single attachment to opposing counsel.

For each format, calls C<DC4U::process_dc_file> and writes the artifact
to C<out_dir>. SHA-256 is computed over each artifact. A C<manifest.json>
records the input source, jurisdiction (read from options), generation
timestamp, and per-artifact (filename, format, sha256, bytes).

If C<zip =E<gt> 'foo.zip'> is set, all artifacts plus the manifest are
packaged together. Archive::Zip is already a project dependency (DOCX
generation uses it), so no new install needed.

=cut

sub build {
    my ($class, %opts) = @_;
    my $input    = $opts{input}   or die "input required";
    my $formats  = $opts{formats} || ['PDF', 'HTML', 'TXT'];
    my $out_dir  = $opts{out_dir} // './out';
    my $zip      = $opts{zip};                   # optional zip path
    my $meta     = $opts{meta} || {};
    my $jurisdiction = $opts{jurisdiction};

    make_path($out_dir) unless -d $out_dir;

    require DC4U;

    my ($name, $path, $suffix) = fileparse($input, qr/\.[^.]*$/);
    my @artifacts;

    for my $format (@$formats) {
        my $opts_h = { output_format => $format };
        $opts_h->{jurisdiction} = $jurisdiction if $jurisdiction;
        my $results = DC4U::process_dc_file($input, $format, $opts_h);
        next unless $results && @$results;

        my $ext = lc($format);
        $ext = 'Rmd' if $ext eq 'rmd';

        if (@$results == 1) {
            my $payload = ref $results->[0] eq 'HASH' ? $results->[0]{output} : $results->[0];
            my $art_path = File::Spec->catfile($out_dir, "${name}.${ext}");
            _write_file($art_path, $payload, $format);
            push @artifacts, _artifact($art_path, $format, $payload);
        } else {
            for my $i (0..$#$results) {
                my $payload = ref $results->[$i] eq 'HASH' ? $results->[$i]{output} : $results->[$i];
                my $art_path = File::Spec->catfile($out_dir,
                    "${name}-charge-" . ($i + 1) . ".${ext}");
                _write_file($art_path, $payload, $format);
                push @artifacts, _artifact($art_path, $format, $payload);
            }
        }
    }

    my $manifest = {
        input        => $input,
        jurisdiction => $jurisdiction // '',
        generated_at => _iso_now(),
        formats      => $formats,
        meta         => $meta,
        artifacts    => \@artifacts,
    };

    my $manifest_path = File::Spec->catfile($out_dir, "${name}.manifest.json");
    _write_manifest($manifest_path, $manifest);

    my $zip_path;
    if ($zip) {
        $zip_path = File::Spec->file_name_is_absolute($zip)
            ? $zip : File::Spec->catfile($out_dir, basename($zip));
        _write_zip($zip_path, $manifest_path, \@artifacts);
    }

    return {
        manifest      => $manifest,
        manifest_path => $manifest_path,
        zip_path      => $zip_path,
        artifacts     => \@artifacts,
    };
}

sub _write_file {
    my ($path, $payload, $format) = @_;
    open my $fh, '>', $path or die "Cannot write $path: $!";
    binmode $fh if $format =~ /^(PDF|DOCX)$/;
    print $fh $payload;
    close $fh;
}

sub _artifact {
    my ($path, $format, $payload) = @_;
    return {
        file   => basename($path),
        path   => $path,
        format => uc($format),
        bytes  => length $payload,
        sha256 => sha256_hex($payload),
    };
}

sub _write_manifest {
    my ($path, $m) = @_;
    open my $fh, '>:encoding(UTF-8)', $path or die "Cannot write $path: $!";
    print $fh _to_json($m);
    close $fh;
}

sub _write_zip {
    my ($zip_path, $manifest_path, $artifacts) = @_;
    eval { require Archive::Zip; };
    die "Archive::Zip required for --zip. Install via: cpan Archive::Zip\n" if $@;

    my $zip = Archive::Zip->new();
    $zip->addFile($manifest_path, basename($manifest_path));
    for my $a (@$artifacts) {
        $zip->addFile($a->{path}, $a->{file});
    }
    my $rc = $zip->writeToFileNamed($zip_path);
    die "Failed to write zip $zip_path (rc=$rc)\n" if $rc != 0;
}

sub _iso_now {
    my @t = gmtime();
    return sprintf "%04d-%02d-%02dT%02d:%02d:%02dZ",
        $t[5] + 1900, $t[4] + 1, $t[3], $t[2], $t[1], $t[0];
}

# Recursive JSON serializer for nested hashes / arrays of strings + numbers.
sub _to_json {
    my $v = shift;
    if (!defined $v) { return 'null' }
    if (ref $v eq 'HASH') {
        return '{' . join(',',
            map { qq{"$_":} . _to_json($v->{$_}) } sort keys %$v
        ) . '}';
    }
    if (ref $v eq 'ARRAY') {
        return '[' . join(',', map { _to_json($_) } @$v) . ']';
    }
    if ($v =~ /^-?\d+(?:\.\d+)?$/) {
        return $v;
    }
    my $s = $v;
    $s =~ s/\\/\\\\/g;
    $s =~ s/"/\\"/g;
    $s =~ s/\n/\\n/g;
    $s =~ s/\r/\\r/g;
    $s =~ s/\t/\\t/g;
    return qq{"$s"};
}

1;

__END__

=head1 AUTHOR

DC4U Development Team

=head1 LICENSE

This software is licensed under the MIT License.

=cut
