#!/usr/bin/env bash
# Creates labels, issues and a GitHub Project board for this repository.
# Requirements: GitHub CLI (https://cli.github.com) logged in with:
#   gh auth login
#   gh auth refresh -s project
# Run from the repository folder:  bash scripts/github-setup.sh
set -euo pipefail

REPO=$(gh repo view --json nameWithOwner -q .nameWithOwner)
echo "Setting up $REPO"

# ---------- Labels ----------
label() { gh label create "$1" --color "$2" --description "$3" --force >/dev/null; }
label setup      "5319e7" "Repository and tooling"
label feature    "0e8a16" "Functional requirement / use case"
label vuln       "b60205" "Intentional vulnerability (insecure branch)"
label mitigation "1d76db" "Security fix (secure branch)"
label test       "fbca04" "Testing"
label docs       "c5def5" "Report / documentation"

# ---------- Project board ----------
PROJECT=$(gh project create --owner @me --title "CourseCritic - Secure Application Programming" --format json -q .number)
echo "Created project #$PROJECT"

# issue <title> <labels> <body> [close]
issue() {
  local url
  url=$(gh issue create --title "$1" --label "$2" --body "$3")
  gh project item-add "$PROJECT" --owner @me --url "$url" >/dev/null
  if [ "${4:-}" = "close" ]; then
    gh issue close "$url" --comment "Implemented in the baseline application on the main branch." >/dev/null
  fi
  echo "  $url  $1"
}

echo "Baseline (main):"
issue "Set up repository, .gitignore and README" "setup,docs" "Initial repository structure, .gitignore, .env.example and README configuration manual."
issue "Database schema and seed data" "feature" "SQLite schema (users, courses, reviews, audit_log) and seed script with demo accounts."
issue "UC-1 Register Account" "feature" "A visitor can create a student account."
issue "UC-2 Log In / Log Out" "feature" "Users can log in and log out; session stores id, username and role."
issue "UC-3 Search Courses" "feature" "Search courses by title, code or lecturer."
issue "UC-4 View Course Reviews" "feature" "Course page lists approved, anonymous reviews."
issue "UC-5 Submit Review" "feature" "Logged-in students submit a 1-5 rating and text; new reviews are pending."
issue "UC-6 Moderate Review" "feature" "Moderators approve or reject pending reviews; cannot moderate their own."
issue "UC-7 Manage Users" "feature" "Admins change roles and delete users; cannot change their own role."

echo "Insecure branch:"
issue "Introduce SQL injection in course search and login" "vuln" "Build SQL with string concatenation in search (UNION-based) and login (authentication bypass). OWASP A05:2025 Injection."
issue "Introduce reflected XSS in search results" "vuln" "Render the search term without output encoding."
issue "Introduce stored XSS in review body" "vuln" "Render review text unescaped on course and moderation pages."
issue "Introduce DOM-based XSS in review highlight" "vuln" "course.js writes the #highlight value into innerHTML."
issue "Introduce sensitive data exposure" "vuln" "Plaintext passwords, author email in /api reviews, stack traces shown to users, cookies without HttpOnly/Secure/SameSite."

echo "Secure branch:"
issue "Mitigate SQL injection with parameterised queries" "mitigation" "Parameterised queries and input validation. OWASP SQL Injection Prevention Cheat Sheet."
issue "Mitigate XSS (output encoding, textContent, CSP)" "mitigation" "Encode output, use textContent on the client, add Content-Security-Policy. OWASP XSS and DOM XSS cheat sheets."
issue "Mitigate sensitive data exposure" "mitigation" "bcrypt password hashing, DTOs without author data, generic error pages."
issue "Add CSRF protection" "mitigation" "Synchroniser token on every state-changing form. OWASP CSRF Prevention Cheat Sheet."
issue "Session management hardening" "mitigation" "Regenerate session id on login, idle timeout, HttpOnly/Secure/SameSite cookies."
issue "Add security headers with helmet" "mitigation" "CSP, X-Content-Type-Options, frame-ancestors, Referrer-Policy, HSTS."
issue "Login rate limiting and account lockout" "mitigation" "Lock account for 15 minutes after 5 failed attempts."
issue "Logging and monitoring" "mitigation" "Structured logs to file and audit_log table; alert on repeated failed logins. OWASP Logging Cheat Sheet."

echo "Testing:"
issue "Test plan from use-case descriptions" "test" "One or more test cases per use case with expected results."
issue "Playwright end-to-end tests" "test" "Automate the main use cases and the XSS/SQLi checks."
issue "OWASP ZAP scans of insecure and secure branches" "test" "Run ZAP against both branches and compare the alerts."
issue "Non-functional tests (Lighthouse, performance)" "test" "Lighthouse scores and response-time measurements for the SMART NFRs."

echo "Report:"
issue "SDLC methodology comparison" "docs" "Compare two SDLC models and justify the choice."
issue "Software Requirement Specification and diagrams" "docs" "Requirements, data classification, ERD, architecture, wireframes, use cases, class and sequence diagrams."
issue "Ethics question" "docs" "Discuss three Software Engineering Code of Ethics principles."
issue "Video presentation" "docs" "Short video demonstrating all requirements."

echo
echo "Done. Open the project in your browser and add a 'Board' view:"
echo "  gh project view $PROJECT --owner @me --web"
