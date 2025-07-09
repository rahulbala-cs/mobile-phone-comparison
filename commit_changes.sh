#!/bin/bash

# Navigate to the project directory
cd "/Users/rahul.balakrishnan/Documents/claude code/mobile-phone-comparison"

# Check git status
echo "=== Git Status ==="
git status

# Check differences
echo "=== Git Diff ==="
git diff

# Add changes
echo "=== Adding Changes ==="
git add src/components/MobilePhoneList.css src/components/MobilePhoneList.tsx

# Commit with message
echo "=== Committing Changes ==="
git commit -m "$(cat <<'EOF'
Fix mobile phone list layout truncation issue

- Remove overflow: hidden constraint causing card truncation  
- Add proper grid auto-rows for natural content expansion
- Update container heights to use fit-content instead of fixed dimensions
- Enhance pagination styling with visual indicators
- Ensure all 9 mobile cards display properly in 3x3 grid
- Fix responsive breakpoints to prevent card cropping

🤖 Generated with [Claude Code](https://claude.ai/code)

Co-Authored-By: Claude <noreply@anthropic.com>
EOF
)"

# Push to remote
echo "=== Pushing to Remote ==="
git push

echo "=== Done ==="