# MI-4 File Name Tool — Naming Convention Reference

This document defines the FDOT MI-4 Program file naming conventions. It serves as a standalone reference independent of the tool's UI.

---

## Overview

All MI-4 deliverables follow one of 9 naming conventions. The correct convention depends on the document type:

| # | Convention | Extension | Use Case |
|---|-----------|-----------|----------|
| 1 | [KMZ](#1-kmz) | `.kmz` | Google Earth mapping files |
| 2 | [FDOT Production Deliverables](#2-fdot-production-deliverables) | `.pdf` | Final plan sheet deliverables |
| 3 | [FDOT Production Deliverables (Phased)](#3-fdot-production-deliverables-phased) | `.pdf` | Phased plan sheet submittals |
| 4 | [Guide Sign Worksheets](#4-guide-sign-worksheets) | `.pdf` | Guide sign design worksheets |
| 5 | [Design Submittal](#5-design-submittal) | `.pdf` | Reports, calculations, memos, analysis packages |
| 6 | [FPID Document](#6-fpid-document) | `.pdf` | General project documents by short FPID |
| 7 | [Permit Document](#7-permit-document) | `.pdf` | Permit documents by agency permit number |
| 8 | [FPID Document (External)](#8-fpid-document-external) | `.pdf` | Documents using a non-MI4 FPID number |
| 9 | [Program Document](#9-program-document) | `.pdf` | Program-level documents not tied to an FPID |

### General Rules

- **Segment separator:** Underscore (`_`) separates major segments. Hyphen (`-`) is used within component-based conventions (FDOT Production Deliverables).
- **Title formatting:** Titles use PascalCase with standard abbreviations applied (see [Abbreviations](#abbreviations)).
- **Optional segments:** Shown in square brackets `[...]`. Omit the entire segment (including its separator) when not used.
- **No spaces or special characters** in any segment.

---

## Convention Details

### 1. KMZ

Google Earth project mapping files — exported KMZ overlays, alignments, and project boundaries.

**Pattern:**
```
{projectId}_{fpid}_{title}[-{subtitle}]_{date}.kmz
```

| Segment | Format | Required | Description |
|---------|--------|----------|-------------|
| Project ID | `P1`–`P5`, `PA`, `PB` | Yes | Project abbreviation |
| FPID | `######-#` | Yes | Short Financial Project ID |
| Title | PascalCase, abbreviated | Yes | Document name |
| Subtitle | PascalCase, abbreviated | No | Additional descriptor, hyphen-separated |
| Date | `YYYY-MM-DD` | Yes | File date |

**Example:**
```
P3_201210-9_ProjectLimits_2025-01-15.kmz
P3_201210-9_ProjectLimits-Phase2_2025-01-15.kmz     (with subtitle)
```

---

### 2. FDOT Production Deliverables

Final plan sheet deliverables submitted to FDOT — one file per discipline, no phase suffix.

**Pattern:**
```
{fullFpid}-{deliverableId}[-{revisionId}].pdf
```

| Segment | Format | Required | Description |
|---------|--------|----------|-------------|
| Full FPID | 11 digits | Yes | Full Financial Project ID |
| Deliverable ID | `PLANS-##-NAME` | Yes | Discipline identifier (see [Components](#components)) |
| Revision ID | `REV##` | No | Revision number, zero-padded |

**Example:**
```
20121095201-PLANS-01-ROADWAY.pdf
20121095201-PLANS-01-ROADWAY-REV01.pdf               (with revision)
```

---

### 3. FDOT Production Deliverables (Phased)

Same as Production Deliverables but for phased submittals — includes a submittal phase suffix.

**Pattern:**
```
{fullFpid}-{deliverableId}-{phaseId}.pdf
```

| Segment | Format | Required | Description |
|---------|--------|----------|-------------|
| Full FPID | 11 digits | Yes | Full Financial Project ID |
| Deliverable ID | `PLANS-##-NAME` | Yes | Discipline identifier (see [Components](#components)) |
| Phase ID | Phase suffix | Yes | Submittal phase (see [Submittal Phases](#submittal-phases)) |

**Example:**
```
20121095201-PLANS-01-ROADWAY-90pct.pdf
20121095201-PLANS-03-SIGNALIZATION-Final.pdf
```

---

### 4. Guide Sign Worksheets

Guide sign design worksheets submitted with the full 11-digit FPID identifier.

**Pattern:**
```
{fullFpid}-GuideSignWorksheets.pdf
```

| Segment | Format | Required | Description |
|---------|--------|----------|-------------|
| Full FPID | 11 digits | Yes | Full Financial Project ID |
| Literal | `GuideSignWorksheets` | — | Fixed text (not a variable) |

**Example:**
```
20121095201-GuideSignWorksheets.pdf
```

---

### 5. Design Submittal

Design documents tracked by project, phase, and submittal number — reports, calculations, memos, and analysis packages.

**Pattern:**
```
{projectId}-{submittalId}.{resubmittalId}-{submittalPrefix}_{title}[-{subtitle}][-{phaseMod}].pdf
```

| Segment | Format | Required | Description |
|---------|--------|----------|-------------|
| Project ID | `P1`–`P5`, `PA`, `PB` | Yes | Project abbreviation |
| Submittal ID | 4 digits, zero-padded | Yes | Sequential submittal number (e.g., `0001`) |
| Resubmittal ID | 2 digits, zero-padded | No | Resubmittal number (defaults to `00`) |
| Submittal Prefix | `PS`, `FS`, `PD`, etc. | Yes | Phase prefix (see [Submittal Phases](#submittal-phases)) |
| Title | PascalCase, abbreviated | Yes | Document name |
| Subtitle | PascalCase, abbreviated | No | Additional descriptor, hyphen-separated |
| Phase Modifier | e.g., `30pct`, `60pct`, `RFC` | No | Alternate phase milestone (see [Submittal Phases](#submittal-phases)) |

**Example:**
```
P3-0001.00-PS_PvmtDsgnRpt.pdf
P3-0012.01-FS_BridgeDvlpRpt-SpanAnalysis.pdf        (with resubmittal and subtitle)
P3-0005.00-PS_RdwyDsgnCalcs-60pct.pdf               (with phase modifier)
P3-0008.00-FS_ConstrDocs-RFC.pdf                    (released for construction modifier)
```

**Design ID breakdown:**
```
P3-0001.00-PS
│  │    │  │
│  │    │  └─ Submittal Prefix (phase)
│  │    └──── Resubmittal ID (00 = original)
│  └───────── Submittal ID (sequential)
└──────────── Project ID
```

---

### 6. FPID Document

General project documents identified by short FPID — correspondence, approvals, and miscellaneous deliverables.

**Pattern:**
```
{fpid}_{title}[-{subtitle}].pdf
```

| Segment | Format | Required | Description |
|---------|--------|----------|-------------|
| FPID | `######-#` | Yes | Short Financial Project ID |
| Title | PascalCase, abbreviated | Yes | Document name |
| Subtitle | PascalCase, abbreviated | No | Additional descriptor, hyphen-separated |

**Example:**
```
201210-9_TypSectionPkg.pdf
201210-9_DsgnMemo-Rdwy.pdf                          (with subtitle)
```

---

### 7. Permit Document

Permit documents filed by agency permit number — ERP, NPDES, Section 404, Biological Opinions, and dewatering permits.

**Pattern:**
```
{permitId}_Permit-{permitCode}.pdf
```

| Segment | Format | Required | Description |
|---------|--------|----------|-------------|
| Permit ID | Varies by permit type | Yes | Agency permit number (see [Permits](#permits)) |
| Permit Code | Agency-type code | Yes | Permit type identifier |

**Example:**
```
50-12345-P_Permit-SFWMD-ERP.pdf
SAJ-2024-00123_Permit-USACE-404.pdf
2024-0012345_Permit-USFWS-BO.pdf
4301234_Permit-SWFWMD-ERP.pdf
```

---

### 8. FPID Document (External)

External project documents identified by a non-MI4 FPID number in `######-#` format.

**Pattern:**
```
{externalFpid}_{title}[-{subtitle}].pdf
```

| Segment | Format | Required | Description |
|---------|--------|----------|-------------|
| External FPID | `######-#` | Yes | Non-MI4 FPID number (1-7 digits, formatted to `######-#`) |
| Title | PascalCase, abbreviated | Yes | Document name |
| Subtitle | PascalCase, abbreviated | No | Additional descriptor, hyphen-separated |

**Example:**
```
201210-3_NEPADocs.pdf
```

---

### 9. Program Document

Program-level documents not tied to a specific FPID — prefixed with `MI4`.

**Pattern:**
```
MI4_{title}[-{subtitle}].pdf
```

| Segment | Format | Required | Description |
|---------|--------|----------|-------------|
| Literal | `MI4` | — | Fixed prefix (not a variable) |
| Title | PascalCase, abbreviated | Yes | Document name |
| Subtitle | PascalCase, abbreviated | No | Additional descriptor, hyphen-separated |

**Example:**
```
MI4_InterimDrngTypSection.pdf
```

---

## Appendix A: Projects

| Project Name | Abbreviation |
|-------------|--------------|
| Project 1 | P1 |
| Project 2 | P2 |
| Project 3 | P3 |
| Project 4 | P4 |
| Project 5 | P5 |
| Accel Start Seg A | PA |
| Accel Start Seg B | PB |

---

## Appendix B: Financial Project IDs (FPIDs)

| Short FPID | Full FPID (11-digit) | Project | Description |
|-----------|---------------------|---------|-------------|
| 201210-8 | 20121085201 | Accel Start Seg A | I-4 (S.R. 400) from east of U.S. 27 to west of S.R. 429 |
| 431456-6 | 43145665201 | Accel Start Seg B | I-4 (S.R. 400) from west of S.R. 429 to east of World Drive |
| 431456-7 | 43145675201 | Project 1 | I-4 (S.R. 400) from east of World Drive to east of U.S. 192 |
| 445883-1 | 44588315201 | Project 1 | Southern Connector (SR 417) AET (M&R) |
| 445883-2 | 44588325201 | Project 1 | Southern Connector (SR 417) AET (Reconstruction) |
| 431456-3 | 43145635201 | Project 2 | I-4 (S.R. 400) from east of C.R. 532 to west of World Drive |
| 446581-6 | 44658165201 | Project 2 | Poinciana Connector, Greenfield - Ramps to Eastbound I-4 |
| 446581-3 | 44658135201 | Project 2 | Poinciana Connector, Modify/Construct I-4 Ramps with SR 429 |
| 201210-9 | 20121095201 | Project 3 | I-4 (S.R. 400) from west of U.S. 27 to west of C.R. 532 |
| 451381-2 | 45138125201 | Project 3 | Grandview Parkway from north of Posner Boulevard to Dunson Road |
| 431456-2 | 43145625201 | Project 4 | I-4 (S.R. 400) from east of U.S. 192 to east of S.R. 536 |
| 453159-3 | 45315935201 | Project 4 | I-4 (S.R. 400) Eastbound Tube from west of S.R. 536 to west of Universal Boulevard |
| 446581-4 | 44658145201 | Project 5 | Poinciana Connector (S.R. 538) |

---

## Appendix C: Components (Deliverable Disciplines)

| Display Name | Deliverable ID |
|-------------|---------------|
| Roadway Plans | PLANS-01-ROADWAY |
| Signing and Pavement Marking Plans | PLANS-02-SIGNINGMARKING |
| Signalization Plans | PLANS-03-SIGNALIZATION |
| Intelligent Transportation System (ITS) Plans | PLANS-04-ITS |
| Lighting Plans | PLANS-05-LIGHTING |
| Landscaping Plans | PLANS-06-LANDSCAPE |
| Architectural Plans | PLANS-07-ARCHITECHTURAL |
| Structures Plans | PLANS-08-STRUCTURES |
| Toll Plans | PLANS-09-TOLLFACILITIES |
| Utility Work by Highway Contractor Agreement Plans | PLANS-10-UTILITYWORK |
| Roadway Plans - Geotechnical Core Borings | PLANS-01-ROADWAY-COREBORINGS |
| Roadway Plans - Verification of Underground Utilities Survey | PLANS-01-ROADWAY-VERIFIEDUTILITIES |
| Roadway Plans - Tree Survey | PLANS-01-ROADWAY-TREESURVEY |
| CADD Folder | CADD |

---

## Appendix D: Submittal Phases

| Phase Description | Prefix | Default Phase | Phase Modifiers |
|------------------|--------|--------------|-----------------|
| Prelim Engineering - Line and Grade | *(none)* | 15pct | — |
| Prelim Engineering - Phase 1 | *(none)* | 30pct | — |
| Prelim Engineering - Phase 1A | *(none)* | 30Apct | — |
| Prelim Engineering - Phase 2 | *(none)* | 45pct | — |
| Design - Phase Submittal (90%) | PS | 90pct | 30pct, 60pct |
| Design - Final Submittal (100%) | FS | Final | RFC |
| Design - Project Documentation | PD | — | — |
| Design - Shop Drawing | SD | — | — |
| Design - Contract Submittal | CS | — | — |
| Design - Courtesy Review | CR | — | — |
| Design - Field Correction Request | FCR | — | — |
| Design - Request for Information | RFI | — | — |
| Design - Request for Modification | RFM | — | — |

**Prefix** is used in the Design Submittal convention (e.g., `P3-0001.00-PS_Title.pdf`).
**Default Phase** is used in the FDOT Production Deliverables (Phased) convention (e.g., `20121095201-PLANS-01-ROADWAY-90pct.pdf`).
**Phase Modifiers** are optional alternate milestone suffixes available for certain phases in the Design Submittal convention (e.g., a PS submittal delivered at 60% uses modifier `60pct`; an FS package released for construction uses modifier `RFC`).

Phases marked "—" in the Default Phase column do not have a phase suffix and are not available for phased deliverables.

---

## Appendix E: Permits

| Permit Type | Code | ID Format | Mask | Example |
|------------|------|-----------|------|---------|
| SFWMD ERP | SFWMD-ERP | `##-#####-A` | 2 digits, dash, 5 digits, dash, 1 letter | `50-12345-P` |
| SWFWMD ERP | SWFWMD-ERP | `#######` or `43-#######` | 7 digits (optionally prefixed with 43-) | `4301234` |
| USACE Section 404 | USACE-404 | `SAJ-####-#####` | SAJ, dash, 4 digits, dash, 5 digits | `SAJ-2024-00123` |
| USFWS Biological Opinion | USFWS-BO | `####-#######` | 4 digits, dash, 7 digits | `2024-0012345` |

---

## Appendix F: Abbreviations

The following abbreviations are automatically applied to Title and Subtitle fields. The tool matches longest phrases first.

| Full Word / Phrase | Abbreviation |
|-------------------|--------------|
| Alignment | Algn |
| Architectural | Arch |
| Asbestos Containing Materials | ACM |
| Attachment | Atch |
| Calculation | Calc |
| Calculations | Calcs |
| Certificate | Cert |
| Certification | Cert |
| Coordination | Coord |
| Cross Section | Xsec |
| Cross-Section | Xsec |
| Design | Dsgn |
| Design Analysis Report | DAR |
| Distribution | Dist |
| Document | Doc |
| Documents | Docs |
| Drainage | Drng |
| Drawing | Dwg |
| Drawings | Dwgs |
| Elevation | Elev |
| Environmental | Env |
| Evaluation | Eval |
| Existing | Exist |
| Existing Roadway Characteristics Assessment Report | ERCAR |
| Express Lane | EL |
| Express Lanes | EL |
| Geotechnical | Geotech |
| Information | Info |
| Inspection | Insp |
| Lead-Based Paint | LBP |
| Lighting | Ltg |
| Maintenance | Maint |
| Maximum | Max |
| Memorandum | Memo |
| Memorandum of Understanding | MOU |
| Minimum | Min |
| Modification | Mod |
| Original | Orig |
| Package | Pkg |
| Pavement | Pvmt |
| Phase | Ph |
| Preliminary | Prelim |
| Profile | Prof |
| Quantities | Qtys |
| Quantity | Qty |
| Report | Rpt |
| Requirement | Req |
| Requirements | Reqs |
| Revision | Rev |
| Right of Way | ROW |
| Right-of-Way | ROW |
| Roadway | Rdwy |
| Schedule | Sched |
| Segment | Seg |
| Shoulder | Shldr |
| Standard | Std |
| Structure | Struct |
| Structures | Structs |
| Survey | Srvy |
| Technical | Tech |
| Temporary | Temp |
| Transmission | Trans |
| Typical | Typ |
| Utilities | Utils |
| Utility | Util |
| Vertical | Vert |
