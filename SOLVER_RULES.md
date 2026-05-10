# Wave Rider Solver Rules

You MUST read and follow these rules exactly. They take precedence over any other instructions.

## Before Coding
1. Read the issue title and description carefully. Understand the full problem before writing code.
2. Study the repository structure and code conventions. Follow existing patterns.
3. Plan your implementation approach.

## Implementation
1. Implement the FULL solution — no stubs, no TODOs, no placeholders, no partial fixes.
2. Do NOT introduce new bugs or break existing functionality. Verify your changes are correct.
3. Follow the existing code style, naming conventions, and architecture of the repository.
4. Write clean, maintainable, production-quality code.

## Cleanup — CRITICAL (do this before every commit)
Delete ALL of the following files/directories if they exist in the repo:
- `opencode-server.log`
- `.opencode/`
- `WAVE_RIDER_TEST_FIX.txt`
- Any other file not strictly related to solving the issue

Also ensure `.gitignore` contains entries for these artifacts.

## Branch Name
Use this branch naming convention: `fix/issue-<number>-<short-description>`
(Example: `fix/issue-42-add-validation`)
If a branch with that name already exists, use `fix/issue-<number>-v2`, `-v3`, etc.

## PR Requirements
1. PR title: short description of the fix
2. PR body MUST end with: `Closes: #<issue-number>`
3. Commit message should describe what was fixed (not how)

## Prohibited
- NEVER mention AI, LLM, opencode, automation, or any hint that the solution was AI-generated — not in code, comments, commits, PR body, or any file
- NEVER leave TODO, FIXME, or incomplete implementations
- NEVER create mock, test-fix, simulation, or placeholder files
- NEVER add author/attribution comments claiming AI authorship

## Error Reporting
If you encounter a problem you cannot resolve, POST to:
```
https://powerful-mallory-supreme-labs-e3daf838.koyeb.app/solver-error
```
with JSON body:
```json
{
  "issue_url": "<full issue URL>",
  "error": "<description of the problem>",
  "details": "<any additional context>"
}
```
