# MI-4 File Name Tool

A static web application for generating and validating file names against FDOT (Florida Department of Transportation) MI-4 Program naming conventions.

**Live demo:** [benjiyamin.github.io/mi4-filename-tool](https://benjiyamin.github.io/mi4-filename-tool/)

## Features

- **Generator** — Build compliant filenames step-by-step by selecting a convention and filling in fields. Live preview updates as you type.
- **Validator** — Paste any filename to check if it conforms to MI-4 conventions. Auto-detects the convention and shows a color-coded segment analysis.
- **Abbreviation reference** — Searchable table of 67 standard word-to-abbreviation mappings used in document titles.
- **Convention reference** — Expandable cards for all 9 naming conventions with field lists, patterns, and examples.
- **Autocomplete** — Title field suggests from 91 common document types with automatic abbreviation and PascalCase formatting.
- **Determination filtering** — Append `?determination=pre` or `?determination=post` to the URL to show only conventions for that phase.
- **Zero dependencies** — Pure vanilla JavaScript with no frameworks, build steps, or npm packages.

## Naming Conventions

| Convention | Ext | Example |
|---|---|---|
| KMZ | `.kmz` | `P3_201210-9_ProjectLimits_2025-01-15.kmz` |
| FDOT Production Deliverables | `.pdf` | `20121095201-PLANS-01-ROADWAY.pdf` |
| FDOT Production Deliverables (Phased) | `.pdf` | `20121095201-PLANS-01-ROADWAY-90pct.pdf` |
| Guide Sign Worksheets | `.pdf` | `20121095201-GuideSignWorksheets.pdf` |
| Design Submittal | `.pdf` | `P3-PS-0001.00_PvmtDsgnRpt.pdf` |
| FPID Document | `.pdf` | `201210-9_TypSectionPkg.pdf` |
| Permit Document | `.pdf` | `50-12345-P_Permit-SFWMD-ERP.pdf` |
| FPID Document (External) | `.pdf` | `201210-3_NEPADocs.pdf` |
| Program Document | `.pdf` | `MI4_InterimDrngTypSection.pdf` |

See [docs/naming-conventions.md](docs/naming-conventions.md) for full details on each convention's format, required fields, and appendices.

## Getting Started

Serve the static files with any HTTP server:

```sh
python3 -m http.server 8000
# or
npx http-server .
```

Open `http://localhost:8000` in a browser. Opening `index.html` directly via `file://` also works.

## Project Structure

```
index.html        HTML shell with embedded CSS
mi4-data.js       All data constants (conventions, projects, FPIDs, abbreviations, etc.)
mi4-tool.js       Application logic (parsing, generation, rendering, state management)
docs/
  user-guide.md           End-user guide for the tool's UI
  naming-conventions.md   Standalone naming convention reference
  data-update-guide.md    How to edit mi4-data.js
```

`index.html` loads `mi4-data.js` before `mi4-tool.js` via `<script>` tags — load order matters.

## Documentation

| Guide | Description |
|---|---|
| [User Guide](docs/user-guide.md) | How to use the Generator, Validator, Abbreviations, and Conventions views |
| [Naming Conventions](docs/naming-conventions.md) | Complete reference for all 9 conventions with format patterns and appendices |
| [Data Update Guide](docs/data-update-guide.md) | Step-by-step instructions for editing projects, FPIDs, abbreviations, permits, and other data |

## Architecture

The app is a zero-dependency, framework-free vanilla JavaScript SPA. All data (conventions, projects, FPIDs, abbreviations, field definitions, rules) lives in `mi4-data.js`. All logic lives in `mi4-tool.js`.

Key design decisions:

- **Format-string driven** — Each convention defines a `format` string (e.g., `"{projectId}_{fpid}_{title}[-{subtitle}]_{date}"`) that drives both filename generation and parsing. Adding a new convention requires only data changes.
- **Generic parsing** — `tokenizeFormat()` and `parseFilename()` handle any convention by walking format tokens against the input. Optional groups are resolved via bitmask enumeration.
- **Custom hyperscript** — A lightweight `h(tag, attrs, ...children)` function builds real DOM elements. No virtual DOM, no templates, no innerHTML.
- **Single-object state** — One global `state` object with `setState(patch)` that triggers a full re-render.

## Contributing

To update project data (projects, FPIDs, abbreviations, permits, title suggestions, etc.), edit `mi4-data.js` and refresh the browser. See [docs/data-update-guide.md](docs/data-update-guide.md) for detailed instructions.

## Deployment

Hosted on GitHub Pages, served directly from the `main` branch root. Push to `main` to deploy — no build step required.
