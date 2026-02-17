# MI-4 File Name Tool — Data Update Guide

This guide explains how to update the data that drives the MI-4 File Name Tool: projects, FPIDs, abbreviations, naming conventions, submittal phases, deliverable components, permits, and title suggestions.

All data lives in a single file: **`mi4-data.js`**. No build step is required — edit the file, save, and refresh the browser.

## Before You Start

- Use a text editor with JavaScript syntax highlighting (VS Code, Sublime Text, Notepad++, etc.). This helps you spot syntax errors.
- Keep a backup copy of `mi4-data.js` before making changes.
- Each data section is marked with a comment divider like `// ═══════ SECTION NAME ═══════`.
- After saving changes, refresh the browser and test with the Generator and Validator tabs.

---

## File Structure Overview

`mi4-data.js` contains these data sections in order:

| Section | Variable | What It Contains |
|---------|----------|-----------------|
| Conventions | `CONVENTIONS` | The 9 naming convention definitions |
| Abbreviations | `ABBREVIATIONS` | Word-to-abbreviation mappings for titles |
| Projects | `PROJECTS` | MI-4 project names and abbreviation codes |
| FPIDs | `FPIDS` | Financial Project IDs with descriptions |
| Submittal Phases | `SUBMITTAL_PHASES` | Design phase prefixes and suffixes |
| Components | `COMPONENTS` | Deliverable discipline identifiers |
| Permits | `PERMITS` | Permit types with format validation rules |
| Title Suggestions | `TITLE_SUGGESTIONS` | Autocomplete entries for document titles |
| Title PSEE Map | `TITLE_PSEE_MAP` | Maps title suggestions to PSEE folder names |
| Fields | `FIELDS` | Field definitions (advanced — rarely edited) |
| Rules | `RULES` | Convention-to-field mappings (advanced — rarely edited) |

---

## Adding or Editing Projects

The `PROJECTS` array defines the project dropdown options. Each entry has a `name` and an `abbr` (abbreviation used in filenames).

```js
const PROJECTS = [
  { name: "Project 1", abbr: "P1" },
  { name: "Project 2", abbr: "P2" },
  // ...
];
```

**To add a project**, insert a new object before the closing `];`:

```js
  { name: "Project 6", abbr: "P6" },
```

**To edit a project**, change the `name` or `abbr` value. The `abbr` value appears in generated filenames, so changing it affects all future filenames using that project.

> **Important:** The `abbr` value is used in filename validation. If you change it, existing filenames using the old abbreviation will fail validation.

---

## Adding or Editing FPIDs

The `FPIDS` array defines available Financial Project IDs. Each entry has:

| Field | Description | Example |
|-------|-------------|---------|
| `fpid` | Short FPID format (`######-#`) | `"201210-9"` |
| `full` | 11-digit full FPID | `"20121095201"` |
| `desc` | Project description text | `"I-4 (S.R. 400) from west of U.S. 27..."` |
| `project` | Project name (must match a `PROJECTS[].name`) | `"Project 3"` |

```js
const FPIDS = [
  { fpid: "201210-8", desc: "I-4 (S.R. 400) from east of U.S. 27...", full: "20121085201", project: "Accel Start Seg A" },
  // ...
];
```

**To add an FPID**, insert a new object:

```js
  { fpid: "999999-1", desc: "New corridor description", full: "99999915201", project: "Project 1" },
```

**Requirements:**
- The `fpid` value must be in `######-#` format (6 digits, hyphen, 1 digit).
- The `full` value must be exactly 11 digits.
- The `project` value must exactly match an existing project name in `PROJECTS`.

---

## Adding or Editing Abbreviations

The `ABBREVIATIONS` object maps full words to their short forms. These are applied automatically when users type document titles.

```js
const ABBREVIATIONS = {
  "Alignment": "Algn",
  "Design": "Dsgn",
  "Pavement": "Pvmt",
  // ...
};
```

**To add an abbreviation**, insert a new key-value pair in alphabetical order:

```js
  "Foundation": "Fndn",
```

**To edit an abbreviation**, change the value:

```js
  "Pavement": "Pav",  // changed from "Pvmt"
```

**How abbreviation matching works:**
- The tool matches the longest phrases first. So "Design Analysis Report" → `DAR` is matched before "Design" → `Dsgn`.
- Matching is case-insensitive during lookup but the output preserves PascalCase.
- Multi-word abbreviations (e.g., "Existing Roadway Characteristics Assessment Report" → `ERCAR`) are supported.

> **Tip:** Keep entries in alphabetical order for readability. The tool sorts by length internally, so order in the file doesn't affect matching behavior.

---

## Adding or Editing Submittal Phases

The `SUBMITTAL_PHASES` array defines design phases for the Design Submittal and FDOT Production Deliverables (Phased) conventions.

Each entry has:

| Field | Description | Example |
|-------|-------------|---------|
| `desc` | Display name shown in the dropdown | `"Design - Phase Submittal (90%)"` |
| `prefix` | Used in Design Submittal filenames (after the submittal ID) | `"PS"` |
| `defaultPhase` | Used in phased deliverable filenames (after the component) | `"90pct"` |
| `modifiers` | Optional array of alternate phase milestones available for this phase | `["30pct", "60pct"]` |

```js
const SUBMITTAL_PHASES = [
  { desc: "Prelim Engineering - Line and Grade", prefix: "", defaultPhase: "15pct" },
  { desc: "Design - Phase Submittal (90%)", prefix: "PS", defaultPhase: "90pct", modifiers: ["30pct", "60pct"] },
  { desc: "Design - Final Submittal (100%)", prefix: "FS", defaultPhase: "Final", modifiers: ["RFC"] },
  // ...
];
```

**To add a phase**, insert a new object:

```js
  { desc: "Design - Supplemental (75%)", prefix: "PS", defaultPhase: "75pct" },
```

**Notes:**
- The `prefix` is used in Design Submittal convention filenames (e.g., `P3-0001.00-PS_Title.pdf`).
- The `defaultPhase` is used in FDOT Production Deliverables (Phased) filenames (e.g., `20121095201-PLANS-01-ROADWAY-90pct.pdf`).
- Phases with `prefix: ""` (empty string) are Preliminary Engineering phases and won't generate a prefix in Design Submittal filenames.
- Phases with `defaultPhase: "-"` have no phase suffix and are not available for phased deliverables.
- The optional `modifiers` array lists alternate milestone values selectable via the Phase Modifier field in the Design Submittal generator. For example, a `PS` submittal can carry a `60pct` modifier, and an `FS` submittal can carry an `RFC` modifier.

---

## Adding or Editing Components (Deliverables)

The `COMPONENTS` array defines deliverable discipline types used in FDOT Production Deliverable filenames.

```js
const COMPONENTS = [
  { name: "Roadway Plans", id: "PLANS-01-ROADWAY" },
  { name: "Signing and Pavement Marking Plans", id: "PLANS-02-SIGNINGMARKING" },
  // ...
];
```

**To add a component**, insert a new object:

```js
  { name: "New Discipline Plans", id: "PLANS-11-NEWDISCIPLINE" },
```

**Notes:**
- The `name` is the display text in the dropdown.
- The `id` is the value used in the generated filename (e.g., `20121095201-PLANS-11-NEWDISCIPLINE.pdf`).
- Follow the existing `PLANS-##-NAME` pattern for new plan types.

---

## Adding or Editing Permits

The `PERMITS` array defines permit types with their format validation rules.

Each entry has:

| Field | Description | Example |
|-------|-------------|---------|
| `name` | Display name in the dropdown | `"Permit (SFWMD ERP)"` |
| `regex` | Regular expression to validate the permit ID | `"\\d{2}-\\d{5}-[a-zA-Z]"` |
| `code` | Code used in the filename after `Permit-` | `"SFWMD-ERP"` |
| `prefix` | Full prefix string (usually `Permit-` + code) | `"Permit-SFWMD-ERP"` |
| `hint` | Format hint shown to the user | `"##-#####-A"` |
| `example` | Example valid permit ID | `"50-12345-P"` |
| `mask` | Human-readable format description | `"2 digits, dash, 5 digits, dash, 1 letter"` |

```js
const PERMITS = [
  { name: "Permit (SFWMD ERP)", regex: "\\d{2}-\\d{5}-[a-zA-Z]", code: "SFWMD-ERP",
    prefix: "Permit-SFWMD-ERP", hint: "##-#####-A", example: "50-12345-P",
    mask: "2 digits, dash, 5 digits, dash, 1 letter" },
  // ...
];
```

**To add a permit type**, insert a new object with all fields:

```js
  { name: "Permit (DEP NPDES)", regex: "^FLR\\d{6}$", code: "DEP-NPDES",
    prefix: "Permit-DEP-NPDES", hint: "FLR######", example: "FLR040123",
    mask: "FLR followed by 6 digits" },
```

**Notes:**
- The `regex` must be a valid JavaScript regular expression written as a string (double-escape backslashes: `\\d` not `\d`).
- The `code` and `prefix` must be consistent: `prefix` should be `"Permit-"` followed by `code`.
- Test the regex by entering the `example` value in the Validator tab after adding the permit.

---

## Adding or Editing Title Suggestions

The `TITLE_SUGGESTIONS` array provides autocomplete entries for the Title field.

```js
const TITLE_SUGGESTIONS = [
  "ICE Report",
  "Design Variation Package",
  "Pavement Design Report",
  // ...
];
```

**To add a title suggestion**, insert a new string:

```js
  "New Document Type Report",
```

### PSEE Folder Mapping

The `TITLE_PSEE_MAP` object maps each title suggestion to its PSEE folder. If you add a title to `TITLE_SUGGESTIONS`, also add a corresponding entry here:

```js
const TITLE_PSEE_MAP = {
  "ICE Report": "Approvals",
  "Pavement Design Report": "Roadway",
  // ...
  "New Document Type Report": "Roadway",  // add this
};
```

Existing PSEE folder categories: `Approvals`, `Roadway`, `Drainage`, `S&PM`, `Signals`, `ITS`, `Lighting`, `Landscape`, `Structures`, `Tolls`, `Architectural`, `Geotech`.

---

## Editing Conventions (Advanced)

The `CONVENTIONS` array defines the 9 naming conventions. Each entry has:

| Field | Description |
|-------|-------------|
| `id` | Unique identifier (used internally) |
| `desc` | Display name |
| `exampleDoc` | Placeholder shown in the format pattern |
| `ext` | File extension (`"kmz"` or `"pdf"`) |
| `format` | Format template with `{field}` tokens and optional `[-{field}]` groups |
| `info` | Description text shown in the convention info card |
| `exampleName` | Example valid filename |

**Format template syntax:**
- `{fieldId}` — required field, replaced with the field value.
- `[-{fieldId}]` — optional field group; omitted entirely if the field is empty.
- Literal characters (underscores, hyphens, dots) are kept as-is.

> **Warning:** Changing a convention's `format` affects both filename generation and validation. Test thoroughly after any changes.

---

## Editing Fields and Rules (Advanced)

The `FIELDS` and `RULES` arrays control which fields appear for each convention and how they are validated. These are interconnected and should only be edited if you understand the application logic in `mi4-tool.js`.

- `FIELDS` defines each form field's type, validation rules, and lookup sources.
- `RULES` maps fields to conventions and marks them as required or optional.

To add a field to a convention, you need entries in both `FIELDS` (if the field doesn't already exist) and `RULES`.

---

## Common Syntax Pitfalls

| Mistake | Problem | Fix |
|---------|---------|-----|
| Missing comma after an entry | JavaScript syntax error, page won't load | Add a trailing comma after every `}` or string in an array |
| Mismatched quotes | Syntax error | Use consistent double quotes for strings |
| Missing closing `]` or `}` | Syntax error | Count your brackets |
| Wrong `project` name in FPID | FPID won't appear in project-filtered dropdowns | Must exactly match a `PROJECTS[].name` value |
| Single backslash in regex | Regex won't match correctly | Use `\\d` not `\d` in regex strings |

## Testing Your Changes

After saving `mi4-data.js`:

1. **Refresh the browser** (hard refresh with Ctrl+Shift+R / Cmd+Shift+R to clear cache).
2. **Open the browser console** (F12 → Console tab) and check for JavaScript errors.
3. **Generator tab** — select each convention that uses your changed data. Verify dropdowns show the new/edited values and filenames generate correctly.
4. **Validator tab** — paste example filenames using your new data. Confirm they validate correctly.
5. **Conventions tab** — verify your convention changes appear correctly in the reference cards.
6. **Abbreviations tab** — if you added abbreviations, search for them in the table.

---

## Deployment

The tool is hosted on GitHub Pages and served directly from the `main` branch. After verifying your changes locally:

1. Commit your changes to `mi4-data.js`.
2. Push to the `main` branch.
3. GitHub Pages will serve the updated file automatically — no build step required.
