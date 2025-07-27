# Fix Match Dates Script

## Quick Fix Instructions

1. Open a terminal and navigate to the project:
```bash
cd /Users/remibeltram/Pittura/league-lens
```

2. Set the Supabase service key:
```bash
export SUPABASE_SERVICE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNlcHRlcnJrZG5vanNtdG1tc2thIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0ODM0MDY4MCwiZXhwIjoyMDYzOTE2NjgwfQ.0jHWphqfH1vYUpZoXCBLI_IFpoupFUlQo5jb9XqWaKw
```

3. First, run the debug script to see the issue:
```bash
node scripts/debug-match-date-issue.js
```

4. Then run the fix script:
```bash
node scripts/fix-match-years.js
```

This will:
- Fix all matches with 2025 dates by changing them to 2024
- Update match statuses for past matches that show as "Not Started"
- Fix any matches that have scores but wrong status

## What This Fixes

- Past matches showing as "upcoming" because they have future dates (2025)
- Match status not reflecting that games have finished
- Ensures proper date ordering in the match feed

After running this script, restart your development server to see the changes:
```bash
npm run dev:all
```