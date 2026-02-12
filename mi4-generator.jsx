import { useState, useMemo, useCallback } from "react";

// ══════════════════════════════════════════════════════════════
//  DATA — Matches Excel schema exactly
// ══════════════════════════════════════════════════════════════

const INIT_CONVENTIONS = [
  { id:"kmz", desc:"KMZ", exampleDoc:"DocumentName", ext:"kmz",
    info:"Google Earth project mapping files \u2014 exported KMZ overlays, alignments, and project boundaries.",
    exampleName:"P3_201210-9_ProjectLimits_2025-01-15.kmz",
    title:true, designId:false, fpidFull:false, program:false, projectId:true, fpidShort:true, componentId:false, submittalSuffix:false, customId:false, formattedDate:true },
  { id:"fdot-prod", desc:"FDOT Production Deliverables", exampleDoc:"PLANS-XX-SUBDISCIPLINE", ext:"pdf",
    info:"Final plan sheet deliverables submitted to FDOT \u2014 one file per discipline, no phase suffix.",
    exampleName:"20121095201-PLANS-01-ROADWAY.pdf",
    title:false, designId:false, fpidFull:true, program:false, projectId:false, fpidShort:false, componentId:true, submittalSuffix:false, customId:false, formattedDate:false },
  { id:"fdot-prod-ph", desc:"FDOT Production Deliverables (Phased)", exampleDoc:"PLANS-XX-SUBDISCIPLINE", ext:"pdf",
    info:"Same as Production Deliverables but for phased submittals \u2014 includes a submittal phase suffix (e.g. 90pct, Final, RFC).",
    exampleName:"20121095201-PLANS-01-ROADWAY-90pct.pdf",
    title:false, designId:false, fpidFull:true, program:false, projectId:false, fpidShort:false, componentId:true, submittalSuffix:true, customId:false, formattedDate:false },
  { id:"guide", desc:"Guide Sign Worksheets", exampleDoc:"GuideSignWorksheets", ext:"pdf",
    info:"Guide sign design worksheets submitted with the full 11-digit FPID identifier.",
    exampleName:"20121095201_GuideSignWorksheets.pdf",
    title:true, designId:false, fpidFull:true, program:false, projectId:false, fpidShort:false, componentId:false, submittalSuffix:false, customId:false, formattedDate:false },
  { id:"design", desc:"Design Submittal", exampleDoc:"DocumentName", ext:"pdf",
    info:"Design documents tracked by project, phase, and submittal number \u2014 reports, calculations, memos, and analysis packages.",
    exampleName:"P3-PS-0001.00_PvmtDsgnRpt.pdf",
    title:true, designId:true, fpidFull:false, program:false, projectId:false, fpidShort:false, componentId:false, submittalSuffix:false, customId:false, formattedDate:false },
  { id:"fpid-doc", desc:"FPID Document", exampleDoc:"DocumentName", ext:"pdf",
    info:"General project documents identified by short FPID \u2014 correspondence, approvals, and miscellaneous deliverables.",
    exampleName:"201210-9_TypSectionPkg.pdf",
    title:true, designId:false, fpidFull:false, program:false, projectId:false, fpidShort:true, componentId:false, submittalSuffix:false, customId:false, formattedDate:false },
  { id:"permit", desc:"Permit Document", exampleDoc:"XXXXX-XX", ext:"pdf",
    info:"Permit documents filed by agency permit number \u2014 ERP, NPDES, Section 404, Biological Opinions, and dewatering permits.",
    exampleName:"50-12345-P_Permit-SFWMD-ERP.pdf",
    title:false, designId:false, fpidFull:false, program:false, projectId:false, fpidShort:false, componentId:false, submittalSuffix:false, customId:true, formattedDate:false },
];

const INIT_ABBREVIATIONS = {
  "Alignment":"Algn","Architectural":"Arch","Asbestos Containing Materials":"ACM",
  "Attachment":"Atch","Calculation":"Calc","Calculations":"Calcs",
  "Certificate":"Cert","Certification":"Cert","Cross Section":"Xsec","Cross-Section":"Xsec",
  "Design":"Dsgn","Design Analysis Report":"DAR","Document":"Doc","Documents":"Docs",
  "Drainage":"Drng","Drawing":"Dwg","Drawings":"Dwgs","Elevation":"Elev",
  "Environmental":"Env","Evaluation":"Eval","Existing":"Exist",
  "Geotechnical":"Geotech","Hydraulic":"Hydr","Information":"Info","Inspection":"Insp",
  "Intelligent Transportation System":"ITS","Investigation":"Invstg",
  "Justification":"Just","Landscape":"Lndscpe","Lighting":"Ltg",
  "Maintenance":"Maint","Maximum":"Max","Memorandum":"Memo","Minimum":"Min",
  "Modification":"Mod","Operations":"Ops","Original":"Orig",
  "Package":"Pkg","Pavement":"Pvmt","Phase":"Ph","Preliminary":"Prelim",
  "Profile":"Prof","Quantities":"Qtys","Quantity":"Qty",
  "Report":"Rpt","Requirement":"Req","Requirements":"Reqs","Revision":"Rev",
  "Right-of-Way":"ROW","Roadway":"Rdwy","Schedule":"Sched","Segment":"Seg",
  "Shoulder":"Shldr","Signalization":"Sgnlztn","Standard":"Std",
  "Structure":"Struct","Structures":"Structs","Survey":"Srvy",
  "Temporary":"Temp","Typical":"Typ","Verification":"Vrfctn","Worksheet":"Wksht",
};

const PROJECTS = [
  { name:"Project 1", abbr:"P1" },{ name:"Project 2", abbr:"P2" },
  { name:"Project 3", abbr:"P3" },{ name:"Project 4", abbr:"P4" },
  { name:"Project 5", abbr:"P5" },{ name:"Accel Start Seg A", abbr:"PA" },
  { name:"Accel Start Seg B", abbr:"PB" },
];

const FPIDS = [
  { fpid:"201210-8", desc:"I-4 from east of U.S. 27 to west of S.R. 429", full:"20121085201", project:"Accel Start Seg A" },
  { fpid:"431456-6", desc:"I-4 from west of S.R. 429 to east of World Drive", full:"43145665201", project:"Accel Start Seg B" },
  { fpid:"431456-7", desc:"I-4 from east of World Drive to east of U.S. 192", full:"43145675201", project:"Project 1" },
  { fpid:"445883-1", desc:"Southern Connector (SR 417) AET (M&R)", full:"44588315201", project:"Project 1" },
  { fpid:"445883-2", desc:"Southern Connector (SR 417) AET (Reconstruction)", full:"44588325201", project:"Project 1" },
  { fpid:"431456-3", desc:"I-4 from east of C.R. 532 to west of World Drive", full:"43145635201", project:"Project 2" },
  { fpid:"446581-6", desc:"Poinciana Connector, Greenfield - Ramps to EB I-4", full:"44658165201", project:"Project 2" },
  { fpid:"446581-3", desc:"Poinciana Connector, Modify/Construct I-4 Ramps with SR 429", full:"44658135201", project:"Project 2" },
  { fpid:"201210-9", desc:"I-4 from west of U.S. 27 to west of C.R. 532", full:"20121095201", project:"Project 3" },
  { fpid:"451381-2", desc:"Grandview Pkwy from north of Posner Blvd to Dunson Rd", full:"45138125201", project:"Project 3" },
  { fpid:"431456-2", desc:"I-4 from east of U.S. 192 to east of S.R. 536", full:"43145625201", project:"Project 4" },
  { fpid:"453159-3", desc:"I-4 EB Tube from west of S.R. 536 to west of Universal Blvd", full:"45315935201", project:"Project 4" },
  { fpid:"446581-4", desc:"Poinciana Connector (S.R. 538)", full:"44658145201", project:"Project 5" },
];

const SUBMITTAL_PHASES = [
  { desc:"Prelim Engineering - Line and Grade", prefix:"", suffix:"15pct" },
  { desc:"Prelim Engineering - Phase 1", prefix:"", suffix:"30pct" },
  { desc:"Prelim Engineering - Phase 1A", prefix:"", suffix:"30Apct" },
  { desc:"Prelim Engineering - Phase 2", prefix:"", suffix:"45pct" },
  { desc:"Design - Phase Submittal (60%)", prefix:"PS", suffix:"60pct" },
  { desc:"Design - Phase Submittal (90%)", prefix:"PS", suffix:"90pct" },
  { desc:"Design - Final Submittal (100%)", prefix:"FS", suffix:"Final" },
  { desc:"Design - Released for Construction", prefix:"RC", suffix:"RFC" },
  { desc:"Design - Project Documentation", prefix:"PD", suffix:"-" },
  { desc:"Design - Shop Drawing", prefix:"SD", suffix:"-" },
  { desc:"Design - Contract Submittal", prefix:"CS", suffix:"-" },
  { desc:"Design - Courtesy Review", prefix:"CR", suffix:"-" },
  { desc:"Design - Field Correction Request", prefix:"FCR", suffix:"-" },
  { desc:"Design - Request for Information", prefix:"RFI", suffix:"-" },
  { desc:"Design - Request for Modification", prefix:"RFM", suffix:"-" },
];

const COMPONENTS = [
  { name:"Roadway Plans", id:"PLANS-01-ROADWAY" },
  { name:"Signing and Pavement Marking Plans", id:"PLANS-02-SIGNINGMARKING" },
  { name:"Signalization Plans", id:"PLANS-03-SIGNALIZATION" },
  { name:"Intelligent Transportation System (ITS) Plans", id:"PLANS-04-ITS" },
  { name:"Lighting Plans", id:"PLANS-05-LIGHTING" },
  { name:"Landscaping Plans", id:"PLANS-06-LANDSCAPE" },
  { name:"Architectural Plans", id:"PLANS-07-ARCHITECHTURAL" },
  { name:"Structures Plans", id:"PLANS-08-STRUCTURES" },
  { name:"Toll Plans", id:"PLANS-09-TOLLFACILITIES" },
  { name:"Utility Work by Highway Contractor Agreement Plans", id:"PLANS-10-UTILITYWORK" },
  { name:"Roadway Plans - Geotechnical Core Borings", id:"PLANS-01-ROADWAY-COREBORINGS" },
  { name:"Roadway Plans - Verification of Underground Utilities Survey", id:"PLANS-01-ROADWAY-VERIFIEDUTILITIES" },
  { name:"Roadway Plans - Tree Survey", id:"PLANS-01-ROADWAY-TREESURVEY" },
  { name:"CADD Folder", id:"CADD" },
];

const PERMITS = [
  { name:"Permit (SFWMD ERP)", regex:"\\d{2}-\\d{5}-[a-zA-Z]", prefix:"Permit-SFWMD-ERP",
    hint:"##-#####-A", example:"50-12345-P", mask:"2 digits, dash, 5 digits, dash, 1 letter" },
  { name:"Permit (SWFWMD ERP)", regex:"^(43-)?\\d{7}$", prefix:"Permit-SWFWMD-ERP",
    hint:"#######  or  43-#######", example:"4301234", mask:"7 digits (optionally prefixed with 43-)" },
  { name:"Permit (USACE Section 404)", regex:"^SAJ-\\d{4}-\\d{5}(\\(.*\\))?$", prefix:"Permit-USACE-404",
    hint:"SAJ-####-#####", example:"SAJ-2024-00123", mask:"SAJ, dash, 4 digits, dash, 5 digits" },
  { name:"Permit (USFWS Biological Opinion)", regex:"\\b\\d{4}-\\d{7}\\b", prefix:"Permit-USFWS-BO",
    hint:"####-#######", example:"2024-0012345", mask:"4 digits, dash, 7 digits" },
];

const TITLE_SUGGESTIONS = [
  "ICE Report","Design Variation Package","Design Exception Package",
  "Design Memorandum","Design Variation Memorandum","Correspondence",
  "Lane Repurposing Approval","FAA Determination","Intersection Number Request Form",
  "Contract Time Memorandum","Permit Exemption Letter","Structure Number Request Form",
  "Value Engineering Report","Typical Section Package","Pavement Design Report",
  "AutoTurn Analysis","Superelevation Analysis","Cross Slope Evaluation",
  "Barrier Length of Need Analysis","Sight Distance Analysis","Lane Closure Analysis",
  "Work Zone Speed Study","Summary of Pay Items Report","Cross Section Sheet",
  "Transportation Management Plan","ADA Assessment Report",
  "Roadway Safety Assessment Report","Roadway Operational Assessment Report",
  "Existing Roadway Characteristics Assessment Report","Community Awareness Plan",
  "Express Lanes Separation Treatment Selection Memo","Location Hydraulics Report",
  "Bridge Hydraulics Report","Pond Siting Report","Drainage Report",
  "Base Clearance Water Evaluation Report","Pipe Inspection Report",
  "Attachment to Barrier Calculations","Multi-Post Sign Report",
  "Concept Signing Plan","Signal Warrant Report","Signal Analysis Report",
  "ITS Concept of Operations","ITS Power Design Analysis Report",
  "Express Lanes Systems Engineering Mgmt Plan","Express Lanes Concept of Operations",
  "Voltage Drop Calculations","Lighting Justification Report",
  "Lighting Design Analysis Report","Intersection Lighting Retrofit Report",
  "Lighting Agency Coordination","Landscape Maintenance Plan",
  "Landscape Maintenance Cost Estimate","Irrigation Feasibility Report",
  "Landscape Opportunity Plan","Bridge Structure Design Calculations",
  "Temporary Detour Bridge Calculations","Bridge Load Rating Report",
  "Temporary Retaining Wall Design Calcs","Temporary Shoring Design Calculations",
  "Retaining Wall Design Calculations","Overhead Sign Structure Design Calcs",
  "Mast Arm Design Calculations","Box Culvert Design Calculations",
  "High Mast Lighting Design Calcs","Ancillary Structures Report",
  "Bridge Development Report","Toll Siting Technical Memorandum",
  "Express Lanes Diagrams and Concept Plans",
  "Tolls Mechanical Design Analysis Report","Tolls Structural Design Analysis Report",
  "Tolls Gantry Design Analysis Report","Tolls Power Design Analysis Report",
  "GTR Deviations","Electrical Calculations","Mechanical Calculations",
  "Plumbing Calculations","Structural Calculations",
  "Water Feature Hydraulic Calculations","Civil Site Design Documentation",
  "Electrical Design Analysis Report","Mechanical Design Analysis Report",
  "Roadway Geotechnical Report","Sign Structure Geotechnical Report",
  "Signal Structure Geotechnical Report","ITS Geotechnical Report",
  "Lighting Geotechnical Report","Structures Geotechnical Report",
  "Architectural Geotechnical Investigation Report",
];

// ══════════════════════════════════════════════════════════════
//  UTILITIES
// ══════════════════════════════════════════════════════════════

const mono = { fontFamily:"'JetBrains Mono',monospace" };

function applyAbbreviations(text, abbrs) {
  if (!text) return "";
  let result = text;
  const sorted = Object.entries(abbrs).sort((a,b) => b[0].length - a[0].length);
  for (const [full, abbr] of sorted) {
    const escaped = full.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
    result = result.replace(new RegExp("\\b" + escaped + "\\b", "gi"), abbr);
  }
  const specials = /[()\/\\&#@!%$+=\[\]{}.;:'"]/g;
  result = result.replace(specials, "");
  result = result.replace(/-/g, " ").replace(/,/g, " ").replace(/%/g, "pct");
  result = result.trim().replace(/\s+/g, " ");
  const words = result.split(" ").filter(Boolean);
  const capped = words.map(w => {
    const uppers = [...w].filter(c => c === c.toUpperCase() && c !== c.toLowerCase()).length;
    if (uppers >= w.length - 1) return w;
    return w.charAt(0).toUpperCase() + w.slice(1).toLowerCase();
  });
  return capped.join("");
}

const padId = (val, len) => {
  const n = parseInt(val, 10);
  if (isNaN(n) || n < 0) return "";
  return String(n).padStart(len, "0");
};

function validatePermitId(value, regex) {
  if (!value || !regex) return false;
  try { return new RegExp(regex).test(value); } catch { return false; }
}

// ══════════════════════════════════════════════════════════════
//  VALIDATOR ENGINE
// ══════════════════════════════════════════════════════════════

const ALL_FPID_FULLS = new Set(FPIDS.map(f=>f.full));
const ALL_PROJECT_ABBRS = new Set(PROJECTS.map(p=>p.abbr));
const ALL_FPID_SHORTS = new Set(FPIDS.map(f=>f.fpid));
const ALL_COMPONENT_IDS = new Set(COMPONENTS.map(c=>c.id));
const ALL_SUFFIXES = new Set(SUBMITTAL_PHASES.map(s=>s.suffix).filter(s=>s&&s!=="-"));
const ALL_PERMIT_PREFIXES = new Set(PERMITS.map(p=>p.prefix));
const DESIGN_ID_RE = /^(P[A-Z0-9]+)-(PS|FS|RC|PD|SD|CS|CR|FCR|RFI|RFM)-(\d{4})\.(\d{2})$/;
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

function detectConvention(filename) {
  if (!filename) return null;
  if (filename.toLowerCase().endsWith(".kmz")) return "kmz";
  for (const p of PERMITS) { if (filename.includes(p.prefix)) return "permit"; }
  const base = filename.replace(/\.[^.]+$/, "");
  const sortedComps = [...COMPONENTS].sort((a,b)=>b.id.length - a.id.length);
  for (const c of sortedComps) {
    if (base.includes(c.id)) {
      const afterComp = base.split(c.id)[1] || "";
      const trailParts = afterComp.replace(/^-/,"").split("-").filter(Boolean);
      for (const tp of trailParts) { if (ALL_SUFFIXES.has(tp)) return "fdot-prod-ph"; }
      return "fdot-prod";
    }
  }
  if (DESIGN_ID_RE.test(base.split("_")[0])) return "design";
  const uParts = base.split("_");
  for (const seg of uParts) { if (ALL_FPID_SHORTS.has(seg)) return "fpid-doc"; }
  for (const seg of uParts) { if (ALL_FPID_FULLS.has(seg)) return "guide"; }
  return null;
}

function parseFilename(filename, convId) {
  const conv = INIT_CONVENTIONS.find(c=>c.id===convId);
  if (!conv || !filename) return null;
  const segments = [];
  let overall = true;
  const dotIdx = filename.lastIndexOf(".");
  const ext = dotIdx > -1 ? filename.slice(dotIdx+1) : "";
  const base = dotIdx > -1 ? filename.slice(0, dotIdx) : filename;
  const extValid = ext.toLowerCase() === conv.ext.toLowerCase();
  segments.push({ label:"Extension", value:"."+ext, valid:extValid, expected:"."+conv.ext });
  if (!extValid) overall = false;

  if (conv.customId) {
    let foundPrefix = null; let prefixIdx = -1;
    const uParts = base.split("_");
    for (let i = 0; i < uParts.length && !foundPrefix; i++) {
      for (let j = uParts.length - 1; j >= i; j--) {
        const joined = uParts.slice(i, j+1).join("_");
        if (ALL_PERMIT_PREFIXES.has(joined)) { foundPrefix = joined; prefixIdx = i; break; }
      }
    }
    if (foundPrefix) {
      const permit = PERMITS.find(p=>p.prefix===foundPrefix);
      const customPart = uParts.slice(0, prefixIdx).join("_");
      const idValid = permit && customPart ? validatePermitId(customPart, permit.regex) : false;
      segments.unshift({ label:"Custom ID", value:customPart||"(missing)", valid:idValid&&!!customPart, expected:permit?"Format: "+permit.hint+" (e.g. "+permit.example+")":"Unknown permit format" });
      segments.splice(1, 0, { label:"Permit Prefix", value:foundPrefix, valid:true, expected:foundPrefix });
      if (!idValid || !customPart) overall = false;
    } else {
      segments.unshift({ label:"Custom ID", value:base, valid:false, expected:"ID_Permit-Agency-Type" });
      segments.splice(1, 0, { label:"Permit Prefix", value:"(not found)", valid:false, expected:"e.g. Permit-SFWMD-ERP" });
      overall = false;
    }
    return { segments, overall, convention: conv };
  }

  if (conv.componentId) {
    let foundComp = null; let compStart = -1;
    const sortedComps = [...COMPONENTS].sort((a,b)=>b.id.length - a.id.length);
    for (const c of sortedComps) { const idx = base.indexOf(c.id); if (idx > -1) { foundComp = c; compStart = idx; break; } }
    const beforeComp = compStart > 0 ? base.slice(0, compStart).replace(/-$/, "") : "";
    const fpidValid = ALL_FPID_FULLS.has(beforeComp);
    segments.unshift({ label:"FPID (Full)", value:beforeComp||"(missing)", valid:fpidValid, expected:"11-digit FPID" });
    if (!fpidValid) overall = false;
    segments.splice(1, 0, { label:"Deliverable ID", value:foundComp?foundComp.id:"(not found)", valid:!!foundComp, expected:"e.g. PLANS-01-ROADWAY" });
    if (!foundComp) overall = false;
    if (conv.submittalSuffix) {
      const afterComp = foundComp ? base.slice(compStart + foundComp.id.length).replace(/^-/, "") : "";
      const suffixValid = ALL_SUFFIXES.has(afterComp);
      segments.splice(2, 0, { label:"Submittal Suffix", value:afterComp||"(missing)", valid:suffixValid, expected:"e.g. 90pct, Final, RFC" });
      if (!suffixValid) overall = false;
    }
    return { segments, overall, convention: conv };
  }

  const uParts = base.split("_");
  let cursor = 0;
  if (conv.designId) {
    const seg = uParts[cursor] || "";
    const m = DESIGN_ID_RE.exec(seg);
    let details = "";
    if (m) { const pv = ALL_PROJECT_ABBRS.has(m[1]); details = pv ? "Project: "+m[1] : "Unknown project: "+m[1]; if (!pv) overall = false; }
    segments.unshift({ label:"Design ID", value:seg||"(missing)", valid:!!m, expected:"PX-PS-0001.00", details });
    if (!m) overall = false;
    cursor++;
  }
  if (conv.fpidFull && !conv.componentId) {
    const seg = uParts[cursor] || "";
    const valid = ALL_FPID_FULLS.has(seg);
    segments.push({ label:"FPID (Full)", value:seg||"(missing)", valid, expected:"11-digit FPID" });
    if (!valid) overall = false;
    cursor++;
  }
  if (conv.projectId) {
    const seg = uParts[cursor] || "";
    const valid = ALL_PROJECT_ABBRS.has(seg);
    segments.push({ label:"Project ID", value:seg||"(missing)", valid, expected:"e.g. P1, P3, PA" });
    if (!valid) overall = false;
    cursor++;
  }
  if (conv.fpidShort) {
    const seg = uParts[cursor] || "";
    const valid = ALL_FPID_SHORTS.has(seg);
    segments.push({ label:"FPID (Short)", value:seg||"(missing)", valid, expected:"e.g. 201210-9" });
    if (!valid) overall = false;
    cursor++;
  }
  if (conv.title) {
    let titleParts = [];
    while (cursor < uParts.length) {
      if (conv.formattedDate && DATE_RE.test(uParts[cursor])) break;
      titleParts.push(uParts[cursor]);
      cursor++;
    }
    const titleVal = titleParts.join("_");
    segments.push({ label:"Document Name", value:titleVal||"(missing)", valid:titleVal.length > 0, expected:"PascalCase abbreviated title" });
    if (!titleVal) overall = false;
  }
  if (conv.submittalSuffix && !conv.componentId) {
    const seg = uParts[cursor] || "";
    const valid = ALL_SUFFIXES.has(seg);
    segments.push({ label:"Submittal Suffix", value:seg||"(missing)", valid, expected:"e.g. 90pct, Final, RFC" });
    if (!valid) overall = false;
    cursor++;
  }
  if (conv.formattedDate) {
    const seg = uParts[cursor] || "";
    const valid = DATE_RE.test(seg);
    segments.push({ label:"Formatted Date", value:seg||"(missing)", valid, expected:"YYYY-MM-DD" });
    if (!valid) overall = false;
    cursor++;
  }
  if (cursor < uParts.length) {
    segments.push({ label:"Unexpected", value:uParts.slice(cursor).join("_"), valid:false, expected:"(none)" });
    overall = false;
  }
  return { segments, overall, convention: conv };
}

function buildExpectedPattern(conv) {
  if (!conv) return "";
  if (conv.customId) return "CustomID_Permit-Agency-Type.pdf";
  const sep = conv.componentId ? "-" : "_";
  let parts = [];
  if (conv.designId) parts.push("PX-PS-0001.00");
  if (conv.fpidFull) parts.push("XXXXXXXXXXX");
  if (conv.projectId) parts.push("PX");
  if (conv.fpidShort) parts.push("XXXXXX-X");
  if (conv.componentId) parts.push("PLANS-XX-DISCIPLINE");
  if (conv.title) parts.push("DocName");
  if (conv.submittalSuffix) parts.push("Suffix");
  let b = parts.join(sep);
  if (conv.formattedDate) b += "_YYYY-MM-DD";
  return b + "." + conv.ext;
}

// ══════════════════════════════════════════════════════════════
//  SHARED UI COMPONENTS
// ══════════════════════════════════════════════════════════════

const inputBase = {
  width:"100%",padding:"9px 12px",fontSize:14,border:"1.5px solid #d1d5db",
  borderRadius:8,background:"#fff",color:"#0f172a",outline:"none",
  fontFamily:"'DM Sans',sans-serif",boxSizing:"border-box",transition:"border-color .15s",
};
const focusH = e => { e.target.style.borderColor = "#3b82f6"; };
const blurH = e => { e.target.style.borderColor = "#d1d5db"; };

function Label({label,hint}){
  return (<label style={{display:"block",marginBottom:5}}>
    <span style={{fontSize:11,fontWeight:700,letterSpacing:".07em",textTransform:"uppercase",color:"#475569"}}>{label}</span>
    {hint && <span style={{fontSize:11,color:"#94a3b8",marginLeft:6,fontWeight:400,letterSpacing:0}}>{hint}</span>}
  </label>);
}

function Sel({label,hint,value,onChange,options,placeholder}){
  return (<div style={{marginBottom:14}}>
    <Label label={label} hint={hint}/>
    <select value={value} onChange={e=>onChange(e.target.value)}
      style={{...inputBase,color:value?"#0f172a":"#94a3b8",cursor:"pointer"}}
      onFocus={focusH} onBlur={blurH}>
      <option value="">{placeholder||"Select\u2026"}</option>
      {options.map(o=><option key={o.value} value={o.value}>{o.label}</option>)}
    </select>
  </div>);
}

function Inp({label,hint,value,onChange,placeholder,maxLength,type}){
  return (<div style={{marginBottom:14}}>
    <Label label={label} hint={hint}/>
    <input type={type||"text"} value={value} onChange={e=>onChange(e.target.value)}
      placeholder={placeholder} maxLength={maxLength}
      style={inputBase} onFocus={focusH} onBlur={blurH}/>
  </div>);
}

function Tag({children}){
  return <span style={{fontSize:10,fontWeight:600,letterSpacing:".04em",color:"#2563eb",background:"rgba(37,99,235,.06)",border:"1px solid rgba(37,99,235,.13)",borderRadius:4,padding:"2px 8px",textTransform:"uppercase",whiteSpace:"nowrap"}}>{children}</span>;
}

function Chip({c,children}){
  return <span style={{...mono,fontSize:11,color:c,background:c+"0d",border:"1px solid "+c+"28",borderRadius:3,padding:"1px 5px",whiteSpace:"nowrap"}}>{children}</span>;
}

function SmBtn({onClick,children,color,bg,border,disabled}){
  return <button onClick={onClick} disabled={disabled} style={{fontSize:11,fontWeight:600,color:color||"#2563eb",background:bg||"rgba(37,99,235,.06)",border:"1px solid "+(border||"rgba(37,99,235,.15)"),borderRadius:5,padding:"4px 10px",cursor:disabled?"default":"pointer",fontFamily:"'DM Sans',sans-serif",opacity:disabled?.4:1,transition:"opacity .15s"}}>{children}</button>;
}

function AutocompleteInput({label,hint,value,onChange,placeholder,suggestions}){
  const [focused,setFocused]=useState(false);
  const [highlightIdx,setHighlightIdx]=useState(-1);
  const filtered = useMemo(()=>{
    if(!value||!value.trim()) return suggestions.slice(0,8);
    const q = value.toLowerCase();
    return suggestions.filter(s=>s.toLowerCase().includes(q)).slice(0,8);
  },[value,suggestions]);
  const showDropdown = focused && filtered.length > 0;
  const handleKeyDown = (e) => {
    if(!showDropdown) return;
    if(e.key==="ArrowDown"){ e.preventDefault(); setHighlightIdx(i=>Math.min(i+1,filtered.length-1)); }
    else if(e.key==="ArrowUp"){ e.preventDefault(); setHighlightIdx(i=>Math.max(i-1,0)); }
    else if(e.key==="Enter"&&highlightIdx>=0){ e.preventDefault(); onChange(filtered[highlightIdx]); setFocused(false); }
    else if(e.key==="Escape"){ setFocused(false); }
  };
  return (<div style={{marginBottom:14,position:"relative"}}>
    <Label label={label} hint={hint}/>
    <input type="text" value={value}
      onChange={e=>{onChange(e.target.value);setHighlightIdx(-1);}}
      onFocus={e=>{setFocused(true);focusH(e);}}
      onBlur={e=>{setTimeout(()=>setFocused(false),150);blurH(e);}}
      onKeyDown={handleKeyDown} placeholder={placeholder} style={inputBase} autoComplete="off" />
    {showDropdown && (<div style={{position:"absolute",top:"100%",left:0,right:0,zIndex:20,background:"#fff",border:"1.5px solid #d1d5db",borderTop:"none",borderRadius:"0 0 8px 8px",boxShadow:"0 8px 24px rgba(0,0,0,.1)",maxHeight:220,overflowY:"auto"}}>
      {filtered.map((s,i)=>(<div key={s+i}
        onMouseDown={e=>{e.preventDefault();onChange(s);setFocused(false);}}
        onMouseEnter={()=>setHighlightIdx(i)}
        style={{padding:"8px 12px",fontSize:13,color:"#334155",cursor:"pointer",background:i===highlightIdx?"#eff6ff":"transparent",borderBottom:i<filtered.length-1?"1px solid #f3f4f6":"none"}}>
        {value&&value.trim() ? highlightMatch(s,value) : s}
      </div>))}
    </div>)}
  </div>);
}

function highlightMatch(text,query){
  const idx = text.toLowerCase().indexOf(query.toLowerCase());
  if(idx===-1) return text;
  return <>{text.slice(0,idx)}<strong style={{color:"#2563eb"}}>{text.slice(idx,idx+query.length)}</strong>{text.slice(idx+query.length)}</>;
}

function Card({children}){
  return <div style={{width:"100%",maxWidth:600,background:"#fff",borderRadius:14,boxShadow:"0 20px 60px rgba(0,0,0,.35),0 1px 3px rgba(0,0,0,.06)",overflow:"hidden"}}>{children}</div>;
}

function BackLink({onClick,label}){
  return <button onClick={onClick} style={{display:"inline-flex",alignItems:"center",gap:5,background:"none",border:"none",cursor:"pointer",fontSize:13,fontWeight:600,color:"#60a5fa",padding:0,fontFamily:"'DM Sans',sans-serif",marginBottom:16}}><span style={{fontSize:17,lineHeight:1}}>{"\u2190"}</span> {label||"Back"}</button>;
}

function NavLink({onClick,children}){
  return <button style={{background:"none",border:"none",cursor:"pointer",fontSize:12,fontWeight:600,color:"#60a5fa",padding:0,fontFamily:"'DM Sans',sans-serif",textDecoration:"underline",textUnderlineOffset:3}} onClick={onClick}>{children}</button>;
}

function ModeToggle({mode, setMode}){
  const tabs = [{id:"generator",label:"Generator"},{id:"validator",label:"Validator"}];
  return (<div style={{display:"inline-flex",borderRadius:10,padding:3,background:"rgba(255,255,255,.06)",border:"1px solid rgba(255,255,255,.08)",marginBottom:16}}>
    {tabs.map(t=>{
      const active = mode===t.id;
      return (<button key={t.id} onClick={()=>setMode(t.id)} style={{
        fontSize:13,fontWeight:600,padding:"7px 22px",borderRadius:8,border:"none",cursor:"pointer",
        fontFamily:"'DM Sans',sans-serif",transition:"all .2s",
        color:active?"#0f172a":"#94a3b8",background:active?"#fff":"transparent",
        boxShadow:active?"0 2px 8px rgba(0,0,0,.15)":"none",
      }}>{t.label}</button>);
    })}
  </div>);
}

// ══════════════════════════════════════════════════════════════
//  GENERATOR VIEW
// ══════════════════════════════════════════════════════════════

function GeneratorView({abbreviations, conventions}){
  const [convention,setConvention]=useState("");
  const [title,setTitle]=useState("");
  const [subTitle,setSubTitle]=useState("");
  const [fpidShort,setFpidShort]=useState("");
  const [project,setProject]=useState("");
  const [component,setComponent]=useState("");
  const [submittalPhase,setSubmittalPhase]=useState("");
  const [submittalIdRaw,setSubmittalIdRaw]=useState("");
  const [isResubmittal,setIsResubmittal]=useState(false);
  const [resubmittalIdRaw,setResubmittalIdRaw]=useState("");
  const [formattedDate,setFormattedDate]=useState("");
  const [customIdFormat,setCustomIdFormat]=useState("");
  const [customIdValue,setCustomIdValue]=useState("");
  const [copied,setCopied]=useState(false);

  const conv = useMemo(()=>conventions.find(c=>c.id===convention),[convention,conventions]);
  const needs = useMemo(()=>{
    if(!conv) return {};
    return { title:conv.title, designId:conv.designId, fpidFull:conv.fpidFull, projectId:conv.projectId, fpidShort:conv.fpidShort, componentId:conv.componentId, submittalSuffix:conv.submittalSuffix, formattedDate:conv.formattedDate, customId:conv.customId };
  },[conv]);
  const needsFpid = needs.fpidFull || needs.fpidShort;
  const needsProject = needs.designId || needs.projectId;

  const resolvedProjectAbbr = useMemo(()=>{
    if(fpidShort){ const f=FPIDS.find(fp=>fp.fpid===fpidShort); if(f){ const p=PROJECTS.find(pr=>pr.name===f.project); return p?p.abbr:""; }}
    if(project){ const p=PROJECTS.find(pr=>pr.name===project); return p?p.abbr:""; }
    return "";
  },[fpidShort,project]);
  const resolvedFpidFull = useMemo(()=>{ const f=FPIDS.find(fp=>fp.fpid===fpidShort); return f?f.full:""; },[fpidShort]);
  const resolvedComponentId = useMemo(()=>{ const c=COMPONENTS.find(co=>co.name===component); return c?c.id:""; },[component]);
  const resolvedPhase = useMemo(()=>SUBMITTAL_PHASES.find(s=>s.desc===submittalPhase)||{prefix:"",suffix:""},[submittalPhase]);
  const resolvedPermit = useMemo(()=>PERMITS.find(p=>p.name===customIdFormat)||null,[customIdFormat]);
  const submittalId = padId(submittalIdRaw,4);
  const resubmittalId = isResubmittal ? padId(resubmittalIdRaw,2) : "00";
  const customIdValid = useMemo(()=>{
    if(!needs.customId||!customIdFormat||!customIdValue||!resolvedPermit) return null;
    return validatePermitId(customIdValue, resolvedPermit.regex);
  },[needs.customId, customIdFormat, customIdValue, resolvedPermit]);

  const docName = useMemo(()=>{
    let parts=[];
    if(title) parts.push(applyAbbreviations(title,abbreviations));
    if(subTitle) parts.push(applyAbbreviations(subTitle,abbreviations));
    return parts.join("-");
  },[title,subTitle,abbreviations]);

  const designIdStr = useMemo(()=>{
    if(!needs.designId||!resolvedProjectAbbr||!resolvedPhase.prefix||!submittalId) return "";
    return resolvedProjectAbbr+"-"+resolvedPhase.prefix+"-"+submittalId+"."+resubmittalId;
  },[needs.designId,resolvedProjectAbbr,resolvedPhase.prefix,submittalId,resubmittalId]);

  const submittalSuffixStr = useMemo(()=>{
    if(!needs.submittalSuffix) return "";
    const s = resolvedPhase.suffix; return (s && s !== "-") ? s : "";
  },[needs.submittalSuffix,resolvedPhase.suffix]);

  const generatedName = useMemo(()=>{
    if(!conv) return "";
    if(needs.customId) {
      if(!customIdFormat||!customIdValue||!resolvedPermit||customIdValid===false) return "";
      return customIdValue + "_" + resolvedPermit.prefix + "." + conv.ext;
    }
    const sep = conv.componentId ? "-" : "_";
    let segs=[];
    if(needs.designId && designIdStr) segs.push(designIdStr);
    if(needs.fpidFull && resolvedFpidFull) segs.push(resolvedFpidFull);
    if(needs.projectId && resolvedProjectAbbr) segs.push(resolvedProjectAbbr);
    if(needs.fpidShort && fpidShort) segs.push(fpidShort);
    if(needs.componentId && resolvedComponentId) segs.push(resolvedComponentId);
    if(needs.title) segs.push(docName || conv.exampleDoc);
    if(needs.submittalSuffix && submittalSuffixStr) segs.push(submittalSuffixStr);
    let base = segs.join(sep);
    if(needs.formattedDate && formattedDate) base += "_" + formattedDate;
    if(base) base += "." + conv.ext;
    return base;
  },[conv,needs,designIdStr,resolvedFpidFull,resolvedProjectAbbr,fpidShort,resolvedComponentId,docName,submittalSuffixStr,formattedDate,customIdFormat,customIdValue,resolvedPermit,customIdValid]);

  const fieldStatus = useMemo(()=>{
    if(!conv) return {};
    const s = {};
    if(needs.title) s["Title"] = !!title.trim();
    if(needs.designId) s["Design ID"] = !!(resolvedProjectAbbr && resolvedPhase.prefix && submittalId);
    if(needs.fpidFull) s["FPID (Full)"] = !!resolvedFpidFull;
    if(needs.projectId) s["Project ID"] = !!resolvedProjectAbbr;
    if(needs.fpidShort) s["FPID (Short)"] = !!fpidShort;
    if(needs.componentId) s["Deliverable"] = !!resolvedComponentId;
    if(needs.submittalSuffix) s["Submittal Suffix"] = !!submittalSuffixStr;
    if(needs.formattedDate) s["Formatted Date"] = !!formattedDate.trim();
    if(needs.customId) { s["Custom ID Format"] = !!customIdFormat; s["Custom ID"] = !!(customIdValue && customIdValid !== false); }
    return s;
  },[conv,needs,title,resolvedProjectAbbr,resolvedPhase.prefix,submittalId,resolvedFpidFull,fpidShort,resolvedComponentId,submittalSuffixStr,formattedDate,customIdFormat,customIdValue,customIdValid]);

  const isValid = useMemo(()=>{ const v = Object.values(fieldStatus); return v.length > 0 && v.every(Boolean); },[fieldStatus]);
  const filledCount = Object.values(fieldStatus).filter(Boolean).length;
  const totalCount = Object.values(fieldStatus).length;
  const handleCopy = useCallback(()=>{
    if(isValid && generatedName) navigator.clipboard.writeText(generatedName).then(()=>{ setCopied(true); setTimeout(()=>setCopied(false),1800); });
  },[isValid,generatedName]);
  const handleReset = ()=>{
    setConvention("");setTitle("");setSubTitle("");setFpidShort("");setProject("");setComponent("");
    setSubmittalPhase("");setSubmittalIdRaw("");setIsResubmittal(false);setResubmittalIdRaw("");
    setFormattedDate("");setCustomIdFormat("");setCustomIdValue("");
  };
  const filteredFpids = useMemo(()=> project ? FPIDS.filter(f=>f.project===project) : FPIDS ,[project]);

  return (<Card>
    <div style={{padding:"18px 24px 12px"}}>
      <Sel label="Convention" hint="naming pattern" value={convention}
        onChange={v=>{setConvention(v);setTitle("");setSubTitle("");setFpidShort("");setProject("");setComponent("");setSubmittalPhase("");setSubmittalIdRaw("");setIsResubmittal(false);setResubmittalIdRaw("");setFormattedDate("");setCustomIdFormat("");setCustomIdValue("");}}
        placeholder="Choose a naming convention..." options={conventions.filter(c=>c.desc).map(c=>({value:c.id,label:c.desc}))} />
    </div>
    {conv && (<div style={{padding:"16px 24px 20px",borderTop:"1px solid #edf0f4"}}>
      <style>{".fadeIn{animation:fadeSlide .2s ease}@keyframes fadeSlide{from{opacity:0;transform:translateY(5px)}to{opacity:1;transform:translateY(0)}}"}</style>
      <div className="fadeIn">
        {conv.info && (<div style={{marginBottom:14,padding:"10px 14px",background:"#f8fafc",border:"1px solid #e2e8f0",borderRadius:8}}>
          <div style={{fontSize:12,color:"#334155",lineHeight:1.5,marginBottom:4}}>{conv.info}</div>
          {conv.exampleName && (<div style={{fontSize:11,color:"#64748b"}}>Example: <span style={{...mono,fontSize:11,color:"#475569",fontWeight:500}}>{conv.exampleName}</span></div>)}
        </div>)}
        <div style={{display:"flex",flexWrap:"wrap",gap:5,marginBottom:14}}>
          {Object.entries(fieldStatus).map(([label,filled])=>(
            <span key={label} style={{fontSize:10,fontWeight:600,letterSpacing:".04em",
              color:filled?"#166534":"#2563eb",background:filled?"rgba(22,101,52,.06)":"rgba(37,99,235,.06)",
              border:"1px solid "+(filled?"rgba(22,101,52,.18)":"rgba(37,99,235,.13)"),
              borderRadius:4,padding:"2px 8px",textTransform:"uppercase",whiteSpace:"nowrap",transition:"all .2s"}}>
              {filled && <span style={{marginRight:3}}>{"\u2713"}</span>}{label}
            </span>))}
        </div>
        {needs.title && (<div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
          <AutocompleteInput label="Title" hint="auto-abbreviated" value={title} onChange={setTitle} placeholder="e.g. Pavement Design Report" suggestions={TITLE_SUGGESTIONS} />
          <Inp label="Sub-Title" hint="optional" value={subTitle} onChange={setSubTitle} placeholder="e.g. Segment 1" />
        </div>)}
        {needsFpid && (<>
          <Sel label={needs.fpidFull?"FPID":"FPID (Short)"} hint={needs.fpidFull?"resolves full FPID + project":"short format"}
            value={fpidShort} onChange={v=>{setFpidShort(v); const f=FPIDS.find(fp=>fp.fpid===v); if(f) setProject(f.project);}}
            placeholder="Select FPID..." options={filteredFpids.map(f=>({value:f.fpid,label:f.fpid+" \u2014 "+f.desc}))} />
          {fpidShort && (()=>{
            const f=FPIDS.find(fp=>fp.fpid===fpidShort);
            if(!f)return null;
            const p=PROJECTS.find(pr=>pr.name===f.project);
            return (<div style={{marginTop:-8,marginBottom:14,padding:"8px 12px",background:"#f0f9ff",border:"1px solid #bae6fd",borderRadius:6,display:"flex",gap:16,flexWrap:"wrap",fontSize:11,color:"#0369a1"}}>
              <span><strong>Project:</strong> {f.project}{p?" ("+p.abbr+")":""}</span>
              {needs.fpidFull && <span><strong>Full FPID:</strong> <span style={mono}>{f.full}</span></span>}
              <span style={{color:"#64748b",fontStyle:"italic",flex:1,minWidth:150}}>{f.desc}</span>
            </div>);
          })()}
        </>)}
        {needsProject && !needsFpid && (<Sel label="Project" hint="maps to abbreviation" value={project} onChange={setProject}
          placeholder="Select project..." options={PROJECTS.map(p=>({value:p.name,label:p.name+" ("+p.abbr+")"}))} />)}
        {needs.designId && (<>
          <Sel label="Submittal Phase" hint="prefix for Design ID" value={submittalPhase} onChange={setSubmittalPhase}
            placeholder="Select phase..." options={SUBMITTAL_PHASES.filter(s=>s.prefix).map(s=>({value:s.desc,label:s.desc}))} />
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,alignItems:"start"}}>
            <div style={{marginBottom:14}}>
              <Label label="Submittal ID" hint={submittalId ? "\u2192 "+submittalId : "integer \u2192 0000"} />
              <input type="text" inputMode="numeric" value={submittalIdRaw} onChange={e=>setSubmittalIdRaw(e.target.value.replace(/\D/g,""))} placeholder="e.g. 1" maxLength={4} style={inputBase} onFocus={focusH} onBlur={blurH} />
            </div>
            <div style={{marginBottom:14}}>
              <Label label="Resubmittal" hint={isResubmittal && resubmittalId ? "\u2192 "+resubmittalId : "defaults to 00"} />
              <div style={{display:"flex",alignItems:"center",gap:10,minHeight:38}}>
                <label style={{display:"flex",alignItems:"center",gap:6,cursor:"pointer",fontSize:13,color:"#475569",userSelect:"none",whiteSpace:"nowrap",flexShrink:0}}>
                  <input type="checkbox" checked={isResubmittal} onChange={e=>{setIsResubmittal(e.target.checked);if(!e.target.checked)setResubmittalIdRaw("");}} style={{width:16,height:16,accentColor:"#2563eb",cursor:"pointer"}} />Resub?
                </label>
                {isResubmittal ? (<input type="text" inputMode="numeric" value={resubmittalIdRaw} onChange={e=>setResubmittalIdRaw(e.target.value.replace(/\D/g,""))} placeholder="e.g. 1" maxLength={2} style={{...inputBase,flex:1}} onFocus={focusH} onBlur={blurH} />) : (<span style={{...mono,fontSize:13,color:"#94a3b8"}}>00</span>)}
              </div>
            </div>
          </div>
          {designIdStr && (<div style={{marginTop:-8,marginBottom:14,padding:"8px 12px",background:"#f5f3ff",border:"1px solid #ddd6fe",borderRadius:6,fontSize:11,color:"#6d28d9"}}>
            <strong>Design ID preview:</strong> <span style={{...mono,fontSize:12,fontWeight:600,color:"#4c1d95"}}>{designIdStr}</span>
          </div>)}
        </>)}
        {needs.componentId && (<Sel label="Deliverable" hint="plan discipline" value={component} onChange={setComponent}
          placeholder="Select component..." options={COMPONENTS.map(c=>({value:c.name,label:c.name}))} />)}
        {needs.submittalSuffix && !needs.designId && (<Sel label="Submittal Phase" hint="suffix" value={submittalPhase} onChange={setSubmittalPhase}
          placeholder="Select phase..." options={SUBMITTAL_PHASES.map(s=>({value:s.desc,label:s.desc+(s.suffix&&s.suffix!=="-"?" \u2192 "+s.suffix:"")}))} />)}
        {needs.customId && (<>
          <Sel label="Custom ID Format" hint="permit type" value={customIdFormat} onChange={v=>{setCustomIdFormat(v);setCustomIdValue("");}}
            placeholder="Select permit type..." options={PERMITS.map(p=>({value:p.name,label:p.name+" \u2014 format: "+p.hint}))} />
          {customIdFormat && resolvedPermit && (<>
            <div style={{marginTop:-8,marginBottom:10,padding:"8px 12px",background:"#f0f9ff",border:"1px solid #bae6fd",borderRadius:6,fontSize:11,color:"#0369a1"}}>
              <div style={{marginBottom:3}}><strong>Format:</strong> {resolvedPermit.mask}</div>
              <div><strong>Example:</strong> <span style={{...mono,fontWeight:600}}>{resolvedPermit.example}</span></div>
            </div>
            <div style={{marginBottom:14}}>
              <Label label="Custom ID" hint={"format: "+resolvedPermit.hint} />
              <input type="text" value={customIdValue} onChange={e=>setCustomIdValue(e.target.value)}
                placeholder={resolvedPermit.example}
                style={{...inputBase,...mono, borderColor:customIdValue?(customIdValid?"#22c55e":"#ef4444"):"#d1d5db"}}
                onFocus={focusH} onBlur={e=>{e.target.style.borderColor=customIdValue?(customIdValid?"#22c55e":"#ef4444"):"#d1d5db";}} />
              {customIdValue && customIdValid===false && <div style={{marginTop:4,fontSize:11,color:"#ef4444",fontWeight:500}}>{"\u26A0\uFE0F"} Does not match expected format ({resolvedPermit.hint})</div>}
              {customIdValue && customIdValid===true && <div style={{marginTop:4,fontSize:11,color:"#16a34a",fontWeight:500}}>{"\u2713"} Valid {customIdFormat.replace("Permit ","")} ID</div>}
            </div>
          </>)}
        </>)}
        {needs.formattedDate && (<div style={{marginBottom:14}}>
          <Label label="Date" hint={formattedDate||"YYYY-MM-DD"} />
          <input type="date" value={formattedDate} onChange={e=>setFormattedDate(e.target.value)} style={{...inputBase,cursor:"pointer"}} onFocus={focusH} onBlur={blurH} />
        </div>)}
      </div>
    </div>)}
    {conv && (<div style={{borderTop:"1px solid #edf0f4",background:isValid?"linear-gradient(135deg,#f0fdf4,#ecfdf5)":generatedName?"#fffbeb":"#f9fafb",padding:"14px 24px 18px",transition:"background .3s"}}>
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:8}}>
        <div style={{display:"flex",alignItems:"center",gap:8}}>
          <span style={{fontSize:11,fontWeight:700,letterSpacing:".07em",textTransform:"uppercase",color:isValid?"#166534":generatedName?"#92400e":"#94a3b8"}}>Generated File Name</span>
          {totalCount>0 && (<span style={{fontSize:10,fontWeight:600,color:isValid?"#166534":"#92400e",background:isValid?"#dcfce7":"#fef3c7",border:"1px solid "+(isValid?"#bbf7d0":"#fde68a"),borderRadius:10,padding:"1px 8px"}}>{isValid?"\u2713 Valid":filledCount+"/"+totalCount}</span>)}
        </div>
        <div style={{display:"flex",gap:6}}>
          <SmBtn onClick={handleReset} color="#64748b" bg="transparent" border="#d1d5db">Reset</SmBtn>
          {isValid && generatedName && (<SmBtn onClick={handleCopy} color={copied?"#166534":"#2563eb"} bg={copied?"#bbf7d0":"rgba(37,99,235,.07)"} border={copied?"#86efac":"rgba(37,99,235,.18)"}>{copied?"\u2713 Copied":"Copy"}</SmBtn>)}
        </div>
      </div>
      <div style={{...mono,fontSize:13,fontWeight:500,lineHeight:1.6,color:isValid?"#0f172a":generatedName?"#92400e":"#94a3b8",background:"#fff",border:"1.5px solid "+(isValid?"#86efac":generatedName?"#fde68a":"#e2e8f0"),borderRadius:8,padding:"11px 14px",wordBreak:"break-all",minHeight:20,transition:"all .3s"}}>
        {generatedName||"Fill in the required fields above..."}
      </div>
      {generatedName && (<div style={{marginTop:6,display:"flex",alignItems:"center",gap:8,flexWrap:"wrap"}}>
        <span style={{display:"inline-block",fontSize:10,fontWeight:700,letterSpacing:".06em",textTransform:"uppercase",color:"#475569",background:"#e2e8f0",borderRadius:4,padding:"2px 8px"}}>.{conv.ext}</span>
        <span style={{fontSize:11,color:"#64748b"}}>{needs.customId?"permit convention":conv.componentId?"sep: hyphen ( - )":"sep: underscore ( _ )"}</span>
        {!isValid && <span style={{fontSize:11,color:"#b45309",fontWeight:500}}>{"\u2014"} missing required fields</span>}
      </div>)}
    </div>)}
  </Card>);
}

// ══════════════════════════════════════════════════════════════
//  VALIDATOR VIEW
// ══════════════════════════════════════════════════════════════

function ValidatorView({conventions}){
  const [filename,setFilename]=useState("");
  const [convOverride,setConvOverride]=useState("");
  const [expandedSeg,setExpandedSeg]=useState(null);
  const [fixCopied,setFixCopied]=useState(false);
  const detected = useMemo(()=> filename.trim() ? detectConvention(filename.trim()) : null,[filename]);
  const activeConvId = convOverride || detected;
  const activeConv = useMemo(()=>INIT_CONVENTIONS.find(c=>c.id===activeConvId)||null,[activeConvId]);
  const result = useMemo(()=>{
    if (!filename.trim() || !activeConvId) return null;
    return parseFilename(filename.trim(), activeConvId);
  },[filename, activeConvId]);
  const passCount = result ? result.segments.filter(s=>s.valid).length : 0;
  const totalSegs = result ? result.segments.length : 0;

  const segColors = ["#7c3aed","#0891b2","#059669","#ca8a04","#dc2626","#2563eb","#9333ea","#e11d48"];
  const segExplanations = {
    "Extension":"The file extension must match the convention (.pdf, .kmz).",
    "FPID (Full)":"An 11-digit code identifying the Financial Project ID. Derived from the short FPID by removing the hyphen and appending '5201'.",
    "FPID (Short)":"The standard FPID format (######-#) used in FDOT project tracking.",
    "Project ID":"A short abbreviation (P1-P5, PA, PB) mapped from the project name.",
    "Deliverable ID":"A structured identifier for the plan discipline, e.g. PLANS-01-ROADWAY.",
    "Submittal Suffix":"Indicates the submittal phase: 15pct, 30pct, 60pct, 90pct, Final, or RFC.",
    "Design ID":"Format: ProjectAbbr-PhasePrefix-SubmittalID.ResubmittalID (e.g. P3-PS-0001.00).",
    "Document Name":"The document title, PascalCased and abbreviated per the abbreviation table.",
    "Formatted Date":"Date in YYYY-MM-DD format.",
    "Custom ID":"The permit number matching the selected permit type's format.",
    "Permit Prefix":"A standard prefix identifying the permit agency and type.",
    "Unexpected":"Extra segments that don't belong in this convention's pattern.",
  };

  const correctedName = useMemo(()=> activeConv ? buildExpectedPattern(activeConv) : "",[activeConv]);
  const handleFixCopy = useCallback(()=>{
    if(correctedName) navigator.clipboard.writeText(correctedName).then(()=>{ setFixCopied(true); setTimeout(()=>setFixCopied(false),1800); });
  },[correctedName]);

  return (<Card>
    <div style={{padding:"18px 24px 14px"}}>
      <div style={{marginBottom:14}}>
        <Label label="File Name to Validate" hint="paste or type a full filename" />
        <input type="text" value={filename} onChange={e=>setFilename(e.target.value)}
          placeholder="e.g. 43145625201-PLANS-01-ROADWAY-90pct.pdf"
          style={{...inputBase,...mono,fontSize:13}} onFocus={focusH} onBlur={blurH} />
      </div>
      <Sel label="Convention" hint={detected && !convOverride ? "auto-detected" : convOverride ? "manual override" : ""}
        value={convOverride} onChange={setConvOverride}
        placeholder={detected ? INIT_CONVENTIONS.find(c=>c.id===detected)?.desc + " (auto-detected)" : "Paste a filename first..."}
        options={conventions.filter(c=>c.desc).map(c=>({value:c.id,label:c.desc}))} />
      {filename.trim() && !activeConvId && (
        <div style={{padding:"12px 16px",background:"#fffbeb",border:"1px solid #fde68a",borderRadius:8,marginBottom:14}}>
          <div style={{fontSize:12,fontWeight:600,color:"#92400e"}}>{"\u26A0\uFE0F"} Could not auto-detect convention</div>
          <div style={{fontSize:11,color:"#a16207",marginTop:2}}>Select a convention manually to validate against.</div>
        </div>
      )}
    </div>

    {result && (<div style={{borderTop:"1px solid #edf0f4"}}>
      <div style={{padding:"12px 24px",background:result.overall?"linear-gradient(135deg,#f0fdf4,#ecfdf5)":"linear-gradient(135deg,#fef2f2,#fff1f2)",display:"flex",alignItems:"center",justifyContent:"space-between",flexWrap:"wrap",gap:8}}>
        <div style={{display:"flex",alignItems:"center",gap:10}}>
          <span style={{fontSize:20,width:32,height:32,borderRadius:"50%",display:"flex",alignItems:"center",justifyContent:"center",background:result.overall?"#dcfce7":"#fecaca",border:"2px solid "+(result.overall?"#86efac":"#fca5a5"),flexShrink:0}}>
            {result.overall ? "\u2713" : "\u2717"}
          </span>
          <div>
            <div style={{fontSize:14,fontWeight:700,color:result.overall?"#166534":"#991b1b"}}>{result.overall ? "Valid File Name" : "Invalid File Name"}</div>
            <div style={{fontSize:11,color:result.overall?"#15803d":"#b91c1c"}}>{passCount}/{totalSegs} segments passed {"\u00B7"} {activeConv?.desc}</div>
          </div>
        </div>
        <div style={{display:"flex",gap:6,alignItems:"center"}}>
          {detected && !convOverride && (<span style={{fontSize:10,fontWeight:600,color:"#6366f1",background:"rgba(99,102,241,.08)",border:"1px solid rgba(99,102,241,.18)",borderRadius:4,padding:"2px 8px",textTransform:"uppercase"}}>Auto-detected</span>)}
          {!result.overall && (<SmBtn onClick={handleFixCopy} color={fixCopied?"#166534":"#7c3aed"} bg={fixCopied?"#bbf7d0":"rgba(124,58,237,.06)"} border={fixCopied?"#86efac":"rgba(124,58,237,.18)"}>{fixCopied?"\u2713 Copied":"Copy Pattern"}</SmBtn>)}
        </div>
      </div>

      {/* Color-coded parsed filename */}
      <div style={{padding:"12px 24px",borderBottom:"1px solid #edf0f4",background:"#fafafa"}}>
        <div style={{fontSize:10,fontWeight:700,letterSpacing:".07em",textTransform:"uppercase",color:"#475569",marginBottom:6}}>Parsed Structure</div>
        <div style={{...mono,fontSize:12,lineHeight:2,wordBreak:"break-all"}}>
          {result.segments.filter(s=>s.label!=="Extension").map((seg,i)=>{
            const color = segColors[i % segColors.length];
            return (<span key={i}>
              {i > 0 && <span style={{color:"#94a3b8",margin:"0 1px"}}>{activeConv?.componentId && !activeConv?.customId ? "-" : "_"}</span>}
              <span onClick={()=>setExpandedSeg(expandedSeg===i?null:i)} style={{
                color:seg.valid?color:"#dc2626",
                background:seg.valid?color+"0d":"#fef2f2",
                border:"1px solid "+(seg.valid?color+"30":"#fca5a5"),
                borderRadius:3,padding:"1px 4px",cursor:"pointer",
                textDecoration:seg.valid?"none":"wavy underline #ef4444",
                transition:"all .15s",
              }} title={"Click for details: "+seg.label}>{seg.value}</span>
            </span>);
          })}
          {(()=>{ const ext = result.segments.find(s=>s.label==="Extension"); return ext ? <span style={{color:ext.valid?"#64748b":"#dc2626"}}>{ext.value}</span> : null; })()}
        </div>
      </div>

      {/* Segment detail cards */}
      <div style={{padding:"12px 24px 20px"}}>
        <div style={{fontSize:10,fontWeight:700,letterSpacing:".07em",textTransform:"uppercase",color:"#475569",marginBottom:10}}>Segment Analysis <span style={{fontWeight:400,textTransform:"none",letterSpacing:0,color:"#94a3b8"}}>\u2014 click any segment for details</span></div>
        <div style={{display:"flex",flexDirection:"column",gap:6}}>
          {result.segments.map((seg,i)=>{
            const color = seg.label==="Extension" ? (seg.valid?"#64748b":"#dc2626") : segColors[i % segColors.length];
            const isExpanded = expandedSeg===i;
            return (<div key={i} onClick={()=>setExpandedSeg(isExpanded?null:i)} style={{
              display:"grid",gridTemplateColumns:"18px 1fr",gap:10,alignItems:"start",
              padding:"8px 12px",borderRadius:8,cursor:"pointer",transition:"all .15s",
              background:seg.valid?"#f0fdf4":"#fef2f2",
              border:"1px solid "+(seg.valid?"#bbf7d0":"#fecaca"),
              boxShadow:isExpanded?"0 2px 8px rgba(0,0,0,.08)":"none",
            }}>
              <span style={{fontSize:14,marginTop:1,color:seg.valid?"#16a34a":"#dc2626"}}>{seg.valid ? "\u2713" : "\u2717"}</span>
              <div>
                <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:2}}>
                  <span style={{fontSize:11,fontWeight:700,color:seg.valid?"#166534":"#991b1b",textTransform:"uppercase",letterSpacing:".04em"}}>{seg.label}</span>
                  <span style={{width:8,height:8,borderRadius:"50%",background:color,flexShrink:0,opacity:.7}} />
                </div>
                <div style={{...mono,fontSize:12,color:seg.valid?"#15803d":"#b91c1c",fontWeight:500,wordBreak:"break-all"}}>{seg.value}</div>
                {!seg.valid && (<div style={{fontSize:11,color:"#64748b",marginTop:3}}>Expected: <span style={{...mono,fontSize:11,color:"#475569"}}>{seg.expected}</span></div>)}
                {seg.details && (<div style={{fontSize:11,color:"#64748b",marginTop:2}}>{seg.details}</div>)}
                {isExpanded && segExplanations[seg.label] && (
                  <div style={{marginTop:6,padding:"6px 10px",background:"rgba(0,0,0,.03)",borderRadius:4,fontSize:11,color:"#475569",lineHeight:1.5,borderLeft:"3px solid "+color}}>
                    {segExplanations[seg.label]}
                  </div>
                )}
              </div>
            </div>);
          })}
        </div>
      </div>

      {/* Side-by-side comparison for invalid names */}
      {!result.overall && (<div style={{borderTop:"1px solid #edf0f4",padding:"14px 24px 18px",background:"#f8fafc"}}>
        <div style={{fontSize:10,fontWeight:700,letterSpacing:".07em",textTransform:"uppercase",color:"#475569",marginBottom:10}}>Comparison</div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
          <div>
            <div style={{fontSize:10,fontWeight:600,color:"#991b1b",textTransform:"uppercase",letterSpacing:".05em",marginBottom:5}}>Entered</div>
            <div style={{...mono,fontSize:11,fontWeight:500,color:"#b91c1c",wordBreak:"break-all",background:"#fff",border:"1.5px solid #fca5a5",borderRadius:6,padding:"9px 10px",lineHeight:1.5}}>{filename}</div>
          </div>
          <div>
            <div style={{fontSize:10,fontWeight:600,color:"#166534",textTransform:"uppercase",letterSpacing:".05em",marginBottom:5}}>Expected Pattern</div>
            <div style={{...mono,fontSize:11,fontWeight:500,color:"#15803d",wordBreak:"break-all",background:"#fff",border:"1.5px solid #86efac",borderRadius:6,padding:"9px 10px",lineHeight:1.5}}>{correctedName}</div>
          </div>
        </div>
      </div>)}
    </div>)}

    {!result && filename.trim()==="" && (<div style={{borderTop:"1px solid #edf0f4",padding:"32px 24px",textAlign:"center"}}>
      <div style={{fontSize:32,marginBottom:8,opacity:.4}}>{"\uD83D\uDD0D"}</div>
      <div style={{fontSize:13,color:"#94a3b8",lineHeight:1.5}}>Paste a file name above to validate it.<br/>The convention will be auto-detected, or you can select one manually.</div>
    </div>)}
  </Card>);
}

// ══════════════════════════════════════════════════════════════
//  ABBREVIATIONS VIEW
// ══════════════════════════════════════════════════════════════

function AbbreviationsView({navigate, abbreviations}){
  const [search,setSearch]=useState("");
  const entries = useMemo(()=>{
    const all = Object.entries(abbreviations).sort((a,b)=>a[0].localeCompare(b[0]));
    if(!search) return all;
    const q = search.toLowerCase();
    return all.filter(([f,a])=>f.toLowerCase().includes(q)||a.toLowerCase().includes(q));
  },[abbreviations,search]);
  const rowGrid = {display:"grid",gridTemplateColumns:"1fr 100px",alignItems:"center",padding:"7px 0",borderBottom:"1px solid #f3f4f6",gap:8};

  return (<>
    <div style={{maxWidth:600,width:"100%",marginBottom:16}}>
      <BackLink onClick={()=>navigate("main")} label="Back" />
      <h2 style={{fontSize:20,fontWeight:700,color:"#f1f5f9",margin:"0 0 4px"}}>Abbreviation Reference</h2>
      <p style={{fontSize:13,color:"#64748b",margin:0}}>Words are automatically replaced with these abbreviations in generated file names. <strong style={{color:"#94a3b8"}}>{Object.keys(abbreviations).length} entries</strong></p>
    </div>
    <Card>
      <div style={{padding:"16px 24px 10px"}}>
        <input type="text" value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search abbreviations..." style={inputBase} onFocus={focusH} onBlur={blurH} />
      </div>
      <div style={{...rowGrid,padding:"7px 24px",background:"#f8fafc",borderBottom:"1.5px solid #e2e8f0",borderTop:"1px solid #e2e8f0"}}>
        <span style={{fontSize:10,fontWeight:700,letterSpacing:".07em",textTransform:"uppercase",color:"#475569"}}>Full Word</span>
        <span style={{fontSize:10,fontWeight:700,letterSpacing:".07em",textTransform:"uppercase",color:"#475569"}}>Abbreviation</span>
      </div>
      <div style={{maxHeight:440,overflowY:"auto",padding:"0 24px"}}>
        {entries.length===0 && <div style={{padding:"24px 0",textAlign:"center",color:"#94a3b8",fontSize:13}}>{search?"No matches found":"No abbreviations"}</div>}
        {entries.map(([full,abbr])=>(<div key={full} style={rowGrid}>
          <span style={{fontSize:13,color:"#334155"}}>{full}</span>
          <span style={{...mono,fontSize:12,color:"#2563eb",fontWeight:500}}>{abbr}</span>
        </div>))}
      </div>
      <div style={{height:14}} />
    </Card>
  </>);
}

// ══════════════════════════════════════════════════════════════
//  CONVENTIONS VIEW
// ══════════════════════════════════════════════════════════════

function ConventionsView({navigate, conventions}){
  const [expanded,setExpanded]=useState(null);
  const boolFields = ["title","designId","fpidFull","program","projectId","fpidShort","componentId","submittalSuffix","customId","formattedDate"];
  const boolLabels = {title:"Title",designId:"Design ID",fpidFull:"FPID (Full)",program:"Program",projectId:"Project ID",fpidShort:"FPID (Short)",componentId:"Deliverable",submittalSuffix:"Submittal Suffix",customId:"Custom ID",formattedDate:"Formatted Date"};

  return (<>
    <div style={{maxWidth:600,width:"100%",marginBottom:16}}>
      <BackLink onClick={()=>navigate("main")} label="Back" />
      <h2 style={{fontSize:20,fontWeight:700,color:"#f1f5f9",margin:"0 0 4px"}}>Naming Conventions</h2>
      <p style={{fontSize:13,color:"#64748b",margin:0}}>Reference for the {conventions.filter(c=>c.desc).length} file naming conventions.</p>
    </div>
    <Card>
      {conventions.filter(c=>c.desc).map((c,i)=>{
        const isOpen = expanded===c.id;
        const activeFields = boolFields.filter(f=>c[f]);
        return (<div key={c.id} style={{borderTop:i===0?"none":"1px solid #edf0f4"}}>
          <button onClick={()=>setExpanded(isOpen?null:c.id)} style={{width:"100%",display:"flex",alignItems:"center",justifyContent:"space-between",padding:"14px 24px",background:isOpen?"#f8fafc":"#fff",border:"none",cursor:"pointer",fontFamily:"'DM Sans',sans-serif",textAlign:"left"}}>
            <div style={{flex:1,minWidth:0}}>
              <div style={{fontSize:14,fontWeight:600,color:"#0f172a"}}>{c.desc}</div>
              <div style={{fontSize:11,color:"#64748b",marginTop:2,lineHeight:1.4}}>{c.info}</div>
            </div>
            <div style={{display:"flex",alignItems:"center",gap:8,flexShrink:0,marginLeft:12}}>
              <span style={{fontSize:11,color:"#64748b",fontWeight:500}}>{activeFields.length} fields</span>
              <span style={{fontSize:14,color:"#94a3b8",transform:isOpen?"rotate(180deg)":"rotate(0)",transition:"transform .2s"}}>{"\u25BE"}</span>
            </div>
          </button>
          {isOpen && (<div style={{padding:"0 24px 18px"}}>
            {c.exampleName && (<div style={{marginBottom:12,padding:"8px 12px",background:"#f0f9ff",border:"1px solid #bae6fd",borderRadius:6}}>
              <span style={{fontSize:10,fontWeight:700,letterSpacing:".07em",textTransform:"uppercase",color:"#0369a1",marginRight:6}}>Example</span>
              <span style={{...mono,fontSize:11,color:"#0c4a6e",fontWeight:500}}>{c.exampleName}</span>
            </div>)}
            <div style={{marginBottom:12}}>
              <span style={{fontSize:10,fontWeight:700,letterSpacing:".07em",textTransform:"uppercase",color:"#475569",display:"block",marginBottom:6}}>Required Fields</span>
              <div style={{display:"flex",flexWrap:"wrap",gap:5}}>{activeFields.map(f=><Tag key={f}>{boolLabels[f]}</Tag>)}</div>
            </div>
            <div style={{marginBottom:12}}>
              <span style={{fontSize:10,fontWeight:700,letterSpacing:".07em",textTransform:"uppercase",color:"#475569",display:"block",marginBottom:6}}>Name Pattern</span>
              <div style={{...mono,fontSize:12,fontWeight:500,color:"#334155",background:"#f8fafc",border:"1px solid #e2e8f0",borderRadius:6,padding:"10px 12px",lineHeight:1.8,wordBreak:"break-all"}}>
                {c.customId ? (<span><Chip c="#e11d48">Custom_ID</Chip><span> _ </span><Chip c="#e11d48">Permit_Prefix</Chip><span style={{color:"#94a3b8"}}>.{c.ext}</span></span>)
                : c.componentId ? (<span>
                    {c.fpidFull && <><Chip c="#7c3aed">FPID_Full</Chip><span> - </span></>}
                    <Chip c="#0891b2">Component_ID</Chip>
                    {c.submittalSuffix && <><span> - </span><Chip c="#ca8a04">Suffix</Chip></>}
                    <span style={{color:"#94a3b8"}}>.{c.ext}</span>
                  </span>)
                : (<span>
                    {c.designId && <><Chip c="#dc2626">Design_ID</Chip><span> _ </span></>}
                    {c.fpidFull && <><Chip c="#7c3aed">FPID_Full</Chip><span> _ </span></>}
                    {c.projectId && <><Chip c="#059669">Project_ID</Chip><span> _ </span></>}
                    {c.fpidShort && <><Chip c="#7c3aed">FPID_Short</Chip><span> _ </span></>}
                    {c.title && <Chip c="#2563eb">DocName</Chip>}
                    {c.submittalSuffix && <><span> _ </span><Chip c="#ca8a04">Suffix</Chip></>}
                    {c.formattedDate && <><span> _ </span><Chip c="#9333ea">Date</Chip></>}
                    <span style={{color:"#94a3b8"}}>.{c.ext}</span>
                  </span>)}
              </div>
            </div>
            <div style={{display:"flex",gap:16,fontSize:11,color:"#64748b",flexWrap:"wrap"}}>
              <span>Separator: <strong style={{color:"#334155"}}>{c.customId||!c.componentId?"underscore ( _ )":"hyphen ( - )"}</strong></span>
              <span>Extension: <strong style={{color:"#334155"}}>.{c.ext}</strong></span>
            </div>
          </div>)}
        </div>);
      })}
    </Card>
  </>);
}

// ══════════════════════════════════════════════════════════════
//  MAIN APP
// ══════════════════════════════════════════════════════════════

export default function App(){
  const [view,setView]=useState("main");
  const [mode,setMode]=useState("generator");
  const [abbreviations,setAbbreviations]=useState(INIT_ABBREVIATIONS);
  const conventions = INIT_CONVENTIONS;

  const shell = (children) => (
    <div style={{minHeight:"100vh",background:"linear-gradient(165deg,#0c1222 0%,#162032 40%,#0c1222 100%)",fontFamily:"'DM Sans',sans-serif",display:"flex",flexDirection:"column",alignItems:"center",padding:"24px 16px 60px"}}>
      <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;600&display=swap" rel="stylesheet" />
      {children}
    </div>
  );

  if (view === "abbreviations") return shell(<AbbreviationsView navigate={setView} abbreviations={abbreviations} />);
  if (view === "conventions") return shell(<ConventionsView navigate={setView} conventions={conventions} />);

  return shell(<>
    <div style={{textAlign:"center",marginBottom:6,maxWidth:600}}>
      <div style={{display:"inline-flex",alignItems:"center",gap:8,marginBottom:8,background:"rgba(59,130,246,.1)",border:"1px solid rgba(59,130,246,.2)",borderRadius:20,padding:"4px 14px"}}>
        <span style={{fontSize:12,fontWeight:700,color:"#60a5fa",letterSpacing:".04em"}}>MI-4 Program</span>
      </div>
      <h1 style={{fontSize:24,fontWeight:700,color:"#f1f5f9",margin:"0 0 4px",letterSpacing:"-.02em"}}>File Name Tool</h1>
      <p style={{fontSize:13,color:"#64748b",margin:"0 0 12px",lineHeight:1.5}}>Generate valid file names or validate existing ones against naming conventions.</p>
      <div style={{display:"flex",justifyContent:"center",gap:20,marginBottom:16}}>
        <NavLink onClick={()=>setView("conventions")}>View Conventions</NavLink>
        <NavLink onClick={()=>setView("abbreviations")}>View Abbreviations</NavLink>
      </div>
    </div>
    <ModeToggle mode={mode} setMode={setMode} />
    {mode==="generator" && <GeneratorView abbreviations={abbreviations} conventions={conventions} />}
    {mode==="validator" && <ValidatorView conventions={conventions} />}
  </>);
}
