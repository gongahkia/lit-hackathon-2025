use ExtUtils::MakeMaker;

WriteMakefile(
    NAME         => 'DC4U',
    VERSION_FROM => 'lib/DC4U.pm',
    ABSTRACT     => 'Draft Charges 4 U - Legal Document Generator',
    AUTHOR       => 'DC4U Development Team',
    LICENSE      => 'mit',
    EXE_FILES    => ['bin/dc4u'],
    PREREQ_PM    => {
        'PDF::API2'    => 0,
        'YAML::Tiny'   => 0,
        'Archive::Zip' => 0,
        'Curses'       => 0,
    },
    TEST_REQUIRES => {
        'Test::More' => 0,
    },
    MIN_PERL_VERSION => '5.032',
    META_MERGE => {
        'meta-spec' => { version => 2 },
        resources   => {
            repository => {
                type => 'git',
                url  => 'https://github.com/gongahkia/dc4u.git',
                web  => 'https://github.com/gongahkia/dc4u',
            },
        },
    },
);
