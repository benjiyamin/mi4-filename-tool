# MI-4 File Name Tool — User Guide

The MI-4 File Name Tool generates and validates file names for FDOT MI-4 Program deliverables. This guide covers every feature of the tool.

## Quick Start

### Generate a File Name

1. Open the tool in your browser.
2. Click the **Generator** tab (selected by default).
3. Choose a **naming convention** from the dropdown (e.g., "Design Submittal").
4. Fill in the required fields — green ✓ tags appear as you complete each one.
5. The generated filename appears in the preview bar at the bottom.
6. Click **Copy** to copy it to your clipboard.

![Generator quick start](images/generator-quickstart.png)

### Validate a File Name

1. Click the **Validator** tab.
2. Paste a filename into the text field.
3. The tool auto-detects the convention and displays a pass/fail result.
4. Click any segment in the parsed structure bar to see details.

![Validator quick start](images/validator-quickstart.png)

---

## Generator Tab

The Generator builds a filename step-by-step based on the convention you select. Each convention shows different fields.

### Selecting a Convention

Use the **Convention** dropdown to pick one of the 9 supported naming conventions. An info card appears below the dropdown describing the convention and showing an example filename.

![Convention selector](images/generator-convention-selector.png)

### Filling In Fields

Fields are displayed dynamically based on the selected convention. Each field has a colored tag showing its status:

| Tag | Meaning |
|-----|---------|
| ✓ Done (green) | Field is complete and valid |
| Pending (blue) | Required field not yet filled |
| Optional (amber) | Optional field — can be left blank |

A progress counter (e.g., "3/5 fields complete") tracks your progress.

#### Dropdown Fields

Dropdowns are used for **Project**, **FPID**, **Deliverable**, **Submittal Phase**, and **Permit Type**. Select an option from the list. Some dropdowns filter based on previous selections (e.g., FPID options depend on the selected project for KMZ convention).

![Dropdown field](images/generator-dropdown.png)

#### Title and Subtitle

The **Title** field has an autocomplete dropdown with ~89 common document types. Start typing to filter suggestions, then click or press Enter to select one.

- Titles are automatically abbreviated using MI-4 abbreviation rules (e.g., "Pavement Design Report" → `PvmtDsgnRpt`).
- Special characters are stripped and the result is converted to PascalCase.
- The **Subtitle** field is always optional and follows the same abbreviation rules.

![Title autocomplete](images/generator-title-autocomplete.png)

#### Numeric Fields

**Submittal ID**, **Resubmittal ID**, **Revision ID**, and **External FPID** accept numbers only. A hint next to the field shows the formatted result (e.g., entering `1` shows `→ 0001` for Submittal ID).

#### Date Field

The **Date** field (used by the KMZ convention) accepts a date in `YYYY-MM-DD` format. Click the **Today** button to auto-fill the current date.

#### Resubmittal Checkbox

For Design Submittals, the **Resubmittal ID** is hidden by default. Check the "Include Resubmittal" checkbox to reveal it. When unchecked, the resubmittal defaults to `00`.

### Filename Preview

As you fill in fields, the generated filename appears in a preview bar at the bottom of the form. The bar turns **green** when all required fields are complete.

![Filename preview](images/generator-preview.png)

### Copying the Filename

Click the **Copy** button (or click the filename itself) to copy it to your clipboard. The button briefly shows "✓ Copied" to confirm.

### Resetting the Form

Click **Reset** to clear all fields and start over. This clears all field values but keeps the selected convention.

---

## Validator Tab

The Validator checks whether a filename conforms to MI-4 naming conventions.

### Entering a Filename

Paste or type a full filename (including the extension) into the text field. The tool processes it immediately.

![Validator input](images/validator-input.png)

### Auto-Detection

The tool automatically identifies which naming convention the filename matches. An "Auto-detected" badge appears next to the convention name. You can override this by selecting a different convention from the dropdown.

### Validation Results

#### Status Banner

A banner at the top of the results shows:

- **✓ Valid File Name** (green) — all segments match the convention rules.
- **✗ Invalid File Name** (red) — one or more segments are incorrect.
- The number of passing segments (e.g., "4/5 segments valid").
- The detected or selected convention name.

![Validation status](images/validator-status.png)

#### Parsed Structure Bar

The filename is split into colored segments. Each segment represents a field in the naming convention (FPID, title, date, etc.). Invalid segments are shown with a red wavy underline.

Click any segment to expand its details.

![Parsed structure](images/validator-parsed-structure.png)

#### Segment Analysis Cards

Each segment gets a card showing:

| Field | Description |
|-------|-------------|
| Status | ✓ (valid) or ✗ (invalid) |
| Label | The field name (e.g., "FPID (Short)", "Formatted Date") |
| Value | The actual value parsed from your filename |
| Expected | The format or pattern the segment should match |

Click a card to see a detailed explanation of what the segment represents and its formatting rules.

![Segment analysis](images/validator-segment-analysis.png)

#### Comparison View (Invalid Filenames)

When a filename is invalid, a side-by-side comparison shows:

- **Entered**: Your filename as typed.
- **Expected Pattern**: What the correct format should look like.

A **Copy Pattern** button lets you copy the expected format to your clipboard.

![Comparison view](images/validator-comparison.png)

---

## Abbreviations Tab

Click **View Abbreviations** in the header to open the abbreviation reference table. This shows all ~55 word-to-abbreviation mappings used by the title auto-abbreviation system.

### Searching

Type in the search box to filter by full word or abbreviation. For example, searching "pvmt" shows the "Pavement → Pvmt" entry.

### Using the Reference

These abbreviations are applied automatically in the Generator's Title and Subtitle fields. Use this tab to look up how a specific term will be abbreviated, or to verify that a filename's title segment uses the correct abbreviation.

Click **← Back** to return to the main Generator/Validator view.

![Abbreviations tab](images/abbreviations-tab.png)

---

## Conventions Tab

Click **View Conventions** in the header to open the convention reference cards. This tab lists all 9 naming conventions with expandable details.

### Convention Cards

Click any convention card to expand it and see:

- **Description** — what the convention is used for.
- **Required Fields** — fields you must fill in.
- **Optional Fields** — fields you can leave blank.
- **Lookup Fields** — fields resolved automatically from your selections.
- **Name Pattern** — the format template showing how the filename is assembled.
- **File Extension** — the expected file extension (`.kmz` or `.pdf`).
- **Example** — a sample valid filename.

Click **← Back** to return to the main view.

![Conventions tab](images/conventions-tab.png)

---

## Convention Quick Reference

| Convention | When to Use | Example |
|------------|-------------|---------|
| KMZ | Google Earth mapping files | `P3_201210-9_ProjectLimits_2025-01-15.kmz` |
| FDOT Production Deliverables | Final plan sheet deliverables to FDOT | `20121095201-PLANS-01-ROADWAY.pdf` |
| FDOT Production Deliverables (Phased) | Phased plan sheet submittals | `20121095201-PLANS-01-ROADWAY-90pct.pdf` |
| Guide Sign Worksheets | Guide sign design worksheets | `20121095201-GuideSignWorksheets.pdf` |
| Design Submittal | Reports, calcs, memos, analysis packages | `P3-0001.00-PS_PvmtDsgnRpt.pdf` |
| FPID Document | General project documents by short FPID | `201210-9_TypSectionPkg.pdf` |
| Permit Document | Permit docs filed by agency permit number | `50-12345-P_Permit-SFWMD-ERP.pdf` |
| FPID Document (External) | Documents using a non-MI4 FPID number | `201210-3_NEPADocs.pdf` |
| Program Document | Program-level docs not tied to an FPID | `MI4_InterimDrngTypSection.pdf` |

---

## Tips

- **Use the autocomplete.** When typing a Title, let the autocomplete suggestions guide you to the standard document name. This ensures correct abbreviations.
- **Check before renaming.** Use the Validator to verify a filename before renaming your file. Paste in the filename you plan to use and confirm it passes.
- **Optional fields.** If a field is marked Optional (amber), leaving it blank is fine — the corresponding segment is simply omitted from the filename.
- **Copy the pattern.** If the Validator flags a filename as invalid, use the "Copy Pattern" button to get the correct format, then adjust your filename accordingly.
- **Subtitle separator.** When a subtitle is included, it is separated from the title by a hyphen (`-`), not an underscore.
