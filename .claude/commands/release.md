# Release Notes Generator

Generate release notes and prepare a new version for release.

## Instructions

### 1. Analyze Changes

Get the latest git tag and all commits since then:

```bash
git describe --tags --abbrev=0 2>/dev/null || echo "no-tags"
git log $(git describe --tags --abbrev=0 2>/dev/null || git rev-list --max-parents=0 HEAD)..HEAD --oneline
```

### 2. Categorize Commits

- `feat:` → New features (triggers MINOR bump)
- `fix:` → Bug fixes (triggers PATCH bump)
- `BREAKING CHANGE:` → Breaking changes (triggers MAJOR bump)
- `chore:`, `docs:`, `refactor:` → Skip unless user-facing

### 3. Determine Version Bump

- Has `BREAKING CHANGE:` → MAJOR (1.0.0 → 2.0.0)
- Has `feat:` → MINOR (1.0.0 → 1.1.0)
- Only `fix:` → PATCH (1.0.0 → 1.0.1)
- Only internal changes → Ask if release is needed

### 4. Generate Release Notes

Write human-readable summaries for users (gamers, not developers):
- "feat: add build sharing" → "Share your builds with a unique URL"
- "fix: skill tooltip overflow" → "Fixed skill tooltips getting cut off"

Skip internal/technical changes entirely.

### 5. Update Files

1. **CHANGELOG.md**: Add new entry at top with human-readable date
2. **package.json**: Update `version` field

### 6. Create Git Tag & GitHub Release

```bash
git tag -a vX.Y.Z -m "Release vX.Y.Z"
gh release create vX.Y.Z --title "vX.Y.Z" --notes "[notes]"
```

## CHANGELOG.md Format

Keep it minimal - no version numbers, no GitHub links:

```markdown
## Month Day, Year

**Title** (optional, for major releases)

- Feature or fix description
- Another change
```

Example:
```markdown
## January 15, 2026

- Share your builds with a unique URL
- One-click copy of build template codes
- Fixed skill tooltips on small screens
```

## Important

- Ask for confirmation before making changes
- User-friendly language (for gamers)
- Skip merge commits and internal changes
