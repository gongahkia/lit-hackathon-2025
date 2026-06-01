# DC4U Multi-Version Makefile
# Root makefile for navigating between versions

.PHONY: help v1 v2 test clean tui brew-install ci-local lint
.PHONY: v1-install v1-test v2-install v2-test

# Default target
help:
	@echo "DC4U Multi-Version Repository"
	@echo "============================="
	@echo ""
	@echo "Available commands:"
	@echo "  make v1           - Work with DC4U v1.0 (Python)"
	@echo "  make v2           - Work with DC4U v2.0 (Perl)"
	@echo "  make tui          - Launch interactive TUI"
	@echo "  make test         - Test both versions"
	@echo "  make lint         - Syntax check all .pm files"
	@echo "  make ci-local     - Run full test suite matching CI"
	@echo "  make brew-install - Local tap + brew install"
	@echo "  make clean        - Clean up temporary files"
	@echo "  make help         - Show this help"
	@echo ""
	@echo "Version-specific commands:"
	@echo "  make v1-install    - Install DC4U v1.0"
	@echo "  make v1-test       - Test DC4U v1.0"
	@echo "  make v2-install    - Install DC4U v2.0"
	@echo "  make v2-test       - Test DC4U v2.0"

# launch interactive TUI
tui:
	@perl -Iv2/lib v2/bin/dc4u

# local Homebrew tap + install
brew-install:
	@mkdir -p $(shell brew --prefix)/Homebrew/Library/Taps/local/homebrew-dc4u/Formula 2>/dev/null || true
	@cp Formula/dc4u.rb $(shell brew --prefix)/Homebrew/Library/Taps/local/homebrew-dc4u/Formula/ 2>/dev/null || true
	@echo "Formula copied. Run: brew install local/dc4u/dc4u"

# run full test suite matching CI
ci-local:
	@echo "=== Syntax check ==="
	@cd v2 && perl -Ilib -c lib/DC4U.pm
	@cd v2 && perl -Ilib -c lib/DC4U/Lexer.pm
	@cd v2 && perl -Ilib -c lib/DC4U/Parser.pm
	@cd v2 && perl -Ilib -c lib/DC4U/Generator.pm
	@cd v2 && perl -Ilib -c lib/DC4U/Template.pm
	@cd v2 && perl -Ilib -c lib/DC4U/Config.pm
	@cd v2 && perl -Ilib -c lib/DC4U/Logger.pm
	@cd v2 && perl -Ilib -c lib/DC4U/Theme.pm
	@cd v2 && perl -Ilib -c lib/DC4U/Lint.pm
	@cd v2 && perl -Ilib -c lib/DC4U/Watch.pm
	@cd v2 && perl -Ilib -c lib/DC4U/Scaffold.pm
	@cd v2 && perl -Ilib -c lib/DC4U/Anonymize.pm
	@cd v2 && perl -Ilib -c lib/DC4U/Preprocessor.pm
	@cd v2 && perl -Ilib -c lib/DC4U/Diff.pm
	@cd v2 && perl -Ilib -c lib/DC4U/Watermark.pm
	@cd v2 && perl -Ilib -c lib/DC4U/Bundle.pm
	@cd v2 && perl -Ilib -c lib/DC4U/BatchCSV.pm
	@cd v2 && perl -Ilib -c lib/DC4U/Audit.pm
	@cd v2 && perl -Ilib -c bin/dc4u
	@echo "=== Unit tests ==="
	@cd v2 && prove -Ilib t/

# lint: perl -cw on all .pm files
lint:
	@echo "Linting all .pm files..."
	@find v2/lib -name '*.pm' -exec perl -Iv2/lib -cw {} \;

# navigate to v1 directory
v1:
	@echo "Switching to DC4U v1.0 (Python)..."
	@cd v1 && make help

# navigate to v2 directory
v2:
	@echo "Switching to DC4U v2.0 (Perl)..."
	@cd v2 && make help

# test both versions
test:
	@echo "Testing DC4U v1.0..."
	@cd v1 && make test
	@echo ""
	@echo "Testing DC4U v2.0..."
	@cd v2 && make test

# clean up temporary files
clean:
	@echo "Cleaning up temporary files..."
	@cd v1 && make clean
	@cd v2 && make clean
	@rm -f *.tmp *.temp

# version-specific installs
v1-install:
	@cd v1 && make install

v2-install:
	@cd v2 && make install

# version-specific tests
v1-test:
	@cd v1 && make test

v2-test:
	@cd v2 && make test