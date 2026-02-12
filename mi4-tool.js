// ═══════ UTILITIES ═══════
const ALL_FPID_FULLS=new Set(FPIDS.map(f=>f.full));
const ALL_PROJECT_ABBRS=new Set(PROJECTS.map(p=>p.abbr));
const ALL_FPID_SHORTS=new Set(FPIDS.map(f=>f.fpid));
const ALL_COMPONENT_IDS=new Set(COMPONENTS.map(c=>c.id));
const ALL_SUFFIXES=new Set(SUBMITTAL_PHASES.map(s=>s.suffix).filter(s=>s&&s!=="-"));
const ALL_PERMIT_PREFIXES=new Set(PERMITS.map(p=>p.prefix));
const DESIGN_ID_RE=/^(P[A-Z0-9]+)-(PS|FS|RC|PD|SD|CS|CR|FCR|RFI|RFM)-(\d{4})\.(\d{2})$/;
const DATE_RE=/^\d{4}-\d{2}-\d{2}$/;
const SEG_COLORS=["#7c3aed","#0891b2","#059669","#ca8a04","#dc2626","#2563eb","#9333ea","#e11d48"];
const SEG_EXPLAIN={"Extension":"The file extension must match the convention (.pdf, .kmz).","FPID (Full)":"An 11-digit code identifying the Financial Project ID.","FPID (Short)":"The standard FPID format (######-#) used in FDOT project tracking.","Project ID":"A short abbreviation (P1\u2013P5, PA, PB) mapped from the project name.","Deliverable ID":"A structured identifier for the plan discipline, e.g. PLANS-01-ROADWAY.","Submittal Suffix":"Indicates the submittal phase: 15pct, 30pct, 60pct, 90pct, Final, or RFC.","Design ID":"Format: ProjectAbbr-PhasePrefix-SubmittalID.ResubmittalID (e.g. P3-PS-0001.00).","Document Name":"The document title, PascalCased and abbreviated per the abbreviation table.","Formatted Date":"Date in YYYY-MM-DD format.","Custom ID":"The permit number matching the selected permit type's format.","Permit Prefix":"A standard prefix identifying the permit agency and type.","Unexpected":"Extra segments that don't belong in this convention's pattern."};

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

function detectConvention(fn){
  if(!fn)return null;if(fn.toLowerCase().endsWith(".kmz"))return"kmz";
  for(const p of PERMITS)if(fn.includes(p.prefix))return"permit";
  const base=fn.replace(/\.[^.]+$/,"");const sc=[...COMPONENTS].sort((a,b)=>b.id.length-a.id.length);
  for(const c of sc){if(base.includes(c.id)){const af=base.split(c.id)[1]||"";const tp=af.replace(/^-/,"").split("-").filter(Boolean);for(const t of tp)if(ALL_SUFFIXES.has(t))return"fdot-prod-ph";return"fdot-prod"}}
  if(DESIGN_ID_RE.test(base.split("_")[0]))return"design";const up=base.split("_");
  for(const s of up)if(ALL_FPID_SHORTS.has(s))return"fpid-doc";
  for(const s of up)if(ALL_FPID_FULLS.has(s))return"guide";return null
}

function parseFilename(fn,cid){
  const conv=CONVENTIONS.find(c=>c.id===cid);if(!conv||!fn)return null;
  const segs=[];let ok=true;const di=fn.lastIndexOf(".");const ext=di>-1?fn.slice(di+1):"";const base=di>-1?fn.slice(0,di):fn;
  const ev=ext.toLowerCase()===conv.ext.toLowerCase();segs.push({label:"Extension",value:"."+ext,valid:ev,expected:"."+conv.ext});if(!ev)ok=false;
  if(conv.customId){let fp=null,pi=-1;const up=base.split("_");
    for(let i=0;i<up.length&&!fp;i++)for(let j=up.length-1;j>=i;j--){const jn=up.slice(i,j+1).join("_");if(ALL_PERMIT_PREFIXES.has(jn)){fp=jn;pi=i;break}}
    if(fp){const pm=PERMITS.find(p=>p.prefix===fp);const cp=up.slice(0,pi).join("_");const iv=pm&&cp?validatePermitId(cp,pm.regex):false;
      segs.unshift({label:"Custom ID",value:cp||"(missing)",valid:iv&&!!cp,expected:pm?"Format: "+pm.hint+" (e.g. "+pm.example+")":"Unknown"});
      segs.splice(1,0,{label:"Permit Prefix",value:fp,valid:true,expected:fp});if(!iv||!cp)ok=false
    }else{segs.unshift({label:"Custom ID",value:base,valid:false,expected:"ID_Permit-Agency-Type"});segs.splice(1,0,{label:"Permit Prefix",value:"(not found)",valid:false,expected:"e.g. Permit-SFWMD-ERP"});ok=false}
    return{segments:segs,overall:ok,convention:conv}}
  if(conv.componentId){let fc=null,cs=-1;const sc=[...COMPONENTS].sort((a,b)=>b.id.length-a.id.length);
    for(const c of sc){const idx=base.indexOf(c.id);if(idx>-1){fc=c;cs=idx;break}}
    const bc=cs>0?base.slice(0,cs).replace(/-$/,""):"";const fv=ALL_FPID_FULLS.has(bc);
    segs.unshift({label:"FPID (Full)",value:bc||"(missing)",valid:fv,expected:"11-digit FPID"});if(!fv)ok=false;
    segs.splice(1,0,{label:"Deliverable ID",value:fc?fc.id:"(not found)",valid:!!fc,expected:"e.g. PLANS-01-ROADWAY"});if(!fc)ok=false;
    if(conv.submittalSuffix){const ac=fc?base.slice(cs+fc.id.length).replace(/^-/,""):"";const sv=ALL_SUFFIXES.has(ac);segs.splice(2,0,{label:"Submittal Suffix",value:ac||"(missing)",valid:sv,expected:"e.g. 90pct, Final, RFC"});if(!sv)ok=false}
    return{segments:segs,overall:ok,convention:conv}}
  const up=base.split("_");let cur=0;
  if(conv.designId){const s=up[cur]||"";const m=DESIGN_ID_RE.exec(s);let d="";if(m){const pv=ALL_PROJECT_ABBRS.has(m[1]);d=pv?"Project: "+m[1]:"Unknown project: "+m[1];if(!pv)ok=false}segs.unshift({label:"Design ID",value:s||"(missing)",valid:!!m,expected:"PX-PS-0001.00",details:d});if(!m)ok=false;cur++}
  if(conv.fpidFull&&!conv.componentId){const s=up[cur]||"";const v=ALL_FPID_FULLS.has(s);segs.push({label:"FPID (Full)",value:s||"(missing)",valid:v,expected:"11-digit FPID"});if(!v)ok=false;cur++}
  if(conv.projectId){const s=up[cur]||"";const v=ALL_PROJECT_ABBRS.has(s);segs.push({label:"Project ID",value:s||"(missing)",valid:v,expected:"e.g. P1, P3, PA"});if(!v)ok=false;cur++}
  if(conv.fpidShort){const s=up[cur]||"";const v=ALL_FPID_SHORTS.has(s);segs.push({label:"FPID (Short)",value:s||"(missing)",valid:v,expected:"e.g. 201210-9"});if(!v)ok=false;cur++}
  if(conv.title){let tp=[];while(cur<up.length){if(conv.formattedDate&&DATE_RE.test(up[cur]))break;tp.push(up[cur]);cur++}const tv=tp.join("_");segs.push({label:"Document Name",value:tv||"(missing)",valid:tv.length>0,expected:"PascalCase abbreviated title"});if(!tv)ok=false}
  if(conv.submittalSuffix&&!conv.componentId){const s=up[cur]||"";const v=ALL_SUFFIXES.has(s);segs.push({label:"Submittal Suffix",value:s||"(missing)",valid:v,expected:"e.g. 90pct, Final, RFC"});if(!v)ok=false;cur++}
  if(conv.formattedDate){const s=up[cur]||"";const v=DATE_RE.test(s);segs.push({label:"Formatted Date",value:s||"(missing)",valid:v,expected:"YYYY-MM-DD"});if(!v)ok=false;cur++}
  if(cur<up.length){segs.push({label:"Unexpected",value:up.slice(cur).join("_"),valid:false,expected:"(none)"});ok=false}
  return{segments:segs,overall:ok,convention:conv}
}

function buildExpectedPattern(conv){
  if(!conv)return"";if(conv.customId)return"CustomID_Permit-Agency-Type.pdf";
  const sep=conv.componentId?"-":"_";let p=[];
  if(conv.designId)p.push("PX-PS-0001.00");if(conv.fpidFull)p.push("XXXXXXXXXXX");if(conv.projectId)p.push("PX");if(conv.fpidShort)p.push("XXXXXX-X");
  if(conv.componentId)p.push("PLANS-XX-DISCIPLINE");if(conv.title)p.push("DocName");if(conv.submittalSuffix)p.push("Suffix");
  let b=p.join(sep);if(conv.formattedDate)b+="_YYYY-MM-DD";return b+"."+conv.ext
}

// ═══════ STATE ═══════
let state={view:"main",mode:"generator",convention:"",title:"",subTitle:"",fpidShort:"",project:"",component:"",submittalPhase:"",submittalIdRaw:"",isResubmittal:false,resubmittalIdRaw:"",formattedDate:"",customIdFormat:"",customIdValue:"",valFilename:"",valConvOverride:"",valExpandedSeg:null,abbrSearch:"",convExpanded:null,acFocused:false,acHighlightIdx:-1,copied:false,patternCopied:false};

let _restoring=false;
function setState(patch){
  const app=document.getElementById("app");const ae=document.activeElement;let fi=-1,ss=-1,se=-1,tag="";
  if(ae&&app&&app.contains(ae)){tag=ae.tagName;const all=[...app.querySelectorAll("input,select,textarea")];fi=all.indexOf(ae);if(typeof ae.selectionStart==="number"){try{ss=ae.selectionStart;se=ae.selectionEnd}catch(e){}}}
  Object.assign(state,patch);_restoring=true;render();
  if(fi>-1){const all=[...app.querySelectorAll("input,select,textarea")];const el=all[fi];if(el&&el.tagName===tag){el.focus();if(ss>-1&&typeof el.selectionStart==="number"){try{el.setSelectionRange(ss,se)}catch(e){}}}}
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
  const filtered=q?suggestions.filter(s=>s.toLowerCase().includes(q)).slice(0,8):suggestions.slice(0,8);
  const inp=h("input",{className:"inp",type:"text",value,placeholder:placeholder||"",autocomplete:"off",
    onInput:e=>onChange(e.target.value),
    onFocus:()=>{if(!state.acFocused)setState({acFocused:true,acHighlightIdx:-1})},
    onBlur:()=>{if(!_restoring)setTimeout(()=>{if(state.acFocused)setState({acFocused:false,acHighlightIdx:-1})},150)},
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
function renderGenerator(){
  const {convention:cid}=state;const conv=CONVENTIONS.find(c=>c.id===cid)||null;
  const frag=document.createDocumentFragment();

  // Convention dropdown
  const convWrap=h("div",{style:{padding:"18px 24px 12px"}});
  convWrap.append(selectEl("Convention","naming pattern",cid,v=>{setState({convention:v,title:"",subTitle:"",fpidShort:"",project:"",component:"",submittalPhase:"",submittalIdRaw:"",isResubmittal:false,resubmittalIdRaw:"",formattedDate:"",customIdFormat:"",customIdValue:""})},
    "Choose a naming convention...",CONVENTIONS.map(c=>({value:c.id,label:c.desc}))));
  frag.append(convWrap);

  if(!conv)return frag;

  const needs={title:conv.title,designId:conv.designId,fpidFull:conv.fpidFull,projectId:conv.projectId,fpidShort:conv.fpidShort,componentId:conv.componentId,submittalSuffix:conv.submittalSuffix,formattedDate:conv.formattedDate,customId:conv.customId};
  const needsFpid=needs.fpidFull||needs.fpidShort;
  const needsProject=needs.designId||needs.projectId;

  // Resolve values
  let resolvedProjectAbbr="";
  if(state.fpidShort){const f=FPIDS.find(fp=>fp.fpid===state.fpidShort);if(f){const p=PROJECTS.find(pr=>pr.name===f.project);resolvedProjectAbbr=p?p.abbr:""}}
  else if(state.project){const p=PROJECTS.find(pr=>pr.name===state.project);resolvedProjectAbbr=p?p.abbr:""}
  const resolvedFpidFull=(()=>{const f=FPIDS.find(fp=>fp.fpid===state.fpidShort);return f?f.full:""})();
  const resolvedComponentId=(()=>{const c=COMPONENTS.find(co=>co.name===state.component);return c?c.id:""})();
  const resolvedPhase=SUBMITTAL_PHASES.find(s=>s.desc===state.submittalPhase)||{prefix:"",suffix:""};
  const resolvedPermit=PERMITS.find(p=>p.name===state.customIdFormat)||null;
  const submittalId=padId(state.submittalIdRaw,4);
  const resubmittalId=state.isResubmittal?padId(state.resubmittalIdRaw,2):"00";
  const customIdValid=needs.customId&&state.customIdFormat&&state.customIdValue&&resolvedPermit?validatePermitId(state.customIdValue,resolvedPermit.regex):null;

  let docName="";
  if(state.title)docName=applyAbbreviations(state.title);
  if(state.subTitle)docName+=(docName?"-":"")+applyAbbreviations(state.subTitle);

  const designIdStr=needs.designId&&resolvedProjectAbbr&&resolvedPhase.prefix&&submittalId?resolvedProjectAbbr+"-"+resolvedPhase.prefix+"-"+submittalId+"."+resubmittalId:"";
  const submittalSuffixStr=needs.submittalSuffix?(resolvedPhase.suffix&&resolvedPhase.suffix!=="-"?resolvedPhase.suffix:""):"";

  // Generate filename
  let generatedName="";
  if(needs.customId){
    if(state.customIdFormat&&state.customIdValue&&resolvedPermit&&customIdValid!==false)
      generatedName=state.customIdValue+"_"+resolvedPermit.prefix+"."+conv.ext
  }else{
    const sep=conv.componentId?"-":"_";const segs=[];
    if(needs.designId&&designIdStr)segs.push(designIdStr);
    if(needs.fpidFull&&resolvedFpidFull)segs.push(resolvedFpidFull);
    if(needs.projectId&&resolvedProjectAbbr)segs.push(resolvedProjectAbbr);
    if(needs.fpidShort&&state.fpidShort)segs.push(state.fpidShort);
    if(needs.componentId&&resolvedComponentId)segs.push(resolvedComponentId);
    if(needs.title)segs.push(docName||conv.exampleDoc);
    if(needs.submittalSuffix&&submittalSuffixStr)segs.push(submittalSuffixStr);
    let base=segs.join(sep);if(needs.formattedDate&&state.formattedDate)base+="_"+state.formattedDate;
    if(base)generatedName=base+"."+conv.ext
  }

  // Field status
  const fs={};
  if(needs.title)fs["Title"]=!!state.title.trim();
  if(needs.designId)fs["Design ID"]=!!(resolvedProjectAbbr&&resolvedPhase.prefix&&submittalId);
  if(needs.fpidFull)fs["FPID (Full)"]=!!resolvedFpidFull;
  if(needs.projectId)fs["Project ID"]=!!resolvedProjectAbbr;
  if(needs.fpidShort)fs["FPID (Short)"]=!!state.fpidShort;
  if(needs.componentId)fs["Deliverable"]=!!resolvedComponentId;
  if(needs.submittalSuffix)fs["Submittal Suffix"]=!!submittalSuffixStr;
  if(needs.formattedDate)fs["Formatted Date"]=!!state.formattedDate.trim();
  if(needs.customId){fs["Custom ID Format"]=!!state.customIdFormat;fs["Custom ID"]=!!(state.customIdValue&&customIdValid!==false)}
  const isValid=Object.values(fs).length>0&&Object.values(fs).every(Boolean);
  const filledCount=Object.values(fs).filter(Boolean).length;
  const totalCount=Object.values(fs).length;

  // Fields section
  const fields=h("div",{style:{padding:"16px 24px 20px",borderTop:"1px solid #edf0f4"}});
  const inner=h("div",{className:"fade-in"});

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

  // Title
  if(needs.title){
    const row=h("div",{className:"grid2"});
    row.append(autocompleteEl("Title","auto-abbreviated",state.title,v=>setState({title:v}),"e.g. Pavement Design Report",TITLE_SUGGESTIONS));
    row.append(inputEl("Sub-Title","optional",state.subTitle,v=>setState({subTitle:v}),"e.g. Segment 1"));
    inner.append(row)
  }

  // FPID
  const filteredFpids=state.project?FPIDS.filter(f=>f.project===state.project):FPIDS;
  if(needsFpid){
    inner.append(selectEl(needs.fpidFull?"FPID":"FPID (Short)",needs.fpidFull?"resolves full FPID + project":"short format",
      state.fpidShort,v=>{const f=FPIDS.find(fp=>fp.fpid===v);setState({fpidShort:v,project:f?f.project:state.project})},
      "Select FPID...",filteredFpids.map(f=>({value:f.fpid,label:f.fpid+" \u2014 "+f.desc}))));
    if(state.fpidShort){
      const f=FPIDS.find(fp=>fp.fpid===state.fpidShort);
      if(f){const p=PROJECTS.find(pr=>pr.name===f.project);
        const fc=h("div",{className:"fpid-card"},
          h("span",null,h("strong",null,"Project: "),f.project+(p?" ("+p.abbr+")":"")),
          needs.fpidFull?h("span",null,h("strong",null,"Full FPID: "),h("span",{className:"mono"},f.full)):null,
          h("span",{style:{color:"#64748b",fontStyle:"italic",flex:"1",minWidth:"150px"}},f.desc));
        inner.append(fc)
      }
    }
  }

  // Project (no FPID)
  if(needsProject&&!needsFpid)inner.append(selectEl("Project","maps to abbreviation",state.project,v=>setState({project:v}),"Select project...",PROJECTS.map(p=>({value:p.name,label:p.name+" ("+p.abbr+")"}))));

  // Design ID fields
  if(needs.designId){
    inner.append(selectEl("Submittal Phase","prefix for Design ID",state.submittalPhase,v=>setState({submittalPhase:v}),"Select phase...",SUBMITTAL_PHASES.filter(s=>s.prefix).map(s=>({value:s.desc,label:s.desc}))));
    const row=h("div",{className:"grid2",style:{alignItems:"start"}});
    row.append(inputEl("Submittal ID",submittalId?"\u2192 "+submittalId:"integer \u2192 0000",state.submittalIdRaw,v=>setState({submittalIdRaw:v.replace(/\D/g,"")}),"e.g. 1",{maxLength:"4",inputMode:"numeric"}));
    const rw=h("div",{className:"mb14"});
    rw.append(h("label",{className:"lbl"},h("span",{className:"lbl-text"},"Resubmittal"),h("span",{className:"lbl-hint"},state.isResubmittal&&resubmittalId?"\u2192 "+resubmittalId:"defaults to 00")));
    const rd=h("div",{style:{display:"flex",alignItems:"center",gap:"10px",minHeight:"38px"}});
    const cb=h("input",{type:"checkbox",style:{width:"16px",height:"16px",accentColor:"#2563eb",cursor:"pointer"},onChange:e=>setState({isResubmittal:e.target.checked,resubmittalIdRaw:e.target.checked?state.resubmittalIdRaw:""})});
    cb.checked=state.isResubmittal;
    rd.append(h("label",{style:{display:"flex",alignItems:"center",gap:"6px",cursor:"pointer",fontSize:"13px",color:"#475569",userSelect:"none"}},cb,"Resub?"));
    if(state.isResubmittal){const ri=h("input",{className:"inp",type:"text",inputMode:"numeric",maxLength:"2",value:state.resubmittalIdRaw,placeholder:"e.g. 1",style:{flex:"1"},onInput:e=>setState({resubmittalIdRaw:e.target.value.replace(/\D/g,"")})});rd.append(ri)}
    else rd.append(h("span",{className:"mono",style:{fontSize:"13px",color:"#94a3b8"}},"00"));
    rw.append(rd);row.append(rw);inner.append(row);
    if(designIdStr)inner.append(h("div",{className:"design-preview"},h("strong",null,"Design ID preview: "),h("span",{className:"mono",style:{fontSize:"12px",fontWeight:"600",color:"#4c1d95"}},designIdStr)))
  }

  // Deliverable
  if(needs.componentId)inner.append(selectEl("Deliverable","plan discipline",state.component,v=>setState({component:v}),"Select component...",COMPONENTS.map(c=>({value:c.name,label:c.name}))));

  // Submittal suffix (non-design)
  if(needs.submittalSuffix&&!needs.designId)inner.append(selectEl("Submittal Phase","suffix",state.submittalPhase,v=>setState({submittalPhase:v}),"Select phase...",SUBMITTAL_PHASES.map(s=>({value:s.desc,label:s.desc+(s.suffix&&s.suffix!=="-"?" \u2192 "+s.suffix:"")}))));

  // Custom ID / Permit
  if(needs.customId){
    inner.append(selectEl("Custom ID Format","permit type",state.customIdFormat,v=>setState({customIdFormat:v,customIdValue:""}),"Select permit type...",PERMITS.map(p=>({value:p.name,label:p.name+" \u2014 format: "+p.hint}))));
    if(state.customIdFormat&&resolvedPermit){
      inner.append(h("div",{className:"permit-info"},h("div",{style:{marginBottom:"3px"}},h("strong",null,"Format: "),resolvedPermit.mask),h("div",null,h("strong",null,"Example: "),h("span",{className:"mono",style:{fontWeight:"600"}},resolvedPermit.example))));
      const pw=h("div",{className:"mb14"});
      pw.append(h("label",{className:"lbl"},h("span",{className:"lbl-text"},"Custom ID"),h("span",{className:"lbl-hint"},"format: "+resolvedPermit.hint)));
      const pi=h("input",{className:"inp mono",type:"text",value:state.customIdValue,placeholder:resolvedPermit.example,
        style:{borderColor:state.customIdValue?(customIdValid?"#22c55e":"#ef4444"):"#d1d5db"},
        onInput:e=>setState({customIdValue:e.target.value})});
      pw.append(pi);
      if(state.customIdValue&&customIdValid===false)pw.append(h("div",{style:{marginTop:"4px",fontSize:"11px",color:"#ef4444",fontWeight:"500"}},"\u26A0\uFE0F Does not match expected format ("+resolvedPermit.hint+")"));
      if(state.customIdValue&&customIdValid===true)pw.append(h("div",{style:{marginTop:"4px",fontSize:"11px",color:"#16a34a",fontWeight:"500"}},"\u2713 Valid "+state.customIdFormat.replace("Permit ","")+" ID"));
      inner.append(pw)
    }
  }

  // Date
  if(needs.formattedDate){
    const dw=h("div",{className:"mb14"});
    dw.append(h("label",{className:"lbl"},h("span",{className:"lbl-text"},"Date"),h("span",{className:"lbl-hint"},state.formattedDate||"YYYY-MM-DD")));
    const dr=h("div",{style:{display:"flex",gap:"8px",alignItems:"center"}});
    dr.append(h("input",{className:"inp",type:"date",value:state.formattedDate,style:{flex:"1"},onInput:e=>setState({formattedDate:e.target.value})}));
    dr.append(h("button",{className:"sm-btn",style:{color:"#2563eb",background:"rgba(37,99,235,.07)",borderColor:"rgba(37,99,235,.18)",whiteSpace:"nowrap"},onClick:()=>setState({formattedDate:new Date().toLocaleDateString("en-CA")})},"Today"));
    dw.append(dr);inner.append(dw)
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
  hdrR.append(h("button",{className:"sm-btn",style:{color:"#64748b",background:"transparent",borderColor:"#d1d5db"},onClick:()=>setState({convention:"",title:"",subTitle:"",fpidShort:"",project:"",component:"",submittalPhase:"",submittalIdRaw:"",isResubmittal:false,resubmittalIdRaw:"",formattedDate:"",customIdFormat:"",customIdValue:"",copied:false})},"Reset"));
  if(isValid&&generatedName){
    hdrR.append(h("button",{className:"sm-btn",style:{color:state.copied?"#16a34a":"#2563eb",background:state.copied?"rgba(22,163,74,.07)":"rgba(37,99,235,.07)",borderColor:state.copied?"rgba(22,163,74,.18)":"rgba(37,99,235,.18)"},onClick:()=>{navigator.clipboard.writeText(generatedName);setState({copied:true});setTimeout(()=>setState({copied:false}),1800)}},state.copied?"\u2713 Copied":"Copy"))
  }
  hdr.append(hdrL,hdrR);out.append(hdr);
  out.append(h("div",{className:"output-box",style:{color:isValid?"#0f172a":generatedName?"#92400e":"#94a3b8",border:"1.5px solid "+(isValid?"#86efac":generatedName?"#fde68a":"#e2e8f0"),cursor:generatedName?"pointer":"default"},title:generatedName?"Click to copy":"",onClick:()=>{if(generatedName){navigator.clipboard.writeText(generatedName);setState({copied:true});setTimeout(()=>setState({copied:false}),1800)}}},generatedName||"Fill in the required fields above..."));
  if(generatedName){
    const meta=h("div",{style:{marginTop:"6px",display:"flex",alignItems:"center",gap:"8px",flexWrap:"wrap"}});
    meta.append(h("span",{style:{fontSize:"10px",fontWeight:"700",letterSpacing:".06em",textTransform:"uppercase",color:"#475569",background:"#e2e8f0",borderRadius:"4px",padding:"2px 8px",display:"inline-block"}},"."+conv.ext));
    meta.append(h("span",{style:{fontSize:"11px",color:"#64748b"}},needs.customId?"permit convention":conv.componentId?"sep: hyphen ( - )":"sep: underscore ( _ )"));
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
  const activeId=co||detected;const activeConv=CONVENTIONS.find(c=>c.id===activeId)||null;
  const result=fn.trim()&&activeId?parseFilename(fn.trim(),activeId):null;
  const passCount=result?result.segments.filter(s=>s.valid).length:0;
  const totalSegs=result?result.segments.length:0;

  const top=h("div",{style:{padding:"18px 24px 14px"}});
  const fnWrap=h("div",{className:"mb14"});
  fnWrap.append(h("label",{className:"lbl"},h("span",{className:"lbl-text"},"File Name to Validate"),h("span",{className:"lbl-hint"},"paste or type a full filename")));
  fnWrap.append(h("input",{className:"inp inp-mono",type:"text",value:fn,placeholder:"e.g. 43145625201-PLANS-01-ROADWAY-90pct.pdf",onInput:e=>setState({valFilename:e.target.value})}));
  top.append(fnWrap);
  top.append(selectEl("Convention",detected&&!co?"auto-detected":co?"manual override":"",co,v=>setState({valConvOverride:v}),
    detected?CONVENTIONS.find(c=>c.id===detected)?.desc+" (auto-detected)":"Paste a filename first...",
    CONVENTIONS.map(c=>({value:c.id,label:c.desc}))));
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
    nonExt.forEach((seg,i)=>{
      const color=SEG_COLORS[i%SEG_COLORS.length];
      if(i>0)psLine.append(h("span",{style:{color:"#94a3b8",margin:"0 1px"}},activeConv?.componentId&&!activeConv?.customId?"-":"_"));
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
  hdr.append(h("p",{style:{fontSize:"13px",color:"#64748b",margin:"0"}},"Reference for the "+CONVENTIONS.length+" file naming conventions."));
  frag.append(hdr);

  const boolFields=["title","designId","fpidFull","projectId","fpidShort","componentId","submittalSuffix","customId","formattedDate"];
  const boolLabels={title:"Title",designId:"Design ID",fpidFull:"FPID (Full)",projectId:"Project ID",fpidShort:"FPID (Short)",componentId:"Deliverable",submittalSuffix:"Submittal Suffix",customId:"Custom ID",formattedDate:"Formatted Date"};

  const card=h("div",{className:"card"});
  CONVENTIONS.forEach((c,i)=>{
    const isOpen=state.convExpanded===c.id;
    const activeFields=boolFields.filter(f=>c[f]);
    const item=h("div",{style:{borderTop:i===0?"none":"1px solid #edf0f4"}});
    const btn=h("button",{style:{width:"100%",display:"flex",alignItems:"center",justifyContent:"space-between",padding:"14px 24px",background:isOpen?"#f8fafc":"#fff",border:"none",cursor:"pointer",fontFamily:"'DM Sans',sans-serif",textAlign:"left"},onClick:()=>setState({convExpanded:isOpen?null:c.id})});
    const btnL=h("div",{style:{flex:"1",minWidth:"0"}},h("div",{style:{fontSize:"14px",fontWeight:"600",color:"#0f172a"}},c.desc),h("div",{style:{fontSize:"11px",color:"#64748b",marginTop:"2px",lineHeight:"1.4"}},c.info));
    const btnR=h("div",{style:{display:"flex",alignItems:"center",gap:"8px",flexShrink:"0",marginLeft:"12px"}},h("span",{style:{fontSize:"11px",color:"#64748b",fontWeight:"500"}},activeFields.length+" fields"),h("span",{style:{fontSize:"14px",color:"#94a3b8",transform:isOpen?"rotate(180deg)":"rotate(0)",transition:"transform .2s",display:"inline-block"}},"\u25BE"));
    btn.append(btnL,btnR);item.append(btn);

    if(isOpen){
      const detail=h("div",{style:{padding:"0 24px 18px"}});
      if(c.exampleName){
        detail.append(h("div",{style:{marginBottom:"12px",padding:"8px 12px",background:"#f0f9ff",border:"1px solid #bae6fd",borderRadius:"6px"}},
          h("span",{style:{fontSize:"10px",fontWeight:"700",letterSpacing:".07em",textTransform:"uppercase",color:"#0369a1",marginRight:"6px"}},"Example"),
          h("span",{className:"mono",style:{fontSize:"11px",color:"#0c4a6e",fontWeight:"500"}},c.exampleName)))
      }
      const rfWrap=h("div",{style:{marginBottom:"12px"}});
      rfWrap.append(h("span",{style:{fontSize:"10px",fontWeight:"700",letterSpacing:".07em",textTransform:"uppercase",color:"#475569",display:"block",marginBottom:"6px"}},"Required Fields"));
      const rfRow=h("div",{style:{display:"flex",flexWrap:"wrap",gap:"5px"}});
      activeFields.forEach(f=>rfRow.append(h("span",{className:"tag"},boolLabels[f])));
      rfWrap.append(rfRow);detail.append(rfWrap);

      // Pattern
      const patWrap=h("div",{style:{marginBottom:"12px"}});
      patWrap.append(h("span",{style:{fontSize:"10px",fontWeight:"700",letterSpacing:".07em",textTransform:"uppercase",color:"#475569",display:"block",marginBottom:"6px"}},"Name Pattern"));
      patWrap.append(h("div",{className:"mono",style:{fontSize:"12px",fontWeight:"500",color:"#334155",background:"#f8fafc",border:"1px solid #e2e8f0",borderRadius:"6px",padding:"10px 12px",lineHeight:"1.8",wordBreak:"break-all"}},buildExpectedPattern(c)));
      detail.append(patWrap);

      detail.append(h("div",{style:{display:"flex",gap:"16px",fontSize:"11px",color:"#64748b",flexWrap:"wrap"}},
        h("span",null,"Separator: ",h("strong",{style:{color:"#334155"}},c.customId||!c.componentId?"underscore ( _ )":"hyphen ( - )")),
        h("span",null,"Extension: ",h("strong",{style:{color:"#334155"}},"."+c.ext))));
      item.append(detail)
    }
    card.append(item)
  });
  frag.append(card);return frag
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
