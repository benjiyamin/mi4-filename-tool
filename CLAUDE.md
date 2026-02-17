# CLAUDE.md

## Project Overview

MI-4 File Name Tool is a static, single-page web application for generating and validating file names against FDOT (Florida Department of Transportation) MI-4 Program naming conventions. It supports 9 naming conventions for infrastructure project deliverables including KMZ files, FDOT production deliverables (with and without phase), guide sign worksheets, design submittals, FPID documents (internal and external), permit documents, and program documents.

## Architecture

This is a zero-dependency, framework-free vanilla JavaScript application. The app lives in three files:

- **`index.html`** — HTML shell with embedded CSS styles. Loads Google Fonts (DM Sans, JetBrains Mono) and mounts the app into `<div id="app">`.
- **`mi4-data.js`** — All data constants (`CONVENTIONS`, `ABBREVIATIONS`, `PROJECTS`, `FPIDS`, `SUBMITTAL_PHASES`, `COMPONENTS`, `PERMITS`, `TITLE_SUGGESTIONS`, `TITLE_PSEE_MAP`, `FIELDS`, `RULES`) in readable multi-line format. Edit this file to update project data.
- **`mi4-tool.js`** — Application logic (utilities, state management, rendering, UI components).
- **`docs/`** — Supplementary documentation:
  - `user-guide.md` — End-user guide for the tool's UI features
  - `naming-conventions.md` — Standalone naming convention reference with all 9 conventions, appendices for projects, FPIDs, components, phases, permits, and abbreviations
  - `data-update-guide.md` — Step-by-step instructions for editing `mi4-data.js` (adding projects, FPIDs, abbreviations, permits, etc.)

There is no build step, no bundler, no transpilation, and no package.json. The app runs directly in the browser from static files. `index.html` loads `mi4-data.js` before `mi4-tool.js` via `<script>` tags — load order matters.

### Code Organization

**`mi4-data.js`** — Data constants, one entry per line for easy diffs:

| Section | Contents |
|---------|----------|
| CONVENTIONS | 9 naming convention schemas with format strings |
| ABBREVIATIONS | 67 word-to-abbreviation mappings |
| PROJECTS | 7 project names and abbreviation codes |
| FPIDS | 13 Financial Project ID records |
| SUBMITTAL PHASES | 15 phase prefix/suffix definitions |
| COMPONENTS | 14 plan discipline identifiers |
| PERMITS | 4 permit types with regex patterns |
| TITLE SUGGESTIONS | 91 autocomplete entries for document titles |
| TITLE PSEE MAP | 89 title-to-PSEE-folder mappings |
| FIELDS | 19 field definitions with types, validation, and lookup chains |
| RULES | 38 convention-field bindings with required/optional flags |

**`mi4-tool.js`** — Application logic, organized into clearly marked sections:

| Section | Purpose |
|---------|---------|
| UTILITIES | Pre-computed `Set` objects for O(1) lookups (`ALL_FPID_FULLS`, `ALL_PROJECT_ABBRS`, `ALL_COMPONENT_IDS`, etc.), `FIELD_MAP`, `RULES_BY_CONV`, regex patterns (`DATE_RE`, `EXTERNAL_FPID_RE`), `tokenizeFormat()`, `FIELD_VALIDATORS`, `FIELD_PLACEHOLDERS`, segment colors, segment explanations |
| HELPERS | `esc()`, `applyAbbreviations()`, `padId()`, `validatePermitId()`, `_matchField()`, `_flattenTokens()`, `_findNextAnchor()`, `parseFilename()`, `buildExpectedPattern()`, `detectConvention()`, `_resolveField()`, `generateFilename()` |
| STATE | Global `state` object and `setState()` function that triggers re-render |
| RENDER ENGINE | Hyperscript `h()` function for DOM creation, reusable UI primitives (`selectEl`, `inputEl`, `autocompleteEl`, `fieldTag`) |
| GENERATOR | `renderGenerator()` — RULES-driven file name generation form with live preview |
| VALIDATOR | `renderValidator()` — file name validation with segment analysis |
| ABBREVIATIONS VIEW | `renderAbbreviations()` — searchable abbreviation reference table |
| CONVENTIONS VIEW | `renderConventions()` — expandable convention reference cards |
| MAIN RENDER | `render()` — top-level router/layout, view switching, initialization |

### Key Patterns

- **Rendering**: Custom hyperscript `h(tag, attrs, ...children)` builds real DOM elements. Components are functions returning `DocumentFragment` or DOM nodes.
- **State management**: Single global `state` object. `setState(patch)` merges the patch via `Object.assign` and calls `render()` to re-render the entire UI.
- **Format strings**: Each convention has a `format` property (e.g., `"{projectId}_{fpid}_{title}[-{subtitle}]_{date}"`) that defines its filename syntax. `{fieldId}` references a field, `[...]` denotes optional groups, and bare text is a literal (including separators like `_`, `-`, `.`).
- **Generic parsing**: `tokenizeFormat()` converts format strings into token arrays. `parseFilename()` walks tokens left-to-right against the filename, matching each field via `FIELD_VALIDATORS` (set-based, regex-based, or greedy text). Optional groups are handled by bitmask enumeration — all combinations tried until one succeeds.
- **Generic generation**: `generateFilename()` walks format tokens and resolves each field via `_resolveField()`, which follows `FIELDS` lookup chains (e.g., `fpid` → `fullFpid` via FPIDS table). The `RULES_BY_CONV` index determines which form fields to render per convention.
- **Convention detection**: `detectConvention()` trial-parses the filename against each convention in a specificity order (`_DETECT_ORDER`), returning the first that fully parses.
- **Data lookups**: Pre-computed `Set` objects (`ALL_FPID_FULLS`, `ALL_PROJECT_ABBRS`, etc.) for O(1) membership checks. `FIELD_MAP` and `RULES_BY_CONV` index `FIELDS` and `RULES` for fast access.
- **Abbreviations**: `applyAbbreviations()` replaces full words with short forms (longest-first matching), strips special characters, and converts to PascalCase.
- **Determination filtering**: Each convention has a `phase` property (`"pre"` or `"post"`). The URL query parameter `?determination=pre` or `?determination=post` filters which conventions are available in the UI. When set, only conventions matching that phase are shown in dropdowns and auto-detection. A label badge (e.g., "Pre-Determination") appears in the header. With no parameter, all conventions are shown.

## Deployment

The app is hosted on GitHub Pages, served directly from the `main` branch root. Since there is no build step, GitHub Pages serves `index.html`, `mi4-data.js`, and `mi4-tool.js` as-is. Push to `main` to deploy.

## How to Run Locally

Serve the static files with any HTTP server:

```sh
python3 -m http.server 8000
# or
npx http-server .
```

Then open `http://localhost:8000` in a browser. Opening `index.html` directly via `file://` also works.

## Testing

There is no automated test suite. Verify changes manually:

1. **Generator tab**: Select each of the 9 conventions and fill in all fields. Confirm the generated filename matches the expected pattern shown in the info card.
2. **Validator tab**: Paste example filenames (available in `CONVENTIONS[].exampleName`) and confirm they validate as correct. Test invalid filenames and confirm errors are reported per-segment.
3. **Abbreviations tab**: Search for terms and verify the table filters correctly.
4. **Conventions tab**: Expand each convention and verify field lists, patterns, and examples are accurate.

## Code Conventions

- **Naming**: camelCase for variables/functions, UPPER_SNAKE_CASE for constants and `Set` objects.
- **Style**: Code is written in compact/minified style — single-line functions, minimal whitespace. Maintain this style when editing.
- **Section headers**: Use `// ═══════ SECTION NAME ═══════` decorative comment dividers between major sections.
- **No external dependencies**: Do not add npm packages, build tools, or frameworks. The app must remain a self-contained set of static files.
- **Data in `mi4-data.js`**: All data constants live in `mi4-data.js`, not in `mi4-tool.js`. Use readable multi-line formatting (one entry per line) for easy diffs.
- **CSS**: All styles are in the `<style>` block inside `index.html`. Component-level styles use inline `style` objects passed to `h()`.
- **DOM creation**: Always use the `h()` function to create elements. Never use `innerHTML` for dynamic content (XSS risk). The `esc()` function exists for HTML entity escaping.

## Data Model

The 9 naming conventions are defined in `CONVENTIONS[]` (in `mi4-data.js`). Each convention object has:

| Property | Purpose |
|----------|---------|
| `id` | Unique identifier (e.g., `"kmz"`, `"fdot-prod"`, `"design"`) |
| `desc` | Human-readable name |
| `exampleDoc` | Example document name placeholder |
| `ext` | File extension (`"pdf"`, `"kmz"`) |
| `format` | Format string defining filename syntax (e.g., `"{projectId}_{fpid}_{title}[-{subtitle}]_{date}"`) |
| `info` | Description text shown in the UI |
| `exampleName` | Example filename for reference |
| `phase` | Determination phase (`"pre"` or `"post"`) — used for `?determination=` query param filtering |

### Format String Syntax

- `{fieldId}` — references a field from the `FIELDS` table
- `[...]` — optional group (parser tries with and without)
- Bare text — literal characters (separators like `_`, `-`, `.` and fixed text like `MI4`, `Permit`, `GuideSignWorksheets`)

### FIELDS and RULES

`FIELDS[]` defines all available field types with their validation and lookup chains:

| `type` | Behavior |
|--------|----------|
| `text` | Free-form text input (title, subtitle, permitId) |
| `number` | Numeric input with regex validation and zero-pad format |
| `select` | Dropdown validated against a data table |
| `date` | Date picker |
| `lookup` | Derived value — follows a chain: reads the value of `via` field, looks it up in `source` table by `sourceKey`, and returns the `returns` column |

`RULES[]` binds fields to conventions with `required: true/false` flags. The `RULES_BY_CONV` index (built at startup) groups rules by convention ID for fast access. Rules determine which form fields appear in the Generator UI and whether they are required or optional.
