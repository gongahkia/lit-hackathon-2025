# DC4U v2.0 Makefile
# Perl-based legal document generator

PERL = perl
INSTALL_DIR = /usr/local
BIN_DIR = $(INSTALL_DIR)/bin
LIB_DIR = $(INSTALL_DIR)/lib/perl5
CONFIG_DIR = /etc/dc4u
TEMPLATE_DIR = /usr/share/dc4u/templates

# Default target
all: test

# Install DC4U v2.0
install: install-lib install-bin install-config install-templates

install-lib:
	@echo "Installing Perl modules..."
	mkdir -p $(LIB_DIR)/DC4U
	cp lib/DC4U.pm $(LIB_DIR)/
	cp lib/DC4U/*.pm $(LIB_DIR)/DC4U/
	chmod 644 $(LIB_DIR)/DC4U.pm
	chmod 644 $(LIB_DIR)/DC4U/*.pm

install-bin:
	@echo "Installing binary..."
	mkdir -p $(BIN_DIR)
	cp bin/dc4u $(BIN_DIR)/
	chmod 755 $(BIN_DIR)/dc4u

install-config:
	@echo "Installing configuration..."
	mkdir -p $(CONFIG_DIR)
	cp config/dc4u.yaml $(CONFIG_DIR)/
	chmod 644 $(CONFIG_DIR)/dc4u.yaml

install-templates:
	@echo "Installing templates..."
	mkdir -p $(TEMPLATE_DIR)
	cp -r templates/* $(TEMPLATE_DIR)/
	chmod -R 644 $(TEMPLATE_DIR)/*

# Uninstall DC4U v2.0
uninstall:
	@echo "Uninstalling DC4U v2.0..."
	rm -f $(BIN_DIR)/dc4u
	rm -f $(LIB_DIR)/DC4U.pm
	rm -rf $(LIB_DIR)/DC4U
	rm -rf $(CONFIG_DIR)
	rm -rf $(TEMPLATE_DIR)

# Test the installation
test: test-syntax test-basic

test-syntax:
	@echo "Testing Perl syntax..."
	$(PERL) -Ilib -c lib/DC4U.pm
	$(PERL) -Ilib -c lib/DC4U/Lexer.pm
	$(PERL) -Ilib -c lib/DC4U/Parser.pm
	$(PERL) -Ilib -c lib/DC4U/Generator.pm
	$(PERL) -Ilib -c lib/DC4U/Template.pm
	$(PERL) -Ilib -c lib/DC4U/Config.pm
	$(PERL) -Ilib -c lib/DC4U/Logger.pm
	$(PERL) -Ilib -c lib/DC4U/Theme.pm
	$(PERL) -Ilib -c lib/DC4U/Lint.pm
	$(PERL) -Ilib -c lib/DC4U/Watch.pm
	$(PERL) -Ilib -c lib/DC4U/Scaffold.pm
	$(PERL) -Ilib -c lib/DC4U/Anonymize.pm
	$(PERL) -Ilib -c lib/DC4U/Preprocessor.pm
	$(PERL) -Ilib -c lib/DC4U/Diff.pm
	$(PERL) -Ilib -c lib/DC4U/Watermark.pm
	$(PERL) -Ilib -c lib/DC4U/Bundle.pm
	$(PERL) -Ilib -c lib/DC4U/BatchCSV.pm
	$(PERL) -Ilib -c lib/DC4U/Audit.pm
	$(PERL) -Ilib -c bin/dc4u

test-basic:
	@echo "Testing basic functionality..."
	$(PERL) -Ilib bin/dc4u --help > /dev/null 2>&1 || true
	$(PERL) -Ilib bin/dc4u --version

# Create test output
test-output:
	@echo "Creating test output..."
	mkdir -p test_output
	$(PERL) -Ilib bin/dc4u --format HTML --output test_output/test.html examples/test_simple.dc
	$(PERL) -Ilib bin/dc4u --format TXT --output test_output/test.txt examples/test_simple.dc
	$(PERL) -Ilib bin/dc4u --format MD --output test_output/test.md examples/test_simple.dc

# Clean up
clean:
	@echo "Cleaning up..."
	rm -rf test_output
	rm -f *.tmp

# Show help
help:
	@echo "DC4U v2.0 Makefile Commands:"
	@echo "  make install     - Install DC4U v2.0 system-wide"
	@echo "  make uninstall  - Remove DC4U v2.0 from system"
	@echo "  make test       - Run syntax and basic tests"
	@echo "  make test-output - Generate test output files"
	@echo "  make clean      - Clean up temporary files"
	@echo "  make help       - Show this help"

.PHONY: all install uninstall test test-syntax test-basic test-output clean help
