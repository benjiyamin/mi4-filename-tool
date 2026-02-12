# CLAUDE.md

## Project Overview

MI-4 File Name Tool is a static, single-page web application for generating and validating file names against FDOT (Florida Department of Transportation) MI-4 Program naming conventions. It supports 7 naming conventions for infrastructure project deliverables including KMZ files, FDOT production deliverables, guide sign worksheets, design submittals, FPID documents, and permit documents.

## Architecture

This is a zero-dependency, framework-free vanilla JavaScript application. The entire app lives in two files:

- **`index.html`** — HTML shell with embedded CSS styles. Loads Google Fonts (DM Sans, JetBrains Mono) and mounts the app into `<div id="app">`.
- **`mi4-tool.js`** — All application logic (data, utilities, state management, rendering, UI components) in a single 525-line file.

There is no build step, no bundler, no transpilation, and no package.json. The app runs directly in the browser from static files.

### Code Organization (mi4-tool.js)

The file is organized into clearly marked sections:

| Section | Lines | Purpose |
|---------|-------|---------|
| DATA | 1–17 | Constants: `CONVENTIONS`, `ABBREVIATIONS`, `PROJECTS`, `FPIDS`, `SUBMITTAL_PHASES`, `COMPONENTS`, `PERMITS`, `TITLE_SUGGESTIONS` |
| UTILITIES | 19–29 | Pre-computed `Set` objects for O(1) lookups, regex patterns (`DESIGN_ID_RE`, `DATE_RE`), segment colors, segment explanations |
| HELPERS | 31–89 | `esc()`, `applyAbbreviations()`, `padId()`, `validatePermitId()`, `detectConvention()`, `parseFilename()`, `buildExpectedPattern()` |
| STATE | 91–94 | Global `state` object and `setState()` function that triggers re-render |
| RENDER ENGINE | 97–129 | Hyperscript `h()` function for DOM creation, reusable UI primitives (`selectEl`, `inputEl`, `fieldTag`) |
| GENERATOR | 132–318 | `renderGenerator()` — file name generation form with live preview |
| VALIDATOR | 321–412 | `renderValidator()` — file name validation with segment analysis |
| ABBREVIATIONS | 415–442 | `renderAbbreviations()` — searchable abbreviation reference table |
| CONVENTIONS | 445–493 | `renderConventions()` — expandable convention reference cards |
| MAIN RENDER | 496–525 | `render()` — top-level router/layout, view switching, initialization |

### Key Patterns

- **Rendering**: Custom hyperscript `h(tag, attrs, ...children)` builds real DOM elements. Components are functions returning `DocumentFragment` or DOM nodes.
- **State management**: Single global `state` object. `setState(patch)` merges the patch via `Object.assign` and calls `render()` to re-render the entire UI.
- **Data lookups**: Pre-computed `Set` objects (`ALL_FPID_FULLS`, `ALL_PROJECT_ABBRS`, etc.) for fast membership checks during validation.
- **Validation**: `parseFilename()` splits file names into segments and validates each against convention rules. `detectConvention()` auto-detects the convention from a filename.
- **Abbreviations**: `applyAbbreviations()` replaces full words with short forms (longest-first matching), strips special characters, and converts to PascalCase.
- **Separators**: Underscore `_` is the default segment separator; hyphen `-` is used for component-based conventions (FDOT production deliverables).

## Deployment

The app is hosted on GitHub Pages, served directly from the `main` branch root. Since there is no build step, GitHub Pages serves `index.html` and `mi4-tool.js` as-is. Push to `main` to deploy.

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

1. **Generator tab**: Select each of the 7 conventions and fill in all fields. Confirm the generated filename matches the expected pattern shown in the info card.
2. **Validator tab**: Paste example filenames (available in `CONVENTIONS[].exampleName`) and confirm they validate as correct. Test invalid filenames and confirm errors are reported per-segment.
3. **Abbreviations tab**: Search for terms and verify the table filters correctly.
4. **Conventions tab**: Expand each convention and verify field lists, patterns, and examples are accurate.

## Code Conventions

- **Naming**: camelCase for variables/functions, UPPER_SNAKE_CASE for constants and `Set` objects.
- **Style**: Code is written in compact/minified style — single-line functions, minimal whitespace. Maintain this style when editing.
- **Section headers**: Use `// ═══════ SECTION NAME ═══════` decorative comment dividers between major sections.
- **No external dependencies**: Do not add npm packages, build tools, or frameworks. The app must remain a self-contained pair of static files.
- **CSS**: All styles are in the `<style>` block inside `index.html`. Component-level styles use inline `style` objects passed to `h()`.
- **DOM creation**: Always use the `h()` function to create elements. Never use `innerHTML` for dynamic content (XSS risk). The `esc()` function exists for HTML entity escaping.

## Data Model

The 7 naming conventions are defined in `CONVENTIONS[]`. Each convention object has boolean flags indicating which segments it requires:

| Flag | Segment |
|------|---------|
| `title` | Document name (PascalCase, abbreviated) |
| `designId` | Design ID (e.g., `P3-PS-0001.00`) |
| `fpidFull` | 11-digit Financial Project ID |
| `fpidShort` | Short FPID format (`######-#`) |
| `projectId` | Project abbreviation (`P1`–`P5`, `PA`, `PB`) |
| `componentId` | Deliverable discipline ID (e.g., `PLANS-01-ROADWAY`) |
| `submittalSuffix` | Phase suffix (`15pct`, `90pct`, `Final`, `RFC`) |
| `formattedDate` | Date in `YYYY-MM-DD` format |
| `customId` | Permit number (format varies by agency) |
