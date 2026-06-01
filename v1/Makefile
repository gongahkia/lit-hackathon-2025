# DC4U v1.0 Makefile
# Python-based legal document generator

PYTHON = python3
PIP = pip3

# Default target
all: install

# Install dependencies
install-deps:
	@echo "Installing Python dependencies..."
	$(PIP) install -r requirements.txt

# Install DC4U v1.0
install: install-deps
	@echo "DC4U v1.0 installed successfully!"
	@echo "Usage: python3 src/main.py"

# Run DC4U v1.0
run:
	@echo "Running DC4U v1.0..."
	$(PYTHON) src/main.py

# Test the installation
test:
	@echo "Testing DC4U v1.0..."
	$(PYTHON) -m py_compile src/main.py
	$(PYTHON) -m py_compile src/lexer.py
	$(PYTHON) -m py_compile src/interpreter.py
	@echo "DC4U v1.0 syntax OK"

# Clean up
clean:
	@echo "Cleaning up..."
	find . -name "*.pyc" -delete
	find . -name "__pycache__" -delete

# Show help
help:
	@echo "DC4U v1.0 Makefile Commands:"
	@echo "  make install-deps - Install Python dependencies"
	@echo "  make install      - Install DC4U v1.0"
	@echo "  make run          - Run DC4U v1.0"
	@echo "  make test         - Test the installation"
	@echo "  make clean        - Clean up temporary files"
	@echo "  make help         - Show this help"

.PHONY: all install install-deps run test clean help
