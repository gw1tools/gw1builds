# PRD-11: Urgent Bug Fixes

**Status:** In Progress
**Priority:** ASAP
**Created:** January 2026

## Overview

Fix bugs reported during Reddit launch. Quick wins that improve polish and user trust.

## Status Summary

| Bug | Status | Owner |
|-----|--------|-------|
| Adrenaline display | ✅ Fixed | Team |
| Character counter | 🔄 PR #11 | FauEr7 (contributor) |
| Nested lists | 🔄 PR #10 | FauEr7 (contributor) |
| Paragon autocomplete | ✅ Fixed | Team |

---

## Bug 1: Adrenaline Skills Show "0 Energy Cost"

**Problem:** Adrenaline-based skills (Warrior, Paragon) display "0 energy" instead of adrenaline strikes.

**Fix:** Check if skill has `adrenaline` cost field. If present, display "{X} adrenaline" instead of energy.

**Files to investigate:**
- Skill tooltip/display component
- `types/gw1.ts` — check skill type definition

---

## Bug 2: Character Counter Counts HTML

**Problem:** Users report 3k characters of text hitting 10k limit. Counter is counting HTML markup, not visible text.

**Fix:** Count text content only, not HTML. Use `element.textContent.length` or strip HTML tags before counting.

**Files to investigate:**
- TipTap editor configuration
- Notes input component

---

## Bug 3: Multi-Level Lists Don't Render

**Problem:** Nested lists in notes editor don't display correctly when published.

**Fix:** Ensure CSS supports nested `<ul>`/`<ol>` elements. TipTap may need list extension configured.

**Files to investigate:**
- Notes display component
- TipTap editor extensions
- CSS for list styling

---

## Bug 4: Paragon Skills Missing from Autocomplete

**Problem:** Some Paragon skills don't appear in `[[` skill mention autocomplete.

**Fix:** Verify all Paragon skills are in the skill database. May be a data issue or filter bug.

**Files to investigate:**
- Skill data source (JSON or API)
- Mention autocomplete component

---

## Acceptance Criteria

- [x] Adrenaline skills show "{X} adrenaline" (e.g., "4 adrenaline") — **Fixed**
- [ ] Character counter reflects visible text length — **PR #11**
- [ ] Nested lists render correctly in published notes — **PR #10**
- [x] All Paragon skills appear in autocomplete (increased limit to 12) — **Fixed**

---

## Implementation Notes

- Each bug is independent — can be fixed in any order
- Test with specific skills mentioned in feedback
- No database changes required
