// ═══════ UTILITIES ═══════
const ALL_FPID_FULLS=new Set(FPIDS.map(f=>f.full));
const ALL_PROJECT_ABBRS=new Set(PROJECTS.map(p=>p.abbr));
const ALL_FPID_SHORTS=new Set(FPIDS.map(f=>f.fpid));
const ALL_COMPONENT_IDS=new Set(COMPONENTS.map(c=>c.id));
const ALL_SUFFIXES=new Set(SUBMITTAL_PHASES.map(s=>s.defaultPhase).filter(s=>s&&s!=="-"));
const ALL_PERMIT_CODES=new Set(PERMITS.map(p=>p.code));
const FIELD_MAP=Object.fromEntries(FIELDS.map(f=>[f.id,f]));
const RULES_BY_CONV={};for(const r of RULES){if(!RULES_BY_CONV[r.convention])RULES_BY_CONV[r.convention]=[];RULES_BY_CONV[r.convention].push(r)}
const _DETERMINATION=(new URLSearchParams(window.location.search)).get("determination");
const FILTERED_CONVENTIONS=_DETERMINATION?CONVENTIONS.filter(c=>c.phase===_DETERMINATION):CONVENTIONS;
const _FILTERED_IDS=new Set(FILTERED_CONVENTIONS.map(c=>c.id));
const ALL_SUBMITTAL_PREFIXES=new Set(SUBMITTAL_PHASES.map(s=>s.prefix).filter(Boolean));
const ALL_PHASE_MODS=new Set(SUBMITTAL_PHASES.flatMap(s=>s.modifiers||[]));
const DATE_RE=/^\d{4}-\d{2}-\d{2}(?!\d)/;
const EXTERNAL_FPID_RE=/^\d{6}-\d(?!\d)/;
const SEG_COLORS=["#7c3aed","#0891b2","#059669","#ca8a04","#dc2626","#2563eb","#9333ea","#e11d48"];
const SEG_EXPLAIN={"Extension":"The file extension must match the convention (.pdf, .kmz).","FPID (Full)":"An 11-digit code identifying the Financial Project ID.","FPID (Short)":"The standard FPID format (######-#) used in FDOT project tracking.","Project ID":"A short abbreviation (P1\u2013P5, PA, PB) mapped from the project name.","Deliverable ID":"A structured identifier for the plan discipline, e.g. PLANS-01-ROADWAY.","Submittal Suffix":"Indicates the submittal phase: 15pct, 30pct, 45pct, 90pct, or Final.","Submittal Prefix":"The phase prefix (PS, FS, PD, etc.) identifying the submittal stage.","Phase Modifier":"An optional modifier indicating an alternate phase milestone (e.g. 30pct, 60pct, RFC).","Submittal ID":"A 4-digit sequential number identifying the submittal (e.g. 0001).","Resubmittal ID":"A 2-digit resubmittal number (e.g. 00 for original, 01 for first resubmittal).","Document Name":"The document title, PascalCased and abbreviated per the abbreviation table.","Document Name (Sub)":"An optional sub-title appended to the document name with a hyphen.","Formatted Date":"Date in YYYY-MM-DD format.","Custom ID":"The permit number matching the selected permit type's format.","Permit Code":"The permit agency and type code (e.g. SFWMD-ERP, USACE-404).","External FPID":"A non-MI4 Financial Project ID in ######-# format.","Revision ID":"Revision number in REVnn format (e.g. REV01).","Program Prefix":"The fixed prefix \u2018MI4\u2019 identifying program-level documents.","Fixed Suffix":"The fixed suffix \u2018GuideSignWorksheets\u2019 for guide sign deliverables.","Unexpected":"Extra segments that don't belong in this convention's pattern."};

// Format string tokenizer: parses "{field}" "[" "]" and literal text
function tokenizeFormat(fmt){
  const tokens=[];let i=0;
  while(i<fmt.length){
    if(fmt[i]==="["){tokens.push({type:"opt_start"});i++;continue}
    if(fmt[i]==="]"){tokens.push({type:"opt_end"});i++;continue}
    if(fmt[i]==="{"){const end=fmt.indexOf("}",i);if(end===-1)break;tokens.push({type:"field",id:fmt.slice(i+1,end)});i=end+1;continue}
    let lit="";while(i<fmt.length&&fmt[i]!=="{"&&fmt[i]!=="["&&fmt[i]!=="]"){lit+=fmt[i];i++}
    if(lit)tokens.push({type:"literal",value:lit})
  }
  return tokens
}

const FIELD_VALIDATORS={
  projectId:{set:ALL_PROJECT_ABBRS,label:"Project ID"},
  fpid:{set:ALL_FPID_SHORTS,label:"FPID (Short)"},
  fullFpid:{set:ALL_FPID_FULLS,label:"FPID (Full)"},
  deliverableId:{set:ALL_COMPONENT_IDS,label:"Deliverable ID",longestFirst:true},
  phaseId:{set:ALL_SUFFIXES,label:"Submittal Suffix"},
  permitCode:{set:ALL_PERMIT_CODES,label:"Permit Code"},
  submittalPrefix:{set:ALL_SUBMITTAL_PREFIXES,label:"Submittal Prefix"},
  submittalId:{regex:/^\d{4}(?!\d)/,label:"Submittal ID"},
  resubmittalId:{regex:/^\d{2}(?!\d)/,label:"Resubmittal ID"},
  revisionId:{regex:/^REV\d{2}(?!\d)/,label:"Revision ID"},
  externalFpid:{regex:EXTERNAL_FPID_RE,label:"External FPID"},
  date:{regex:DATE_RE,label:"Formatted Date"},
  title:{greedy:true,label:"Document Name"},
  subtitle:{greedy:true,label:"Document Name (Sub)"},
  permitId:{greedy:true,label:"Custom ID",postValidate:true},
  phaseMod:{set:ALL_PHASE_MODS,label:"Phase Modifier"}
};

const FIELD_PLACEHOLDERS={
  projectId:"PX",fpid:"XXXXXX-X",fullFpid:"XXXXXXXXXXX",
  deliverableId:"PLANS-XX-DISCIPLINE",phaseId:"Suffix",
  permitCode:"Agency-Type",submittalPrefix:"PS",
  submittalId:"0000",resubmittalId:"00",revisionId:"REVnn",
  externalFpid:"XXXXXX-X",date:"YYYY-MM-DD",
  title:"DocName",subtitle:"SubName",permitId:"CustomID",
  phaseMod:"Mod"
};

function esc(s){return s.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;")}

function applyAbbreviations(text){
  if(!text)return"";let r=text;
  const sorted=Object.entries(ABBREVIATIONS).sort((a,b)=>b[0].length-a[0].length);
  for(const[full,abbr]of sorted){const e=full.replace(/[-\/\\^$*+?.()|[\]{}]/g,'\\$&');r=r.replace(new RegExp("\\b"+e+"\\b","gi"),abbr)}
  r=r.replace(/[()\/\\&#@!%$+=\[\]{}.;:'"]/g,"").replace(/-/g," ").replace(/,/g," ").replace(/%/g,"pct").trim().replace(/\s+/g," ");
  return r.split(" ").filter(Boolean).map(w=>{const u=[...w].filter(c=>c===c.toUpperCase()&&c!==c.toLowerCase()).length;return u>=w.length-1?w:w[0].toUpperCase()+w.slice(1).toLowerCase()}).join("")
}
function padId(v,l){const n=parseInt(v,10);return isNaN(n)||n<0?"":String(n).padStart(l,"0")}
function validatePermitId(v,rx){if(!v||!rx)return false;try{return new RegExp(rx).test(v)}catch{return false}}
function formatExternalFpid(v){const n=parseInt(v,10);if(isNaN(n)||n<0)return"";const s=String(n).padStart(7,"0");return s.slice(0,6)+"-"+s.slice(6)}
function formatRevisionId(v){const n=parseInt(v,10);if(isNaN(n)||n<=0)return"";return"REV"+String(n).padStart(2,"0")}
function _getFieldLabel(fid){return FIELD_VALIDATORS[fid]?.label||FIELD_MAP[fid]?.name||fid}
function _getFieldMetadata(fid,convRules){const f=FIELD_MAP[fid];if(!f)return{isDerived:false,isRequired:false};if(f.type==="lookup")return{isDerived:true,isRequired:null};const rule=convRules.find(r=>r.field===fid);return{isDerived:false,isRequired:rule?rule.required:false}}
function _getFieldExample(fid,exampleName,conventionId){try{const parsed=parseFilename(exampleName,conventionId);if(parsed&&parsed.segments){const lbl=_getFieldLabel(fid);const seg=parsed.segments.find(s=>s.label===lbl);if(seg&&seg.value)return seg.value}}catch(e){}return FIELD_PLACEHOLDERS[fid]||fid}
function renderPatternVisual(conv){const cont=h("div",{className:"pattern-visual"});const tokens=tokenizeFormat(conv.format);const convRules=RULES_BY_CONV[conv.id]||[];let inOpt=false;for(const t of tokens){if(t.type==="opt_start"){inOpt=true;continue}if(t.type==="opt_end"){inOpt=false;continue}if(t.type==="literal"){cont.append(h("span",{className:"pattern-literal"},t.value))}else if(t.type==="field"){const lbl=FIELD_MAP[t.id]?.name||_getFieldLabel(t.id);const valLbl=_getFieldLabel(t.id);const meta=_getFieldMetadata(t.id,convRules);let cls="pattern-segment",sty;if(meta.isDerived){cls+=" derived";sty={color:"#6d28d9",background:"rgba(109,40,217,.06)",border:"1px solid rgba(109,40,217,.15)"}}else if(inOpt||meta.isRequired===false){cls+=" optional";sty={color:"#92400e",background:"rgba(146,64,14,.06)",border:"1px dashed rgba(146,64,14,.18)"}}else{sty={color:"#2563eb",background:"rgba(37,99,235,.06)",border:"1px solid rgba(37,99,235,.13)"}}const seg=h("span",{className:cls,style:sty,title:SEG_EXPLAIN[valLbl]||lbl},lbl);cont.append(seg)}}cont.append(h("span",{className:"pattern-literal"},"."+conv.ext));return cont}
function renderPatternLegend(conv){const frag=document.createDocumentFragment();const tokens=tokenizeFormat(conv.format);const uniqueFields=[];const fieldIds=[];let optSet=new Set();let inOpt=false;for(const t of tokens){if(t.type==="opt_start"){inOpt=true;continue}if(t.type==="opt_end"){inOpt=false;continue}if(t.type==="field"){if(inOpt)optSet.add(t.id);if(!fieldIds.includes(t.id)){fieldIds.push(t.id);uniqueFields.push(t)}}}const convRules=RULES_BY_CONV[conv.id]||[];fieldIds.forEach((fid,i)=>{const lbl=FIELD_MAP[fid]?.name||_getFieldLabel(fid);const valLbl=_getFieldLabel(fid);const meta=_getFieldMetadata(fid,convRules);const dotColor=meta.isDerived?"#6d28d9":(optSet.has(fid)||meta.isRequired===false)?"#92400e":"#2563eb";const example=_getFieldExample(fid,conv.exampleName,conv.id);const desc=SEG_EXPLAIN[valLbl]||"";const row=h("div",{className:"pattern-legend-row"});row.append(h("div",{className:"color-dot",style:{backgroundColor:dotColor}}));const lblSpan=h("div",{style:{fontWeight:"600",fontSize:"11px",color:"#334155"}},lbl);row.append(lblSpan);const badgeWrap=h("div",{style:{display:"flex",gap:"4px"}});if(meta.isDerived){badgeWrap.append(h("span",{className:"field-type-badge field-type-derived"},"derived"))}else{badgeWrap.append(h("span",{className:"field-type-badge field-type-input"},"input"))}if(meta.isRequired===true){badgeWrap.append(h("span",{style:{fontSize:"9px",color:"#dc2626",fontWeight:"600"}},"*"))}row.append(badgeWrap);const descCol=h("div");if(desc){descCol.append(h("div",{className:"legend-desc"},desc))}descCol.append(h("div",{className:"legend-example"},example));row.append(descCol);frag.append(row)});return frag}

// Detection order: most specific conventions first
const _DETECT_ORDER=["kmz","guide","permit","fdot-prod-ph","fdot-prod","design","fpid-doc","fpid-doc-ext","program-doc"];
const _FILTERED_DETECT_ORDER=_DETERMINATION?_DETECT_ORDER.filter(id=>_FILTERED_IDS.has(id)):_DETECT_ORDER;
function detectConvention(fn){
  if(!fn)return null;
  // Quick extension check
  if(fn.toLowerCase().endsWith(".kmz")&&_FILTERED_IDS.has("kmz"))return"kmz";
  // Trial-parse against each convention in specificity order
  let best=null,bestScore=-1;
  for(const cid of _FILTERED_DETECT_ORDER){
    const result=parseFilename(fn,cid);
    if(!result)continue;
    const valid=result.segments.filter(s=>s.valid).length;
    if(result.overall){best=cid;bestScore=valid;break}
    if(valid>bestScore){best=cid;bestScore=valid}
  }
  return best
}

// Generic format-driven parser: matches a filename against a convention's format string
function _matchField(fid,str,pos){
  const v=FIELD_VALIDATORS[fid];if(!v)return null;
  if(v.set){
    if(v.longestFirst){const sorted=[...v.set].sort((a,b)=>b.length-a.length);for(const val of sorted)if(str.startsWith(val,pos))return{value:val,len:val.length}}
    else{for(const val of v.set)if(str.startsWith(val,pos))return{value:val,len:val.length}}
    return null
  }
  if(v.regex){const sub=str.slice(pos);const m=sub.match(v.regex);if(m&&sub.indexOf(m[0])===0)return{value:m[0],len:m[0].length};return null}
  return null
}

// Flatten format tokens into a linear sequence with optional group markers resolved
function _flattenTokens(tokens){
  const flat=[];let inOpt=false;
  for(const t of tokens){
    if(t.type==="opt_start"){inOpt=true;continue}
    if(t.type==="opt_end"){inOpt=false;continue}
    flat.push({...t,optional:inOpt})
  }
  return flat
}

// Find the position of the next non-greedy anchor after index i in flat tokens
function _findNextAnchor(flat,i,str,searchFrom){
  for(let j=i+1;j<flat.length;j++){
    const t=flat[j];
    if(t.type==="literal"){const idx=str.indexOf(t.value,searchFrom);if(idx>=searchFrom)return{pos:idx,tokenIdx:j};return null}
    if(t.type==="field"&&!FIELD_VALIDATORS[t.id]?.greedy){
      // Try to find where this field could start by scanning from searchFrom
      for(let p=searchFrom;p<str.length;p++){const m=_matchField(t.id,str,p);if(m)return{pos:p,tokenIdx:j}}
      return null
    }
  }
  return null
}

function parseFilename(fn,cid){
  const conv=CONVENTIONS.find(c=>c.id===cid);if(!conv||!fn||!conv.format)return null;
  const segs=[];let ok=true;
  const di=fn.lastIndexOf(".");const ext=di>-1?fn.slice(di+1):"";const base=di>-1?fn.slice(0,di):fn;
  const ev=ext.toLowerCase()===conv.ext.toLowerCase();
  segs.push({label:"Extension",value:"."+ext,valid:ev,expected:"."+conv.ext});if(!ev)ok=false;

  const tokens=tokenizeFormat(conv.format);
  const flat=_flattenTokens(tokens);
  let pos=0;const parsed={};let optGroupActive=[];let inOpt=false;let optStart=-1;

  // Walk through tokens tracking optional groups from original tokens
  const groups=[];let gIdx=-1;
  for(let ti=0;ti<tokens.length;ti++){
    if(tokens[ti].type==="opt_start"){gIdx=groups.length;groups.push({start:ti,tokens:[],flatStart:-1,flatEnd:-1})}
    else if(tokens[ti].type==="opt_end"&&gIdx>=0){gIdx=-1}
    else if(gIdx>=0){groups[gIdx].tokens.push(tokens[ti])}
  }

  // Try parsing with optional groups included, then without if needed
  function tryParse(str,flatTokens){
    let p=0;const result=[];const vals={};let allOk=true;
    for(let i=0;i<flatTokens.length;i++){
      const t=flatTokens[i];
      if(t.type==="literal"){
        if(str.startsWith(t.value,p)){
          // Literals that are meaningful get a segment (fixed prefix/suffix)
          const isFixedText=t.value.length>1&&!/^[_.\-]$/.test(t.value);
          if(isFixedText){
            const lbl=t.value==="GuideSignWorksheets"?"Fixed Suffix":t.value==="MI4"?"Program Prefix":"Literal";
            result.push({label:lbl,value:t.value,valid:true,expected:t.value,pos:p})
          }
          p+=t.value.length
        }else{
          if(t.optional)return null; // optional group failed
          const isFixedText=t.value.length>1&&!/^[_.\-]$/.test(t.value);
          if(isFixedText){result.push({label:"Literal",value:"(missing)",valid:false,expected:t.value,pos:p})}
          allOk=false;break
        }
      }else if(t.type==="field"){
        const v=FIELD_VALIDATORS[t.id];if(!v){p++;continue}
        const lbl=v.label||t.id;const expected=FIELD_PLACEHOLDERS[t.id]||t.id;

        if(v.greedy){
          // Find next non-optional anchor to determine boundary
          let boundary=str.length;
          for(let j=i+1;j<flatTokens.length;j++){
            const nt=flatTokens[j];
            if(nt.optional)continue;
            if(nt.type==="literal"){const li=str.lastIndexOf(nt.value,str.length);
              // Scan from right for the correct boundary
              let found=-1;
              for(let k=p;k<str.length;k++){
                if(str.startsWith(nt.value,k)){
                  // Check if remaining tokens after this literal can match
                  found=k;
                  // For greedy: use the first occurrence after current pos
                  break
                }
              }
              if(found>=p)boundary=found;
              break
            }
            if(nt.type==="field"&&!FIELD_VALIDATORS[nt.id]?.greedy){
              // Scan backwards from end to find where this field starts
              for(let k=str.length-1;k>=p;k--){
                const m=_matchField(nt.id,str,k);
                if(m){boundary=k;break}
              }
              // Also check for separator before this field
              if(i+1<flatTokens.length&&flatTokens[i+1].type==="literal"&&!flatTokens[i+1].optional){
                const sep=flatTokens[i+1].value;
                const li=str.indexOf(sep,p);
                if(li>=p)boundary=li
              }
              break
            }
          }
          const val=str.slice(p,boundary);
          // Handle title[-subtitle] pattern: if this is title and next optional group has subtitle
          vals[t.id]=val;
          const valid=val.length>0;
          result.push({label:lbl,value:val||"(missing)",valid,expected:"PascalCase abbreviated title",pos:p});
          if(!valid)allOk=false;
          p=boundary
        }else if(v.set){
          const m=_matchField(t.id,str,p);
          if(m){
            vals[t.id]=m.value;
            result.push({label:lbl,value:m.value,valid:true,expected,pos:p});
            p+=m.len
          }else{
            if(t.optional)return null; // optional group failed
            // Extract what's at this position for error reporting
            let errVal="(missing)";
            // Try to grab text until next separator
            const nextSep=str.slice(p).search(/[_.\-]/);
            if(nextSep>0)errVal=str.slice(p,p+nextSep);
            else if(p<str.length)errVal=str.slice(p);
            result.push({label:lbl,value:errVal,valid:false,expected,pos:p});
            allOk=false;
            if(nextSep>0)p+=nextSep;else break
          }
        }else if(v.regex){
          const m=_matchField(t.id,str,p);
          if(m){
            vals[t.id]=m.value;
            result.push({label:lbl,value:m.value,valid:true,expected,pos:p});
            p+=m.len
          }else{
            if(t.optional)return null; // optional group failed
            let errVal="(missing)";
            const nextSep=str.slice(p).search(/[_.\-]/);
            if(nextSep>0)errVal=str.slice(p,p+nextSep);
            else if(p<str.length)errVal=str.slice(p);
            result.push({label:lbl,value:errVal,valid:false,expected,pos:p});
            allOk=false;
            if(nextSep>0)p+=nextSep;else break
          }
        }
      }
    }
    // Check for unexpected trailing content
    if(p<str.length){
      result.push({label:"Unexpected",value:str.slice(p),valid:false,expected:"(none)",pos:p});
      allOk=false
    }
    return{segs:result,ok:allOk,vals,pos:p}
  }

  // Build flat tokens, trying optional groups included first, then excluded
  function buildAndParse(str){
    // Identify optional groups in token stream
    const optGroups=[];let depth=0;let gStart=-1;
    for(let i=0;i<tokens.length;i++){
      if(tokens[i].type==="opt_start"){if(depth===0)gStart=i;depth++}
      else if(tokens[i].type==="opt_end"){depth--;if(depth===0&&gStart>=0){optGroups.push({start:gStart,end:i});gStart=-1}}
    }
    // Try with all optional groups included
    const allFlat=_flattenTokens(tokens);
    const withAll=tryParse(str,allFlat);
    if(withAll&&withAll.ok)return withAll;
    // Try removing optional groups one at a time (from right to left)
    if(optGroups.length>0){
      for(let mask=0;mask<(1<<optGroups.length);mask++){
        const filtered=[];
        for(let i=0;i<tokens.length;i++){
          let skip=false;
          for(let g=0;g<optGroups.length;g++){
            if((mask>>g)&1){if(i>=optGroups[g].start&&i<=optGroups[g].end){skip=true;break}}
          }
          if(!skip)filtered.push(tokens[i])
        }
        const flat=_flattenTokens(filtered);
        const res=tryParse(str,flat);
        if(res&&res.ok)return res
      }
    }
    // Return best effort (with all groups)
    return withAll||{segs:[],ok:false,vals:{},pos:0}
  }

  const result=buildAndParse(base);
  // Post-parse: validate permitId against matched permitCode
  if(result.vals.permitId&&result.vals.permitCode){
    const pm=PERMITS.find(p=>p.code===result.vals.permitCode);
    const pidSeg=result.segs.find(s=>s.label==="Custom ID");
    if(pidSeg&&pm){
      const valid=validatePermitId(result.vals.permitId,pm.regex);
      pidSeg.valid=valid;
      pidSeg.expected=pm?"Format: "+pm.hint+" (e.g. "+pm.example+")":"Unknown";
      if(!valid)result.ok=false
    }
  }
  // Merge segments: parsed fields first, then extension
  const finalSegs=[...result.segs,...segs];
  return{segments:finalSegs,overall:result.ok&&ok,convention:conv}
}

function buildExpectedPattern(conv){
  if(!conv||!conv.format)return"";
  const tokens=tokenizeFormat(conv.format);let out="";let inOpt=false;
  for(const t of tokens){
    if(t.type==="opt_start"){inOpt=true;out+="(";continue}
    if(t.type==="opt_end"){inOpt=false;out+=")";continue}
    if(t.type==="literal"){out+=t.value;continue}
    if(t.type==="field"){out+=FIELD_PLACEHOLDERS[t.id]||t.id}
  }
  return out+"."+conv.ext
}

// ═══════ STATE ═══════
let state={view:"main",mode:"generator",convention:FILTERED_CONVENTIONS.length===1?FILTERED_CONVENTIONS[0].id:"",title:"",subTitle:"",fpidShort:"",project:"",component:"",submittalPhase:"",phaseMod:"",submittalIdRaw:"",isResubmittal:false,resubmittalIdRaw:"",formattedDate:"",customIdFormat:"",customIdValue:"",externalFpidRaw:"",revisionIdRaw:"",valFilename:"",valConvOverride:"",valExpandedSeg:null,abbrSearch:"",convExpanded:null,acFocused:false,acHighlightIdx:-1,copied:false,patternCopied:false};

let _restoring=false;
function setState(patch){
  const app=document.getElementById("app");const ae=document.activeElement;let fi=-1,ss=-1,se=-1,tag="";
  if(ae&&app&&app.contains(ae)){tag=ae.tagName;const all=[...app.querySelectorAll("input,select,textarea")];fi=all.indexOf(ae);if(typeof ae.selectionStart==="number"){try{ss=ae.selectionStart;se=ae.selectionEnd}catch(e){}}}
  Object.assign(state,patch);_restoring=true;render();
  if(fi>-1&&tag!=="SELECT"){const all=[...app.querySelectorAll("input,select,textarea")];const el=all[fi];if(el&&el.tagName===tag){el.focus();if(ss>-1&&typeof el.selectionStart==="number"){try{el.setSelectionRange(ss,se)}catch(e){}}}}
  _restoring=false;
}

// ═══════ RENDER ENGINE ═══════
function h(tag,attrs,...children){
  const el=document.createElement(tag);
  if(attrs)for(const[k,v]of Object.entries(attrs)){
    if(k==="className")el.className=v;
    else if(k.startsWith("on")){el.addEventListener(k.slice(2).toLowerCase(),v)}
    else if(k==="style"&&typeof v==="object"){Object.assign(el.style,v)}
    else el.setAttribute(k,v)
  }
  for(const c of children.flat()){if(c==null||c===false)continue;el.append(typeof c==="string"||typeof c==="number"?document.createTextNode(String(c)):c)}
  return el
}

function selectEl(label,hint,value,onChange,placeholder,options){
  const wrap=h("div",{className:"mb14"});
  const lbl=h("label",{className:"lbl"},h("span",{className:"lbl-text"},label),hint?h("span",{className:"lbl-hint"},hint):null);
  const sel=h("select",{className:"inp"+(value?"":" empty"),onChange:e=>{onChange(e.target.value)}});
  sel.append(h("option",{value:""},placeholder||"Select\u2026"));
  for(const o of options){const opt=h("option",{value:o.value},o.label);if(o.value===value)opt.selected=true;sel.append(opt)}
  if(value)sel.classList.remove("empty");
  wrap.append(lbl,sel);return wrap
}

function inputEl(label,hint,value,onChange,placeholder,attrs){
  const wrap=h("div",{className:"mb14"});
  const lbl=h("label",{className:"lbl"},h("span",{className:"lbl-text"},label),hint?h("span",{className:"lbl-hint"},hint):null);
  const inp=h("input",{className:"inp",type:"text",value,placeholder:placeholder||"",...(attrs||{}),onInput:e=>onChange(e.target.value)});
  wrap.append(lbl,inp);return wrap
}

function autocompleteEl(label,hint,value,onChange,placeholder,suggestions){
  const wrap=h("div",{className:"autocomplete-wrap"});
  const lbl=h("label",{className:"lbl"},h("span",{className:"lbl-text"},label),hint?h("span",{className:"lbl-hint"},hint):null);
  const q=value?value.toLowerCase():"";
  const filtered=q?suggestions.filter(s=>s.toLowerCase().includes(q)).slice(0,8):[];
  const inp=h("input",{className:"inp",type:"text",value,placeholder:placeholder||"",autocomplete:"off",
    onInput:e=>onChange(e.target.value),
    onFocus:()=>{if(!_restoring&&!state.acFocused)setState({acFocused:true,acHighlightIdx:-1})},
    onBlur:()=>{if(!_restoring)setTimeout(()=>{if(state.acFocused)setState({acFocused:false,acHighlightIdx:-1})},200)},
    onKeydown:e=>{if(!state.acFocused||!filtered.length)return;if(e.key==="ArrowDown"){e.preventDefault();setState({acHighlightIdx:Math.min(state.acHighlightIdx+1,filtered.length-1)})}else if(e.key==="ArrowUp"){e.preventDefault();setState({acHighlightIdx:Math.max(state.acHighlightIdx-1,0)})}else if(e.key==="Enter"&&state.acHighlightIdx>=0){e.preventDefault();onChange(filtered[state.acHighlightIdx]);setState({acFocused:false,acHighlightIdx:-1})}else if(e.key==="Escape"){setState({acFocused:false,acHighlightIdx:-1})}}
  });
  wrap.append(lbl,inp);
  if(state.acFocused&&filtered.length>0){
    const drop=h("div",{className:"autocomplete-drop"});
    filtered.forEach((s,i)=>{
      const item=h("div",{className:"autocomplete-item"+(i===state.acHighlightIdx?" hl":""),
        onMousedown:e=>{e.preventDefault();onChange(s);setState({acFocused:false,acHighlightIdx:-1})}});
      if(q){const li=s.toLowerCase().indexOf(q);if(li>-1){item.append(document.createTextNode(s.slice(0,li)),h("strong",{style:{color:"#2563eb"}},s.slice(li,li+q.length)),document.createTextNode(s.slice(li+q.length)))}else item.append(s)}else item.append(s);
      drop.append(item)
    });
    wrap.append(drop)
  }
  return wrap
}

function fieldTag(label,filled){
  const sp=h("span",{className:"field-tag "+(filled?"done":"pending")});
  if(filled)sp.append("\u2713 ");sp.append(label);return sp
}

// ═══════ GENERATOR ═══════
// Resolve a format field ID to its output value from current state
function _resolveField(fid,st){
  const fd=FIELD_MAP[fid];if(!fd)return"";
  if(fd.type==="lookup"){
    const src=fd.source==="FPIDS"?FPIDS:fd.source==="PROJECTS"?PROJECTS:fd.source==="COMPONENTS"?COMPONENTS:fd.source==="SUBMITTAL_PHASES"?SUBMITTAL_PHASES:fd.source==="PERMITS"?PERMITS:[];
    const viaVal=_resolveField(fd.via,st);if(!viaVal)return"";
    const rec=src.find(r=>r[fd.sourceKey]===viaVal);
    return rec?String(rec[fd.returns]||""):""
  }
  // Map field IDs to state keys
  if(fid==="title")return applyAbbreviations(st.title||"");
  if(fid==="subtitle")return applyAbbreviations(st.subTitle||"");
  if(fid==="fpid")return st.fpidShort||"";
  if(fid==="project")return st.project||"";
  if(fid==="deliverable")return st.component||"";
  if(fid==="permit")return st.customIdFormat||"";
  if(fid==="permitId")return st.customIdValue||"";
  if(fid==="submittal")return st.submittalPhase||"";
  if(fid==="phaseMod")return st.phaseMod||"";
  if(fid==="submittalId")return padId(st.submittalIdRaw,4);
  if(fid==="resubmittalId")return st.isResubmittal?padId(st.resubmittalIdRaw,2):"00";
  if(fid==="revisionId")return formatRevisionId(st.revisionIdRaw);
  if(fid==="externalFpid")return formatExternalFpid(st.externalFpidRaw);
  if(fid==="date")return st.formattedDate||"";
  return""
}

// Generate filename from format string and current state
function generateFilename(conv,st){
  if(!conv||!conv.format)return"";
  const tokens=tokenizeFormat(conv.format);let out="";let inOpt=false;let optBuf="";let optField="";
  for(const t of tokens){
    if(t.type==="opt_start"){inOpt=true;optBuf="";optField="";continue}
    if(t.type==="opt_end"){
      if(optField&&_resolveField(optField,st))out+=optBuf;
      inOpt=false;continue
    }
    if(t.type==="literal"){if(inOpt)optBuf+=t.value;else out+=t.value;continue}
    if(t.type==="field"){
      const val=_resolveField(t.id,st);
      if(inOpt){optField=t.id;optBuf+=val}
      else{if(!val)return"";out+=val}
    }
  }
  return out?out+"."+conv.ext:""
}

let _prevConvention="";
function renderGenerator(){
  const {convention:cid}=state;const conv=FILTERED_CONVENTIONS.find(c=>c.id===cid)||null;
  const _convChanged=cid!==_prevConvention;_prevConvention=cid;
  const frag=document.createDocumentFragment();

  // Convention dropdown
  const convWrap=h("div",{style:{padding:"18px 24px 12px"}});
  convWrap.append(selectEl("Convention","naming pattern",cid,v=>{setState({convention:v,title:"",subTitle:"",fpidShort:"",project:"",component:"",submittalPhase:"",phaseMod:"",submittalIdRaw:"",isResubmittal:false,resubmittalIdRaw:"",formattedDate:"",customIdFormat:"",customIdValue:"",externalFpidRaw:"",revisionIdRaw:""})},
    "Choose a naming convention...",FILTERED_CONVENTIONS.map(c=>({value:c.id,label:c.desc}))));
  frag.append(convWrap);

  if(!conv)return frag;

  // Derive field requirements from RULES
  const convRules=RULES_BY_CONV[cid]||[];
  const ruleMap={};for(const r of convRules)ruleMap[r.field]={required:r.required};
  const hasField=fid=>fid in ruleMap;
  const hasFpid=hasField("fpid");
  const hasProject=hasField("project");
  const hasFullFpid=hasField("fullFpid");

  // Resolve values for field status and filename generation
  const resolvedPermit=PERMITS.find(p=>p.name===state.customIdFormat)||null;
  const customIdValid=hasField("permitId")&&state.customIdFormat&&state.customIdValue&&resolvedPermit?validatePermitId(state.customIdValue,resolvedPermit.regex):null;

  // Field status (required + optional input fields only)
  const fs={};
  for(const r of convRules){
    if(r.required===undefined)continue; // skip lookups
    const fid=r.field;const fd=FIELD_MAP[fid];if(!fd)continue;
    const lbl=fd.name;
    if(fid==="title")fs[lbl]=!!state.title.trim();
    else if(fid==="subtitle")continue; // optional, shown with title
    else if(fid==="fpid")fs[hasFullFpid?"FPID":"FPID (Short)"]=!!state.fpidShort;
    else if(fid==="project")fs["Project"]=!!state.project;
    else if(fid==="deliverable")fs["Deliverable"]=!!state.component;
    else if(fid==="submittal")fs["Submittal Phase"]=!!state.submittalPhase;
    else if(fid==="submittalId")fs["Submittal ID"]=!!padId(state.submittalIdRaw,4);
    else if(fid==="resubmittalId")continue; // optional, shown with submittalId
    else if(fid==="revisionId")continue; // optional
    else if(fid==="date")fs["Date"]=!!state.formattedDate.trim();
    else if(fid==="permit")fs["Permit Type"]=!!state.customIdFormat;
    else if(fid==="permitId")fs["Permit ID"]=!!(state.customIdValue&&customIdValid!==false);
    else if(fid==="externalFpid")fs["External FPID"]=!!formatExternalFpid(state.externalFpidRaw);
  }
  const isValid=Object.values(fs).length>0&&Object.values(fs).every(Boolean);
  const filledCount=Object.values(fs).filter(Boolean).length;
  const totalCount=Object.values(fs).length;

  // Generate filename using format string
  const generatedName=generateFilename(conv,state);

  // Fields section
  const fields=h("div",{style:{padding:"16px 24px 20px",borderTop:"1px solid #edf0f4"}});
  const inner=h("div",_convChanged?{className:"fade-in"}:{});

  // Info card
  if(conv.info){
    const ic=h("div",{className:"info-card"},h("div",{className:"desc"},conv.info));
    if(conv.exampleName)ic.append(h("div",{className:"example"},"Example: ",h("span",{className:"mono",style:{fontWeight:"500",color:"#475569"}},conv.exampleName)));
    inner.append(ic)
  }

  // Field tags
  const tagRow=h("div",{style:{display:"flex",flexWrap:"wrap",gap:"5px",marginBottom:"14px"}});
  for(const[label,filled]of Object.entries(fs))tagRow.append(fieldTag(label,filled));
  inner.append(tagRow);

  // Render fields based on RULES (iterate in rules order, skip lookups)
  const rendered=new Set();
  for(const r of convRules){
    if(r.required===undefined)continue;
    if(rendered.has(r.field))continue;
    const fid=r.field;rendered.add(fid);

    if(fid==="title"){
      rendered.add("subtitle");
      const row=h("div",{className:"grid2"});
      row.append(autocompleteEl("Title","auto-abbreviated",state.title,v=>setState({title:v}),"e.g. Pavement Design Report",TITLE_SUGGESTIONS));
      if(hasField("subtitle"))row.append(inputEl("Sub-Title","optional",state.subTitle,v=>setState({subTitle:v}),"e.g. Segment 1"));
      inner.append(row)
    }
    else if(fid==="externalFpid"){
      const efFormatted=formatExternalFpid(state.externalFpidRaw);
      inner.append(inputEl("External FPID",efFormatted?"\u2192 "+efFormatted:"1-7 digit number \u2192 ######-#",state.externalFpidRaw,v=>setState({externalFpidRaw:v.replace(/\D/g,"")}),"e.g. 2012103",{maxLength:"7",inputMode:"numeric"}))
    }
    else if(fid==="fpid"){
      const filteredFpids=state.project?FPIDS.filter(f=>f.project===state.project):FPIDS;
      inner.append(selectEl(hasFullFpid?"FPID":"FPID (Short)",hasFullFpid?"resolves full FPID + project":"short format",
        state.fpidShort,v=>{const f=FPIDS.find(fp=>fp.fpid===v);setState({fpidShort:v,project:f?f.project:state.project})},
        "Select FPID...",filteredFpids.map(f=>({value:f.fpid,label:f.fpid+" \u2014 "+f.desc}))));
      if(state.fpidShort){
        const f=FPIDS.find(fp=>fp.fpid===state.fpidShort);
        if(f){const p=PROJECTS.find(pr=>pr.name===f.project);
          const fc=h("div",{className:"fpid-card"},
            h("span",null,h("strong",null,"Project: "),f.project+(p?" ("+p.abbr+")":"")),
            hasFullFpid?h("span",null,h("strong",null,"Full FPID: "),h("span",{className:"mono"},f.full)):null,
            h("span",{style:{color:"#64748b",fontStyle:"italic",flex:"1",minWidth:"150px"}},f.desc));
          inner.append(fc)
        }
      }
    }
    else if(fid==="project"){
      inner.append(selectEl("Project","maps to abbreviation",state.project,v=>setState({project:v}),"Select project...",PROJECTS.map(p=>({value:p.name,label:p.name+" ("+p.abbr+")"}))));
    }
    else if(fid==="submittal"){
      // For design convention, submittal has prefix (only show phases with prefix)
      const isDesign=hasField("submittalId");
      const phases=isDesign?SUBMITTAL_PHASES.filter(s=>s.prefix):SUBMITTAL_PHASES;
      inner.append(selectEl("Submittal Phase",isDesign?"prefix for Design ID":"phase",state.submittalPhase,v=>setState({submittalPhase:v,phaseMod:""}),"Select phase...",phases.map(s=>({value:s.desc,label:s.desc+((!isDesign&&s.defaultPhase&&s.defaultPhase!=="-")?" \u2192 "+s.defaultPhase:"")}))));
    }
    else if(fid==="phaseMod"){
      const selPhase=SUBMITTAL_PHASES.find(s=>s.desc===state.submittalPhase);
      if(selPhase&&selPhase.modifiers&&selPhase.modifiers.length>0){
        inner.append(selectEl("Phase Modifier","optional",state.phaseMod,v=>setState({phaseMod:v}),"No modifier",selPhase.modifiers.map(m=>({value:m,label:m}))));
      }
    }
    else if(fid==="submittalId"){
      rendered.add("resubmittalId");
      const submittalId=padId(state.submittalIdRaw,4);
      const resubmittalId=state.isResubmittal?padId(state.resubmittalIdRaw,2):"00";
      const row=h("div",{className:"grid2",style:{alignItems:"start"}});
      row.append(inputEl("Submittal ID",submittalId?"\u2192 "+submittalId:"integer \u2192 0000",state.submittalIdRaw,v=>setState({submittalIdRaw:v.replace(/\D/g,"")}),"e.g. 1",{maxLength:"4",inputMode:"numeric"}));
      if(hasField("resubmittalId")){
        const rw=h("div",{className:"mb14"});
        rw.append(h("label",{className:"lbl"},h("span",{className:"lbl-text"},"Resubmittal"),h("span",{className:"lbl-hint"},state.isResubmittal&&resubmittalId?"\u2192 "+resubmittalId:"defaults to 00")));
        const rd=h("div",{style:{display:"flex",alignItems:"center",gap:"10px",minHeight:"38px"}});
        const cb=h("input",{type:"checkbox",style:{width:"16px",height:"16px",accentColor:"#2563eb",cursor:"pointer"},onChange:e=>setState({isResubmittal:e.target.checked,resubmittalIdRaw:e.target.checked?state.resubmittalIdRaw:""})});
        cb.checked=state.isResubmittal;
        rd.append(h("label",{style:{display:"flex",alignItems:"center",gap:"6px",cursor:"pointer",fontSize:"13px",color:"#475569",userSelect:"none"}},cb,"Resub?"));
        if(state.isResubmittal){const ri=h("input",{className:"inp",type:"text",inputMode:"numeric",maxLength:"2",value:state.resubmittalIdRaw,placeholder:"e.g. 1",style:{flex:"1"},onInput:e=>setState({resubmittalIdRaw:e.target.value.replace(/\D/g,"")})});rd.append(ri)}
        else rd.append(h("span",{className:"mono",style:{fontSize:"13px",color:"#94a3b8"}},"00"));
        rw.append(rd);row.append(rw)
      }
      inner.append(row);
      // Design ID preview
      const resolvedProjectAbbr=_resolveField("projectId",state);
      const resolvedPrefix=_resolveField("submittalPrefix",state);
      if(resolvedProjectAbbr&&resolvedPrefix&&submittalId){
        const designIdStr=resolvedProjectAbbr+"-"+submittalId+"."+resubmittalId+"-"+resolvedPrefix;
        inner.append(h("div",{className:"design-preview"},h("strong",null,"Design ID preview: "),h("span",{className:"mono",style:{fontSize:"12px",fontWeight:"600",color:"#4c1d95"}},designIdStr)))
      }
    }
    else if(fid==="deliverable"){
      inner.append(selectEl("Deliverable","plan discipline",state.component,v=>setState({component:v}),"Select component...",COMPONENTS.map(c=>({value:c.name,label:c.name}))));
    }
    else if(fid==="revisionId"){
      const rvFormatted=formatRevisionId(state.revisionIdRaw);
      inner.append(inputEl("Revision ID",rvFormatted?"\u2192 "+rvFormatted:"optional, integer \u2192 REV00",state.revisionIdRaw,v=>setState({revisionIdRaw:v.replace(/\D/g,"")}),"e.g. 1",{maxLength:"2",inputMode:"numeric"}))
    }
    else if(fid==="permit"){
      inner.append(selectEl("Permit Type","permit agency",state.customIdFormat,v=>setState({customIdFormat:v,customIdValue:""}),"Select permit type...",PERMITS.map(p=>({value:p.name,label:p.name+" \u2014 format: "+p.hint}))));
      if(state.customIdFormat&&resolvedPermit){
        inner.append(h("div",{className:"permit-info"},h("div",{style:{marginBottom:"3px"}},h("strong",null,"Format: "),resolvedPermit.mask),h("div",null,h("strong",null,"Example: "),h("span",{className:"mono",style:{fontWeight:"600"}},resolvedPermit.example))))
      }
    }
    else if(fid==="permitId"){
      if(state.customIdFormat&&resolvedPermit){
        const pw=h("div",{className:"mb14"});
        pw.append(h("label",{className:"lbl"},h("span",{className:"lbl-text"},"Permit ID"),h("span",{className:"lbl-hint"},"format: "+resolvedPermit.hint)));
        const pi=h("input",{className:"inp mono",type:"text",value:state.customIdValue,placeholder:resolvedPermit.example,
          style:{borderColor:state.customIdValue?(customIdValid?"#22c55e":"#ef4444"):"#d1d5db"},
          onInput:e=>setState({customIdValue:e.target.value})});
        pw.append(pi);
        if(state.customIdValue&&customIdValid===false)pw.append(h("div",{style:{marginTop:"4px",fontSize:"11px",color:"#ef4444",fontWeight:"500"}},"\u26A0\uFE0F Does not match expected format ("+resolvedPermit.hint+")"));
        if(state.customIdValue&&customIdValid===true)pw.append(h("div",{style:{marginTop:"4px",fontSize:"11px",color:"#16a34a",fontWeight:"500"}},"\u2713 Valid "+state.customIdFormat.replace("Permit ","")+" ID"));
        inner.append(pw)
      }
    }
    else if(fid==="date"){
      const dw=h("div",{className:"mb14"});
      dw.append(h("label",{className:"lbl"},h("span",{className:"lbl-text"},"Date"),h("span",{className:"lbl-hint"},state.formattedDate||"YYYY-MM-DD")));
      const dr=h("div",{style:{display:"flex",gap:"8px",alignItems:"center"}});
      dr.append(h("input",{className:"inp",type:"date",value:state.formattedDate,style:{flex:"1"},onInput:e=>setState({formattedDate:e.target.value})}));
      dr.append(h("button",{className:"sm-btn",style:{color:"#2563eb",background:"rgba(37,99,235,.07)",borderColor:"rgba(37,99,235,.18)",whiteSpace:"nowrap"},onClick:()=>setState({formattedDate:new Date().toLocaleDateString("en-CA")})},"Today"));
      dw.append(dr);inner.append(dw)
    }
  }

  fields.append(inner);frag.append(fields);

  // Output
  const outBg=isValid?"linear-gradient(135deg,#f0fdf4,#ecfdf5)":generatedName?"#fffbeb":"#f9fafb";
  const out=h("div",{style:{borderTop:"1px solid #edf0f4",background:outBg,padding:"14px 24px 18px"}});
  const hdr=h("div",{style:{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:"8px"}});
  const hdrL=h("div",{style:{display:"flex",alignItems:"center",gap:"8px"}});
  hdrL.append(h("span",{style:{fontSize:"11px",fontWeight:"700",letterSpacing:".07em",textTransform:"uppercase",color:isValid?"#166534":generatedName?"#92400e":"#94a3b8"}},"Generated File Name"));
  if(totalCount>0)hdrL.append(h("span",{style:{fontSize:"10px",fontWeight:"600",color:isValid?"#166534":"#92400e",background:isValid?"#dcfce7":"#fef3c7",border:"1px solid "+(isValid?"#bbf7d0":"#fde68a"),borderRadius:"10px",padding:"1px 8px"}},isValid?"\u2713 Valid":filledCount+"/"+totalCount));
  const hdrR=h("div",{style:{display:"flex",gap:"6px"}});
  hdrR.append(h("button",{className:"sm-btn",style:{color:"#64748b",background:"transparent",borderColor:"#d1d5db"},onClick:()=>setState({convention:"",title:"",subTitle:"",fpidShort:"",project:"",component:"",submittalPhase:"",phaseMod:"",submittalIdRaw:"",isResubmittal:false,resubmittalIdRaw:"",formattedDate:"",customIdFormat:"",customIdValue:"",externalFpidRaw:"",revisionIdRaw:"",copied:false})},"Reset"));
  if(isValid&&generatedName){
    hdrR.append(h("button",{className:"sm-btn",style:{color:state.copied?"#16a34a":"#2563eb",background:state.copied?"rgba(22,163,74,.07)":"rgba(37,99,235,.07)",borderColor:state.copied?"rgba(22,163,74,.18)":"rgba(37,99,235,.18)"},onClick:()=>{navigator.clipboard.writeText(generatedName);setState({copied:true});setTimeout(()=>setState({copied:false}),1800)}},state.copied?"\u2713 Copied":"Copy"))
  }
  hdr.append(hdrL,hdrR);out.append(hdr);
  out.append(h("div",{className:"output-box",style:{color:isValid?"#0f172a":generatedName?"#92400e":"#94a3b8",border:"1.5px solid "+(isValid?"#86efac":generatedName?"#fde68a":"#e2e8f0"),cursor:generatedName?"pointer":"default"},title:generatedName?"Click to copy":"",onClick:()=>{if(generatedName){navigator.clipboard.writeText(generatedName);setState({copied:true});setTimeout(()=>setState({copied:false}),1800)}}},generatedName||"Fill in the required fields above..."));
  if(generatedName){
    const meta=h("div",{style:{marginTop:"6px",display:"flex",alignItems:"center",gap:"8px",flexWrap:"wrap"}});
    meta.append(h("span",{style:{fontSize:"10px",fontWeight:"700",letterSpacing:".06em",textTransform:"uppercase",color:"#475569",background:"#e2e8f0",borderRadius:"4px",padding:"2px 8px",display:"inline-block"}},"."+conv.ext));
    if(!isValid)meta.append(h("span",{style:{fontSize:"11px",color:"#b45309",fontWeight:"500"}},"\u2014 missing required fields"));
    out.append(meta)
  }
  frag.append(out);
  return frag
}

// ═══════ VALIDATOR ═══════
function renderValidator(){
  const frag=document.createDocumentFragment();
  const {valFilename:fn,valConvOverride:co,valExpandedSeg:es}=state;
  const detected=fn.trim()?detectConvention(fn.trim()):null;
  const activeId=co||detected;const activeConv=FILTERED_CONVENTIONS.find(c=>c.id===activeId)||null;
  const result=fn.trim()&&activeId?parseFilename(fn.trim(),activeId):null;
  const passCount=result?result.segments.filter(s=>s.valid).length:0;
  const totalSegs=result?result.segments.length:0;

  const top=h("div",{style:{padding:"18px 24px 14px"}});
  const fnWrap=h("div",{className:"mb14"});
  fnWrap.append(h("label",{className:"lbl"},h("span",{className:"lbl-text"},"File Name to Validate"),h("span",{className:"lbl-hint"},"paste or type a full filename")));
  fnWrap.append(h("input",{className:"inp inp-mono",type:"text",value:fn,placeholder:"e.g. 43145625201-PLANS-01-ROADWAY-90pct.pdf",onInput:e=>setState({valFilename:e.target.value})}));
  top.append(fnWrap);
  top.append(selectEl("Convention",detected&&!co?"auto-detected":co?"manual override":"",co,v=>setState({valConvOverride:v}),
    detected?FILTERED_CONVENTIONS.find(c=>c.id===detected)?.desc+" (auto-detected)":"Paste a filename first...",
    FILTERED_CONVENTIONS.map(c=>({value:c.id,label:c.desc}))));
  if(fn.trim()&&!activeId)top.append(h("div",{style:{padding:"12px 16px",background:"#fffbeb",border:"1px solid #fde68a",borderRadius:"8px",marginBottom:"14px"}},
    h("div",{style:{fontSize:"12px",fontWeight:"600",color:"#92400e"}},"\u26A0\uFE0F Could not auto-detect convention"),
    h("div",{style:{fontSize:"11px",color:"#a16207",marginTop:"2px"}},"Select a convention manually to validate against.")));
  frag.append(top);

  if(result){
    const resWrap=h("div",{style:{borderTop:"1px solid #edf0f4"}});
    // Status banner
    const banner=h("div",{style:{padding:"12px 24px",background:result.overall?"linear-gradient(135deg,#f0fdf4,#ecfdf5)":"linear-gradient(135deg,#fef2f2,#fff1f2)",display:"flex",alignItems:"center",justifyContent:"space-between",flexWrap:"wrap",gap:"8px"}});
    const bL=h("div",{style:{display:"flex",alignItems:"center",gap:"10px"}});
    bL.append(h("span",{style:{fontSize:"20px",width:"32px",height:"32px",borderRadius:"50%",display:"flex",alignItems:"center",justifyContent:"center",background:result.overall?"#dcfce7":"#fecaca",border:"2px solid "+(result.overall?"#86efac":"#fca5a5"),flexShrink:"0"}},result.overall?"\u2713":"\u2717"));
    bL.append(h("div",null,h("div",{style:{fontSize:"14px",fontWeight:"700",color:result.overall?"#166534":"#991b1b"}},result.overall?"Valid File Name":"Invalid File Name"),
      h("div",{style:{fontSize:"11px",color:result.overall?"#15803d":"#b91c1c"}},passCount+"/"+totalSegs+" segments passed \u00B7 "+activeConv?.desc)));
    const bR=h("div",{style:{display:"flex",gap:"6px",alignItems:"center"}});
    if(detected&&!co)bR.append(h("span",{style:{fontSize:"10px",fontWeight:"600",color:"#6366f1",background:"rgba(99,102,241,.08)",border:"1px solid rgba(99,102,241,.18)",borderRadius:"4px",padding:"2px 8px",textTransform:"uppercase"}},"Auto-detected"));
    if(!result.overall)bR.append(h("button",{className:"sm-btn",style:{color:state.patternCopied?"#16a34a":"#7c3aed",background:state.patternCopied?"rgba(22,163,74,.07)":"rgba(124,58,237,.06)",borderColor:state.patternCopied?"rgba(22,163,74,.18)":"rgba(124,58,237,.18)"},onClick:()=>{navigator.clipboard.writeText(buildExpectedPattern(activeConv));setState({patternCopied:true});setTimeout(()=>setState({patternCopied:false}),1800)}},state.patternCopied?"\u2713 Copied":"Copy Pattern"));
    banner.append(bL,bR);resWrap.append(banner);

    // Parsed structure bar
    const psBar=h("div",{style:{padding:"12px 24px",borderBottom:"1px solid #edf0f4",background:"#fafafa"}});
    psBar.append(h("div",{style:{fontSize:"10px",fontWeight:"700",letterSpacing:".07em",textTransform:"uppercase",color:"#475569",marginBottom:"6px"}},"Parsed Structure"));
    const psLine=h("div",{className:"mono",style:{fontSize:"12px",lineHeight:"2",wordBreak:"break-all"}});
    const nonExt=result.segments.filter(s=>s.label!=="Extension");
    const valBase=fn.trim().slice(0,fn.trim().lastIndexOf("."));
    nonExt.forEach((seg,i)=>{
      const color=SEG_COLORS[i%SEG_COLORS.length];
      if(i>0){const prev=nonExt[i-1];const prevEnd=prev.pos!=null&&prev.value!=="(missing)"?prev.pos+prev.value.length:null;const sep=prevEnd!=null&&seg.pos!=null?valBase.slice(prevEnd,seg.pos):null;if(sep)psLine.append(h("span",{style:{color:"#94a3b8",margin:"0 1px"}},sep))}
      psLine.append(h("span",{style:{color:seg.valid?color:"#dc2626",background:seg.valid?color+"0d":"#fef2f2",border:"1px solid "+(seg.valid?color+"30":"#fca5a5"),borderRadius:"3px",padding:"1px 4px",cursor:"pointer",textDecoration:seg.valid?"none":"wavy underline #ef4444"},title:"Click: "+seg.label,onClick:()=>setState({valExpandedSeg:state.valExpandedSeg===i?null:i})},seg.value))
    });
    const extSeg=result.segments.find(s=>s.label==="Extension");
    if(extSeg)psLine.append(h("span",{style:{color:extSeg.valid?"#64748b":"#dc2626"}},extSeg.value));
    psBar.append(psLine);resWrap.append(psBar);

    // Segment cards
    const segWrap=h("div",{style:{padding:"12px 24px 20px"}});
    segWrap.append(h("div",{style:{fontSize:"10px",fontWeight:"700",letterSpacing:".07em",textTransform:"uppercase",color:"#475569",marginBottom:"10px"}},"Segment Analysis ",h("span",{style:{fontWeight:"400",textTransform:"none",letterSpacing:"0",color:"#94a3b8"}},"\u2014 click any segment for details")));
    const segList=h("div",{style:{display:"flex",flexDirection:"column",gap:"6px"}});
    result.segments.forEach((seg,i)=>{
      const color=seg.label==="Extension"?(seg.valid?"#64748b":"#dc2626"):SEG_COLORS[i%SEG_COLORS.length];
      const isExp=es===i;
      const card=h("div",{className:"seg-card "+(seg.valid?"pass":"fail"),style:{boxShadow:isExp?"0 2px 8px rgba(0,0,0,.08)":"none"},onClick:()=>setState({valExpandedSeg:isExp?null:i})});
      card.append(h("span",{style:{fontSize:"14px",marginTop:"1px",color:seg.valid?"#16a34a":"#dc2626"}},seg.valid?"\u2713":"\u2717"));
      const body=h("div",null);
      const hdr=h("div",{style:{display:"flex",alignItems:"center",gap:"8px",marginBottom:"2px"}});
      hdr.append(h("span",{style:{fontSize:"11px",fontWeight:"700",color:seg.valid?"#166534":"#991b1b",textTransform:"uppercase",letterSpacing:".04em"}},seg.label));
      hdr.append(h("span",{style:{width:"8px",height:"8px",borderRadius:"50%",background:color,flexShrink:"0",opacity:".7",display:"inline-block"}}));
      body.append(hdr);
      body.append(h("div",{className:"mono",style:{fontSize:"12px",color:seg.valid?"#15803d":"#b91c1c",fontWeight:"500",wordBreak:"break-all"}},seg.value));
      if(!seg.valid)body.append(h("div",{style:{fontSize:"11px",color:"#64748b",marginTop:"3px"}},"Expected: ",h("span",{className:"mono",style:{fontSize:"11px",color:"#475569"}},seg.expected)));
      if(seg.details)body.append(h("div",{style:{fontSize:"11px",color:"#64748b",marginTop:"2px"}},seg.details));
      if(isExp&&SEG_EXPLAIN[seg.label])body.append(h("div",{className:"seg-explain",style:{borderLeftColor:color}},SEG_EXPLAIN[seg.label]));
      card.append(body);segList.append(card)
    });
    segWrap.append(segList);resWrap.append(segWrap);

    // Comparison
    if(!result.overall){
      const cmp=h("div",{style:{borderTop:"1px solid #edf0f4",padding:"14px 24px 18px",background:"#f8fafc"}});
      cmp.append(h("div",{style:{fontSize:"10px",fontWeight:"700",letterSpacing:".07em",textTransform:"uppercase",color:"#475569",marginBottom:"10px"}},"Comparison"));
      const grid=h("div",{className:"grid2",style:{gap:"12px"}});
      const left=h("div",null,h("div",{style:{fontSize:"10px",fontWeight:"600",color:"#991b1b",textTransform:"uppercase",letterSpacing:".05em",marginBottom:"5px"}},"Entered"),
        h("div",{className:"mono",style:{fontSize:"11px",fontWeight:"500",color:"#b91c1c",wordBreak:"break-all",background:"#fff",border:"1.5px solid #fca5a5",borderRadius:"6px",padding:"9px 10px",lineHeight:"1.5"}},fn));
      const right=h("div",null,h("div",{style:{fontSize:"10px",fontWeight:"600",color:"#166534",textTransform:"uppercase",letterSpacing:".05em",marginBottom:"5px"}},"Expected Pattern"),
        h("div",{className:"mono",style:{fontSize:"11px",fontWeight:"500",color:"#15803d",wordBreak:"break-all",background:"#fff",border:"1.5px solid #86efac",borderRadius:"6px",padding:"9px 10px",lineHeight:"1.5"}},buildExpectedPattern(activeConv)));
      grid.append(left,right);cmp.append(grid);resWrap.append(cmp)
    }
    frag.append(resWrap)
  }

  if(!result&&!fn.trim()){
    frag.append(h("div",{style:{borderTop:"1px solid #edf0f4",padding:"32px 24px",textAlign:"center"}},
      h("div",{style:{fontSize:"32px",marginBottom:"8px",opacity:".4"}},"\uD83D\uDD0D"),
      h("div",{style:{fontSize:"13px",color:"#94a3b8",lineHeight:"1.5"}},"Paste a file name above to validate it. The convention will be auto-detected, or you can select one manually.")))
  }
  return frag
}

// ═══════ ABBREVIATIONS VIEW ═══════
function renderAbbreviations(){
  const frag=document.createDocumentFragment();
  const hdr=h("div",{style:{maxWidth:"600px",width:"100%",marginBottom:"16px"}});
  hdr.append(h("button",{className:"back-link",onClick:()=>setState({view:"main"})},h("span",{style:{fontSize:"17px",lineHeight:"1"}},"\u2190")," Back"));
  hdr.append(h("h2",{style:{fontSize:"20px",fontWeight:"700",color:"#f1f5f9",margin:"0 0 4px"}},"Abbreviation Reference"));
  hdr.append(h("p",{style:{fontSize:"13px",color:"#64748b",margin:"0"}},"Words are automatically replaced with these abbreviations in generated file names. ",h("strong",{style:{color:"#94a3b8"}},Object.keys(ABBREVIATIONS).length+" entries")));
  frag.append(hdr);
  const fb=_filterBanner();if(fb)frag.append(fb);

  const card=h("div",{className:"card"});
  const searchWrap=h("div",{style:{padding:"16px 24px 10px"}});
  searchWrap.append(h("input",{className:"inp",type:"text",value:state.abbrSearch,placeholder:"Search abbreviations...",onInput:e=>setState({abbrSearch:e.target.value})}));
  card.append(searchWrap);

  const thead=h("div",{style:{display:"grid",gridTemplateColumns:"1fr 100px",padding:"7px 24px",background:"#f8fafc",borderBottom:"1.5px solid #e2e8f0",borderTop:"1px solid #e2e8f0",gap:"8px"}});
  thead.append(h("span",{className:"lbl-text"},"Full Word"),h("span",{className:"lbl-text"},"Abbreviation"));
  card.append(thead);

  const list=h("div",{style:{maxHeight:"440px",overflowY:"auto",padding:"0 24px"}});
  let entries=Object.entries(ABBREVIATIONS).sort((a,b)=>a[0].localeCompare(b[0]));
  if(state.abbrSearch){const q=state.abbrSearch.toLowerCase();entries=entries.filter(([f,a])=>f.toLowerCase().includes(q)||a.toLowerCase().includes(q))}
  if(!entries.length)list.append(h("div",{style:{padding:"24px 0",textAlign:"center",color:"#94a3b8",fontSize:"13px"}},state.abbrSearch?"No matches found":"No abbreviations"));
  for(const[full,abbr]of entries){
    const row=h("div",{style:{display:"grid",gridTemplateColumns:"1fr 100px",alignItems:"center",padding:"7px 0",borderBottom:"1px solid #f3f4f6",gap:"8px"}});
    row.append(h("span",{style:{fontSize:"13px",color:"#334155"}},full),h("span",{className:"mono",style:{fontSize:"12px",color:"#2563eb",fontWeight:"500"}},abbr));
    list.append(row)
  }
  card.append(list,h("div",{style:{height:"14px"}}));frag.append(card);return frag
}

// ═══════ CONVENTIONS VIEW ═══════
function renderConventions(){
  const frag=document.createDocumentFragment();
  const hdr=h("div",{style:{maxWidth:"600px",width:"100%",marginBottom:"16px"}});
  hdr.append(h("button",{className:"back-link",onClick:()=>setState({view:"main"})},h("span",{style:{fontSize:"17px",lineHeight:"1"}},"\u2190")," Back"));
  hdr.append(h("h2",{style:{fontSize:"20px",fontWeight:"700",color:"#f1f5f9",margin:"0 0 4px"}},"Naming Conventions"));
  hdr.append(h("p",{style:{fontSize:"13px",color:"#64748b",margin:"0"}},"Reference for the "+FILTERED_CONVENTIONS.length+" file naming conventions."));
  frag.append(hdr);
  const fb2=_filterBanner();if(fb2)frag.append(fb2);

  const card=h("div",{className:"card"});
  FILTERED_CONVENTIONS.forEach((c,i)=>{
    const isOpen=state.convExpanded===c.id;
    const convRules=RULES_BY_CONV[c.id]||[];
    const reqFields=convRules.filter(r=>r.required===true).map(r=>(FIELD_MAP[r.field]||{}).name||r.field);
    const optFields=convRules.filter(r=>r.required===false).map(r=>(FIELD_MAP[r.field]||{}).name||r.field);
    const lookupFields=convRules.filter(r=>r.required==null).map(r=>(FIELD_MAP[r.field]||{}).name||r.field);
    const totalFields=reqFields.length+optFields.length;
    const item=h("div",{style:{borderTop:i===0?"none":"1px solid #edf0f4"}});
    const btn=h("button",{style:{width:"100%",display:"flex",alignItems:"center",justifyContent:"space-between",padding:"14px 24px",background:isOpen?"#f8fafc":"#fff",border:"none",cursor:"pointer",fontFamily:"'DM Sans',sans-serif",textAlign:"left"},onClick:()=>setState({convExpanded:isOpen?null:c.id})});
    const btnL=h("div",{style:{flex:"1",minWidth:"0"}},h("div",{style:{fontSize:"14px",fontWeight:"600",color:"#0f172a"}},c.desc),h("div",{style:{fontSize:"11px",color:"#64748b",marginTop:"2px",lineHeight:"1.4"}},c.info));
    const btnR=h("div",{style:{display:"flex",alignItems:"center",gap:"8px",flexShrink:"0",marginLeft:"12px"}},h("span",{style:{fontSize:"11px",color:"#64748b",fontWeight:"500"}},totalFields+" fields"),h("span",{style:{fontSize:"14px",color:"#94a3b8",transform:isOpen?"rotate(180deg)":"rotate(0)",transition:"transform .2s",display:"inline-block"}},"\u25BE"));
    btn.append(btnL,btnR);item.append(btn);

    if(isOpen){
      const detail=h("div",{style:{padding:"0 24px 18px"}});
      if(c.exampleName){
        detail.append(h("div",{style:{marginBottom:"12px",padding:"8px 12px",background:"#f0f9ff",border:"1px solid #bae6fd",borderRadius:"6px"}},
          h("span",{style:{fontSize:"10px",fontWeight:"700",letterSpacing:".07em",textTransform:"uppercase",color:"#0369a1",marginRight:"6px"}},"Example"),
          h("span",{className:"mono",style:{fontSize:"11px",color:"#0c4a6e",fontWeight:"500"}},c.exampleName)))
      }
      if(reqFields.length){
        const rfWrap=h("div",{style:{marginBottom:"12px"}});
        rfWrap.append(h("span",{style:{fontSize:"10px",fontWeight:"700",letterSpacing:".07em",textTransform:"uppercase",color:"#475569",display:"block",marginBottom:"6px"}},"Required Fields"));
        const rfRow=h("div",{style:{display:"flex",flexWrap:"wrap",gap:"5px"}});
        reqFields.forEach(f=>rfRow.append(h("span",{className:"tag"},f)));
        rfWrap.append(rfRow);detail.append(rfWrap)
      }
      if(optFields.length){
        const ofWrap=h("div",{style:{marginBottom:"12px"}});
        ofWrap.append(h("span",{style:{fontSize:"10px",fontWeight:"700",letterSpacing:".07em",textTransform:"uppercase",color:"#475569",display:"block",marginBottom:"6px"}},"Optional Fields"));
        const ofRow=h("div",{style:{display:"flex",flexWrap:"wrap",gap:"5px"}});
        optFields.forEach(f=>ofRow.append(h("span",{className:"field-tag optional"},f)));
        ofWrap.append(ofRow);detail.append(ofWrap)
      }
      if(lookupFields.length){
        const lfWrap=h("div",{style:{marginBottom:"12px"}});
        lfWrap.append(h("span",{style:{fontSize:"10px",fontWeight:"700",letterSpacing:".07em",textTransform:"uppercase",color:"#475569",display:"block",marginBottom:"6px"}},"Lookups"));
        const lfRow=h("div",{style:{display:"flex",flexWrap:"wrap",gap:"5px"}});
        lookupFields.forEach(f=>lfRow.append(h("span",{style:{fontSize:"10px",fontWeight:"500",color:"#64748b",background:"#f1f5f9",border:"1px solid #e2e8f0",borderRadius:"4px",padding:"2px 8px",display:"inline-block"}},f)));
        lfWrap.append(lfRow);detail.append(lfWrap)
      }

      // Visual Pattern with colored segments
      const patWrap=h("div",{style:{marginBottom:"12px"}});
      patWrap.append(h("span",{style:{fontSize:"10px",fontWeight:"700",letterSpacing:".07em",textTransform:"uppercase",color:"#475569",display:"block",marginBottom:"6px"}},"Visual Pattern"));
      patWrap.append(renderPatternVisual(c));
      detail.append(patWrap);

      // Field Legend
      const legendWrap=h("div",{style:{marginBottom:"12px"}});
      legendWrap.append(h("span",{style:{fontSize:"10px",fontWeight:"700",letterSpacing:".07em",textTransform:"uppercase",color:"#475569",display:"block",marginBottom:"6px"}},"Field Reference"));
      legendWrap.append(renderPatternLegend(c));
      detail.append(legendWrap);

      detail.append(h("div",{style:{display:"flex",gap:"16px",fontSize:"11px",color:"#64748b",flexWrap:"wrap"}},
        h("span",null,"Extension: ",h("strong",{style:{color:"#334155"}},"."+c.ext))));
      item.append(detail)
    }
    card.append(item)
  });
  frag.append(card);return frag
}

function _filterBanner(){
  if(!_DETERMINATION)return null;
  const pl=_DETERMINATION==="post"?"Post-Determination":"Pre-Determination";
  return h("div",{style:{display:"flex",alignItems:"center",justifyContent:"center",gap:"8px",margin:"0 auto 12px",padding:"6px 16px",background:"rgba(251,191,36,.1)",border:"1px solid rgba(251,191,36,.25)",borderRadius:"8px",maxWidth:"600px",width:"100%"}},
    h("span",{style:{fontSize:"12px",fontWeight:"600",color:"#fbbf24"}},"Showing "+pl+" conventions only"),
    h("a",{href:window.location.pathname,style:{fontSize:"11px",color:"#60a5fa",marginLeft:"4px",textDecoration:"underline"}},"Show all"))
}

// ═══════ MAIN RENDER ═══════
function render(){
  const app=document.getElementById("app");app.innerHTML="";
  if(state.view==="abbreviations"){app.append(renderAbbreviations());return}
  if(state.view==="conventions"){app.append(renderConventions());return}

  // Header
  const badge=h("div",{style:{display:"inline-flex",alignItems:"center",gap:"8px",marginBottom:"8px",background:"rgba(59,130,246,.1)",border:"1px solid rgba(59,130,246,.2)",borderRadius:"20px",padding:"4px 14px"}},h("span",{style:{fontSize:"12px",fontWeight:"700",color:"#60a5fa",letterSpacing:".04em"}},"MI-4 Program"));
  const title=h("h1",{style:{fontSize:"24px",fontWeight:"700",color:"#f1f5f9",margin:"0 0 4px",letterSpacing:"-.02em"}},"File Name Tool");
  const subtitle=h("p",{style:{fontSize:"13px",color:"#64748b",margin:"0 0 12px",lineHeight:"1.5"}},"Generate valid file names or validate existing ones against naming conventions.");
  const navRow=h("div",{style:{display:"flex",justifyContent:"center",gap:"20px",marginBottom:"16px"}});
  navRow.append(h("button",{className:"nav-link",onClick:()=>setState({view:"conventions"})},"View Conventions"));
  navRow.append(h("button",{className:"nav-link",onClick:()=>setState({view:"abbreviations"})},"View Abbreviations"));
  const hdrWrap=h("div",{style:{textAlign:"center",marginBottom:"6px",maxWidth:"600px"}},badge,title,subtitle,navRow);
  app.append(hdrWrap);
  const fb=_filterBanner();if(fb)app.append(fb);

  // Toggle
  const toggle=h("div",{className:"toggle-wrap"});
  ["generator","validator"].forEach(m=>{
    toggle.append(h("button",{className:"toggle-btn "+(state.mode===m?"active":"inactive"),onClick:()=>setState({mode:m})},m==="generator"?"Generator":"Validator"))
  });
  app.append(toggle);

  // Card
  const card=h("div",{className:"card"});
  if(state.mode==="generator")card.append(renderGenerator());
  else card.append(renderValidator());
  app.append(card)
}

render();
