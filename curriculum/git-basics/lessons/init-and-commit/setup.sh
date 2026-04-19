#!/bin/bash
# Setup script for "Initialize a Repository & Make Your First Commit"
#
# Creates a practice directory with starter files for the student to work with.
# Run with: bash setup.sh

PRACTICE_DIR="practice-repo"

# Clean up if it already exists
if [ -d "$PRACTICE_DIR" ]; then
    echo "Removing existing practice-repo directory..."
    rm -rf "$PRACTICE_DIR"
fi

mkdir -p "$PRACTICE_DIR"

# Create a README with real content — not placeholder text
cat > "$PRACTICE_DIR/README.md" << 'EOF'
# Community Tool Library

A neighborhood tool-sharing program where residents can borrow tools
instead of buying them. Because not everyone needs to own a circular saw,
but everyone deserves to build something.

## Mission

Reduce waste, build community, and make DIY accessible to everyone
regardless of income.

## How It Works

1. Donate tools you rarely use
2. Browse the catalog online
3. Reserve and pick up from the community center
4. Return within 7 days

## Status

This project is just getting started. We need volunteers.
EOF

echo ""
echo "Practice repository created at ./$PRACTICE_DIR"
echo ""
echo "Next steps:"
echo "  cd $PRACTICE_DIR"
echo "  git init"
echo "  git add README.md"
echo "  git commit -m 'Add project README with mission statement'"
echo ""
echo "Then follow the instructions in instructions.md"
