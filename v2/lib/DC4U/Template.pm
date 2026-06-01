package DC4U::Template;

use strict;
use warnings;
use v5.32;

=head1 NAME

DC4U::Template - Template management system

=head1 SYNOPSIS

    my $template = DC4U::Template->new();
    my $rendered = $template->render('singapore_charge', $data);

=head1 DESCRIPTION

Manages document templates for different jurisdictions and output formats.
Supports Singapore legal document templates with extensibility for UK templates.

=cut

sub new {
    my $class = shift;
    my $self = {
        templates => {
            singapore => {
                charge => {
                    header => _singapore_header(),
                    suspect => _singapore_suspect(),
                    charge => _singapore_charge(),
                    officer => _singapore_officer()
                }
            },
            uk => {
                charge => {
                    header => _uk_header(),
                    suspect => _uk_suspect(),
                    charge => _uk_charge(),
                    officer => _uk_officer()
                }
            },
            australia => {
                charge => {
                    header => _australia_header(),
                    suspect => _australia_suspect(),
                    charge => _australia_charge(),
                    officer => _australia_officer()
                }
            },
            india => {
                charge => {
                    header => _india_header(),
                    suspect => _india_suspect(),
                    charge => _india_charge(),
                    officer => _india_officer()
                }
            },
            malaysia => {
                charge => {
                    header => _malaysia_header(),
                    suspect => _malaysia_suspect(),
                    charge => _malaysia_charge(),
                    officer => _malaysia_officer()
                }
            }
        }
    };
    bless $self, $class;
    return $self;
}

=head2 render

Renders template with data.

=cut

sub render {
    my ($self, $template_name, $data, $format) = @_;
    
    my ($jurisdiction, $type) = split /_/, $template_name;
    
    unless (exists $self->{templates}->{$jurisdiction}->{$type}) {
        die "Template not found: $template_name";
    }
    
    my $template = $self->{templates}->{$jurisdiction}->{$type};
    
    # Render based on format
    if ($format eq 'HTML') {
        return $self->_render_html($template, $data);
    } elsif ($format eq 'PDF') {
        return $self->_render_pdf($template, $data);
    } elsif ($format eq 'TXT') {
        return $self->_render_txt($template, $data);
    } elsif ($format eq 'MD') {
        return $self->_render_md($template, $data);
    } else {
        return $self->_render_html($template, $data);
    }
}

=head2 _render_html

Renders HTML template.

=cut

sub _render_html {
    my ($self, $template, $data) = @_;
    
    my $html = $template->{header};
    $html .= $template->{suspect};
    $html .= $template->{charge};
    $html .= $template->{officer};
    
    # replace placeholders — Singapore
    $html =~ s/\{\{suspect_name\}\}/$data->{suspect_info}->{name} \/\/ ''/ge;
    $html =~ s/\{\{suspect_nric\}\}/$data->{suspect_info}->{nric} \/\/ ''/ge;
    $html =~ s/\{\{suspect_race\}\}/$data->{suspect_info}->{race} \/\/ ''/ge;
    $html =~ s/\{\{suspect_age\}\}/$data->{suspect_info}->{age} \/\/ ''/ge;
    $html =~ s/\{\{suspect_gender\}\}/$data->{suspect_info}->{gender} \/\/ ''/ge;
    $html =~ s/\{\{suspect_nationality\}\}/$data->{suspect_info}->{nationality} \/\/ ''/ge;
    
    # replace placeholders — UK
    $html =~ s/\{\{suspect_dob\}\}/$data->{suspect_info}->{dob} \/\/ ''/ge;
    $html =~ s/\{\{suspect_address\}\}/$data->{suspect_info}->{address} \/\/ ''/ge;
    $html =~ s/\{\{charge_location\}\}/$data->{charge_info}->{charge_location} \/\/ ''/ge;
    $html =~ s/\{\{charge_description\}\}/$data->{charge_info}->{explanation} \/\/ ''/ge;
    
    $html =~ s/\{\{charge_title\}\}/$data->{charge_info}->{title}/g;
    $html =~ s/\{\{charge_date\}\}/$data->{charge_info}->{date}/g;
    $html =~ s/\{\{charge_explanation\}\}/$data->{charge_info}->{explanation}/g;
    
    $html =~ s/\{\{statute\}\}/$data->{statute_info}/g;
    
    $html =~ s/\{\{officer_name\}\}/$data->{officer_info}->{name}/g;
    $html =~ s/\{\{officer_role\}\}/$data->{officer_info}->{role_division}/g;
    $html =~ s/\{\{officer_date\}\}/$data->{officer_info}->{date}/g;
    
    return $html;
}

=head2 _render_pdf

Renders PDF template.

=cut

sub _render_pdf {
    my ($self, $template, $data) = @_;
    
    # Try to locate pandoc
    my $pandoc_path = `which pandoc` || '/opt/homebrew/bin/pandoc';
    chomp $pandoc_path;
    unless (-x $pandoc_path) {
        die "Error: pandoc not found. Please install pandoc to generate PDFs.";
    }
    
    my $html = $self->_render_html($template, $data);
    
    # Use File::Temp for safe file handling
    require File::Temp;
    my ($fh_in, $in_file) = File::Temp::tempfile(SUFFIX => '.html', UNLINK => 1);
    binmode $fh_in, ':encoding(UTF-8)';
    print $fh_in "<html><body>\n" . $html . "\n</body></html>";
    close $fh_in;
    
    my ($fh_out, $out_file) = File::Temp::tempfile(SUFFIX => '.pdf', UNLINK => 1);
    close $fh_out;
    
    # Convert using pandoc
    my $cmd = "$pandoc_path -s \"$in_file\" -o \"$out_file\" 2>&1";
    my $output = `$cmd`;
    
    if ($? != 0) {
        die "PDF generation failed (pandoc): $output";
    }
    
    # Read binary PDF content
    open my $pdf_fh, '<', $out_file or die "Cannot read generated PDF: $!";
    binmode $pdf_fh;
    local $/;
    my $content = <$pdf_fh>;
    close $pdf_fh;
    
    return $content;
}

=head2 _render_txt

Renders plain text template.

=cut

sub _render_txt {
    my ($self, $template, $data) = @_;
    
    my $html = $self->_render_html($template, $data);
    
    # Convert HTML to plain text
    $html =~ s/<[^>]+>//g;
    $html =~ s/&nbsp;/ /g;
    $html =~ s/&amp;/&/g;
    $html =~ s/&lt;/</g;
    $html =~ s/&gt;/>/g;
    
    return $html;
}

=head2 _render_md

Renders Markdown template.

=cut

sub _render_md {
    my ($self, $template, $data) = @_;
    
    my $html = $self->_render_html($template, $data);
    
    # Convert HTML to Markdown
    $html =~ s/<h1[^>]*>(.*?)<\/h1>/# $1\n\n/g;
    $html =~ s/<h2[^>]*>(.*?)<\/h2>/## $1\n\n/g;
    $html =~ s/<p[^>]*>(.*?)<\/p>/$1\n\n/g;
    $html =~ s/<br\s*\/?>\s*/\n/g;
    $html =~ s/<[^>]+>//g;
    $html =~ s/&nbsp;/ /g;
    $html =~ s/&amp;/&/g;
    $html =~ s/&lt;/</g;
    $html =~ s/&gt;/>/g;
    
    return $html;
}

=head2 _singapore_header

Singapore charge header template.

=cut

sub _singapore_header {
    return <<'HTML';
<div class="header">
    <h1>Criminal Procedure Code 2010</h1>
    <h2>(CHAPTER 68)</h2>
    <h2>REVISED EDITION 2012</h2>
    <h2>SECTIONS 123-125</h2>
    <h1>CHARGE</h1>
</div>
HTML
}

=head2 _singapore_suspect

Singapore suspect information template.

=cut

sub _singapore_suspect {
    return <<'HTML';
<div class="suspect-info">
    <p>You,</p>
    <p><span class="bold">Name:</span> {{suspect_name}}</p>
    <p><span class="bold">NRIC:</span> {{suspect_nric}}</p>
    <p><span class="bold">Race:</span> {{suspect_race}}</p>
    <p><span class="bold">Age:</span> {{suspect_age}}</p>
    <p><span class="bold">Sex:</span> {{suspect_gender}}</p>
    <p><span class="bold">Nationality:</span> {{suspect_nationality}}</p>
</div>
HTML
}

=head2 _singapore_charge

Singapore charge information template.

=cut

sub _singapore_charge {
    return <<'HTML';
<div class="charge-section">
    <p>are charged that you, on (or about) {{charge_date}} at [location, add as necessary], Singapore, did [add brief summary of charge], <em>to wit</em> {{charge_explanation}}, and you have thereby committed an offence under {{statute}}.</p>
</div>
HTML
}

=head2 _singapore_officer

Singapore officer information template.

=cut

sub _singapore_officer {
    return <<'HTML';
<div class="officer-info">
    <p>{{officer_name}}</p>
    <p>{{officer_role}}</p>
    <p>{{officer_date}}</p>
</div>
HTML
}

=head2 _uk_header

UK charge header template.

=cut

sub _uk_header {
    return <<'HTML';
<div class="header">
    <h1>Criminal Justice Act 2003</h1>
    <h2>CHARGE SHEET</h2>
</div>
HTML
}

=head2 _uk_suspect

UK suspect information template.

=cut

sub _uk_suspect {
    return <<'HTML';
<div class="suspect-info">
    <p>Defendant:</p>
    <p><span class="bold">Name:</span> {{suspect_name}}</p>
    <p><span class="bold">Date of Birth:</span> {{suspect_dob}}</p>
    <p><span class="bold">Address:</span> {{suspect_address}}</p>
</div>
HTML
}

=head2 _uk_charge

UK charge information template.

=cut

sub _uk_charge {
    return <<'HTML';
<div class="charge-section">
    <p>That you on {{charge_date}} at {{charge_location}}, did {{charge_description}}, contrary to {{statute}}.</p>
</div>
HTML
}

=head2 _uk_officer

UK officer information template.

=cut

sub _uk_officer {
    return <<'HTML';
<div class="officer-info">
    <p>Prosecutor: {{officer_name}}</p>
    <p>{{officer_role}}</p>
    <p>Date: {{officer_date}}</p>
</div>
HTML
}

sub _australia_header {
    return <<'HTML';
<div class="header">
    <h1>Criminal Charge</h1>
    <h2>CHARGE SHEET</h2>
    <h2>Commonwealth of Australia</h2>
</div>
HTML
}

sub _australia_suspect {
    return <<'HTML';
<div class="suspect-info">
    <p>Accused:</p>
    <p><span class="bold">Full Name:</span> {{suspect_name}}</p>
    <p><span class="bold">Date of Birth:</span> {{suspect_dob}}</p>
    <p><span class="bold">Address:</span> {{suspect_address}}</p>
</div>
HTML
}

sub _australia_charge {
    return <<'HTML';
<div class="charge-section">
    <p>That on or about {{charge_date}} at {{charge_location}}, the accused did {{charge_description}}, contrary to {{statute}}.</p>
</div>
HTML
}

sub _australia_officer {
    return <<'HTML';
<div class="officer-info">
    <p>Informant: {{officer_name}}</p>
    <p>{{officer_role}}</p>
    <p>Date of Charge: {{officer_date}}</p>
</div>
HTML
}

sub _india_header {
    return <<'HTML';
<div class="header">
    <h1>First Information Report</h1>
    <h2>CHARGE SHEET</h2>
    <h2>Republic of India</h2>
</div>
HTML
}

sub _india_suspect {
    return <<'HTML';
<div class="suspect-info">
    <p>Accused Person:</p>
    <p><span class="bold">Name:</span> {{suspect_name}}</p>
    <p><span class="bold">Date of Birth:</span> {{suspect_dob}}</p>
    <p><span class="bold">Address:</span> {{suspect_address}}</p>
</div>
HTML
}

sub _india_charge {
    return <<'HTML';
<div class="charge-section">
    <p>That on or about {{charge_date}} at {{charge_location}}, the accused did commit the offence of {{charge_description}}, punishable under {{statute}}.</p>
</div>
HTML
}

sub _india_officer {
    return <<'HTML';
<div class="officer-info">
    <p>Investigating Officer: {{officer_name}}</p>
    <p>{{officer_role}}</p>
    <p>Date: {{officer_date}}</p>
</div>
HTML
}

sub _malaysia_header {
    return <<'HTML';
<div class="header">
    <h1>Kanun Prosedur Jenayah</h1>
    <h2>(Criminal Procedure Code)</h2>
    <h2>PERTUDUHAN / CHARGE</h2>
</div>
HTML
}

sub _malaysia_suspect {
    return <<'HTML';
<div class="suspect-info">
    <p>Bahawa kamu / You,</p>
    <p><span class="bold">Nama / Name:</span> {{suspect_name}}</p>
    <p><span class="bold">No. K/P / NRIC:</span> {{suspect_nric}}</p>
    <p><span class="bold">Bangsa / Race:</span> {{suspect_race}}</p>
    <p><span class="bold">Umur / Age:</span> {{suspect_age}}</p>
    <p><span class="bold">Jantina / Sex:</span> {{suspect_gender}}</p>
    <p><span class="bold">Kewarganegaraan / Nationality:</span> {{suspect_nationality}}</p>
</div>
HTML
}

sub _malaysia_charge {
    return <<'HTML';
<div class="charge-section">
    <p>adalah dituduh bahawa kamu pada / are charged that you on (or about) {{charge_date}} di / at [tempat / location, add as necessary], Malaysia, telah / did {{charge_explanation}}, dan dengan itu kamu telah melakukan satu kesalahan di bawah / and you have thereby committed an offence under {{statute}}.</p>
</div>
HTML
}

sub _malaysia_officer {
    return <<'HTML';
<div class="officer-info">
    <p>{{officer_name}}</p>
    <p>{{officer_role}}</p>
    <p>Tarikh / Date: {{officer_date}}</p>
</div>
HTML
}

1;

__END__

=head1 AUTHOR

DC4U Development Team

=head1 LICENSE

This software is licensed under the MIT License.

=cut
