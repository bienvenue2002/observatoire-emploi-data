"use strict";
// Static application: no private API, translation service, account or tracker.
const $ = selector => document.querySelector(selector);
const $$ = selector => [...document.querySelectorAll(selector)];
const esc = value => String(value ?? "").replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const normal = value => String(value || "").normalize("NFD").replace(/[\u0300-\u036f]/g,"").replace(/[’']/g,"'").replace(/\s*\+\s*/g,"+").toLowerCase();
const unique = values => [...new Set(values)];
const safeUrl = value => {try {const url=new URL(value);return url.protocol==="https:"?url.href:"";}catch{return "";}};
const fieldNames = ["domain","country","contract","education","source","region","skill","pathway"];
const locales = Object.keys(window.ELAN_I18N);
const state = {jobs:[],meta:null,catalog:null,update:null,filtered:[],lang:"fr",page:1,pageSize:8,student:true,international:false,view:"offers",openJob:null,opener:null,ready:false,saved:new Set(),savedOnly:false};
const requestedLanguage=new URLSearchParams(location.search).get("lang");
if(locales.includes(requestedLanguage))state.lang=requestedLanguage;
const t = (key, values={}) => String(window.ELAN_I18N[state.lang][key] ?? key).replace(/\{(\w+)\}/g,(_,name)=>values[name]??"");
const number = value => new Intl.NumberFormat(state.lang).format(value);
const domainLabel = value => window.ELAN_I18N[state.lang].domains[value] || t("unknown");
const countryNames = new Map();
function countryLabel(code, lang=state.lang) {
  if(!code)return window.ELAN_I18N[lang].unknown;
  const key=lang+":"+code;
  if(!countryNames.has(key)) {
    try{countryNames.set(key,new Intl.DisplayNames([lang],{type:"region"}).of(code));}catch{countryNames.set(key,code);}
  }
  return countryNames.get(key);
}
function dateLabel(value) {
  return value && !Number.isNaN(Date.parse(value)) ? new Intl.DateTimeFormat(state.lang,{day:"numeric",month:"long",year:"numeric",timeZone:"Europe/Paris"}).format(new Date(value)) : t("dateUnknown");
}
function contractLabel(value) {
  return t(({"Stage":"internship","Alternance":"workStudy","CDI":"permanent","CDD":"fixedTerm","VIE":"vie"})[value] || "unknown");
}
function valueLabel(value) {
  if(!value || ["Non renseignée","Non précisé","Non renseigné"].includes(value))return t("unknown");
  if(value==="Fin d’études")return t("finalYear");
  const duration=String(value).match(/^(\d+(?:[.,]\d+)?(?:\s*(?:à|-)\s*\d+)?)\s*(mois|semaines?|jours?|ans?|months?)$/i);
  if(duration) {
    const unit=/mois|month/i.test(duration[2])?"month":/semaine/i.test(duration[2])?"weeks":/jour/i.test(duration[2])?"days":"years";
    return duration[1]+(["ja","zh"].includes(state.lang)?"":" ")+t(unit);
  }
  return value;
}
const isStudent = job => ["Stage","Alternance"].includes(job.contract);
const statusLabel = job => t(job.status==="closed"?"closed":job.status==="source_present"?"sourcePresent":"unverified");
const countriesOf = jobs => unique(jobs.flatMap(job=>job.locations.map(location=>location.country_code).filter(Boolean)));
function translateInterface() {
  document.documentElement.lang=state.lang;document.title=t("title");
  $$("[data-i18n]").forEach(el=>el.textContent=t(el.dataset.i18n));
  $$("[data-i18n-placeholder]").forEach(el=>el.placeholder=t(el.dataset.i18nPlaceholder));
  $$("[data-i18n-aria]").forEach(el=>el.setAttribute("aria-label",t(el.dataset.i18nAria)));
  $("#language").value=state.lang;$("#language").setAttribute("aria-label",t("language"));
  if(!state.ready)return;
  $("#snapshot-date").textContent=dateLabel(state.meta.observed_at);
  $("#global-summary").textContent=t("summary",{jobs:number(state.jobs.length),countries:number(countriesOf(state.jobs).length)});
  populateFilters();renderDomains();renderSources();renderRefresh();renderResults();
  $("#export-status").textContent="";
  if(state.openJob)renderDetail(state.openJob);
}
function optionList(id, values, allKey, label=value=>value) {
  const el=$("#"+id), previous=el.value;
  el.replaceChildren(new Option(t(allKey),""));
  values.sort((a,b)=>label(a).localeCompare(label(b),state.lang)).forEach(value=>el.add(new Option(label(value),value)));
  el.value=values.includes(previous)?previous:"";
}
function populateFilters() {
  optionList("domain",state.meta.domain_options,"allDomains",domainLabel);
  const codes=countriesOf(state.jobs);if(state.jobs.some(j=>j.locations.some(x=>!x.country_code)))codes.push("unknown");
  optionList("country",codes,"allCountries",code=>code==="unknown"?t("unknown"):countryLabel(code));
  optionList("contract",unique(state.jobs.map(j=>j.contract)),"allContracts",value=>contractLabel(value));
  const levels=unique(state.jobs.map(j=>j.education_level).filter(Boolean));if(state.jobs.some(j=>!j.education_level))levels.push("__unknown");
  optionList("education",levels,"allEducation",value=>value==="__unknown"?t("unknown"):value);
  optionList("source",unique(state.jobs.map(j=>j.source_key)),"allSources",key=>state.jobs.find(j=>j.source_key===key).source);
  optionList("region",unique(state.jobs.flatMap(j=>j.locations.map(x=>x.region)).filter(Boolean)),"allRegions");
  optionList("skill",unique(state.jobs.flatMap(j=>j.skills)),"allSkills");
  optionList("pathway",unique(state.jobs.flatMap(j=>j.pathways||[])),"allPathways");
}
function searchText(job) {
  // Translation of interface categories must not make English/Japanese search lose French results.
  return normal([job.title,job.company,job.family,job.contract,contractLabel(job.contract),
    job.source,job.duration,valueLabel(job.duration),job.education_level,job.study_stage,valueLabel(job.study_stage),
    job.description,...job.skills,...(job.pathways||[]),
    ...Object.values(window.ELAN_I18N).flatMap(dictionary=>[dictionary.domains[job.domain],
      dictionary[({"Stage":"internship","Alternance":"workStudy","CDI":"permanent","CDD":"fixedTerm","VIE":"vie"})[job.contract]],
      job.duration?job.duration.replace(/\bmois\b/g,dictionary.month):""]),
    ...job.locations.flatMap(x=>[x.city,x.region,x.country,x.country_code,...locales.map(lang=>x.country_code?countryLabel(x.country_code,lang):"")])].join(" "));
}
function filterJobs() {
  if(!state.ready)return;
  const values=Object.fromEntries(fieldNames.map(id=>[id,$("#"+id).value]));
  const query=normal($("#search").value.trim()), terms=query.split(/\s+/).filter(Boolean);
  state.filtered=state.jobs.filter(job=>{
    const availability=$("#availability").value;
    if(availability==="current" && job.status==="closed")return false;
    if(availability==="archived" && job.status!=="closed")return false;
    if(state.savedOnly && !state.saved.has(job.id))return false;
    if(state.student && !isStudent(job))return false;
    if(state.international && !job.locations.some(x=>x.country_code && x.country_code!=="FR"))return false;
    if(values.domain && job.domain!==values.domain)return false;
    if(values.country && !job.locations.some(x=>values.country==="unknown"?!x.country_code:x.country_code===values.country))return false;
    if(values.contract && job.contract!==values.contract)return false;
    if(values.education && (values.education==="__unknown"?!!job.education_level:job.education_level!==values.education))return false;
    if(values.source && job.source_key!==values.source)return false;
    if(values.region && !job.locations.some(x=>x.region===values.region))return false;
    if(values.skill && !job.skills.includes(values.skill))return false;
    if(values.pathway && !(job.pathways||[]).includes(values.pathway))return false;
    const haystack=searchText(job);
    return terms.every(term=>haystack.includes(term));
  });
  const sort=$("#sort").value;
  state.filtered.sort((a,b)=>sort==="company"?a.company.localeCompare(b.company,state.lang):sort==="title"?a.title.localeCompare(b.title,state.lang):(b.modified_at||b.published_at||"").localeCompare(a.modified_at||a.published_at||"")||a.id.localeCompare(b.id));
  $("#export-status").textContent="";renderResults();
}
function renderResults() {
  const count=state.filtered.length, pages=Math.max(1,Math.ceil(count/state.pageSize));state.page=Math.min(state.page,pages);
  $("#result-count").textContent=t("resultsCount",{n:number(count)});
  $("#saved-only").textContent=t("savedCount",{n:number(state.saved.size)});
  $("#saved-only").setAttribute("aria-pressed",String(state.savedOnly));
  $("#saved-csv").disabled=!state.saved.size;$("#saved-json").disabled=!state.saved.size;
  $("#archive-notice").hidden=$("#availability").value!=="archived";
  $("#selection-note").textContent=t("studentSummary",{selected:number(count),student:number(state.meta.student_offers),total:number(state.jobs.length)});
  $("#student").setAttribute("aria-pressed",String(state.student));$("#international").setAttribute("aria-pressed",String(state.international));
  $("#ara").setAttribute("aria-pressed",String($("#region").value==="Auvergne-Rhône-Alpes"));
  $("#empty").hidden=count>0;$("#job-list").hidden=count===0;
  $("#job-list").innerHTML=state.filtered.slice((state.page-1)*state.pageSize,state.page*state.pageSize).map(job=>{
    const places=unique(job.locations.map(x=>[x.city==="Non renseignée"?"":x.city,countryLabel(x.country_code)].filter(Boolean).join(", ")));
    return `<article class="global-job"><div><p class="job-employer">${esc(job.company)}</p><h3><button class="job-open" type="button" data-job="${esc(job.id)}" aria-label="${esc(t("offerCard",{title:job.title}))}">${esc(job.title)}</button></h3><p class="job-location">${esc(places.join(" · "))}</p><div class="job-badges"><span class="job-badge contract-badge">${esc(contractLabel(job.contract))}</span><span class="job-badge">${esc(domainLabel(job.domain))}</span></div><p class="job-status ${job.status==="closed"?"archived-status":""}">${esc(statusLabel(job))}</p><p class="job-meta">${esc(job.source)} · ${esc(t(job.collection_method!=="editorial"?"automatic":"editorial"))}<br>${esc(t("modified"))} : ${esc(dateLabel(job.modified_at||job.published_at))}</p></div><div class="job-profile"><div><span>${esc(t("duration"))}</span><strong>${esc(valueLabel(job.duration))}</strong></div><div><span>${esc(t("education"))}</span><strong>${esc(valueLabel(job.education_level))}</strong></div>${job.study_stage?`<div><span>${esc(t("studyStage"))}</span><strong>${esc(valueLabel(job.study_stage))}</strong></div>`:""}</div></article>`;
  }).join("");
  $$("#job-list .global-job").forEach((article,index)=>{
    const job=state.filtered[(state.page-1)*state.pageSize+index], saved=state.saved.has(job.id);
    article.querySelector(".job-profile").insertAdjacentHTML("beforeend",`<button type="button" class="save-offer" data-save="${esc(job.id)}" aria-pressed="${saved}" aria-label="${esc(t(saved?"removeNamed":"saveNamed",{title:job.title}))}">${esc(t(saved?"saved":"save"))}</button>`);
  });
  $("#page-status").textContent=t("page",{n:number(state.page),total:number(pages)});
  $("#prev").disabled=state.page<=1;$("#next").disabled=state.page>=pages;
  $("#export-csv").disabled=!count;$("#export-json").disabled=!count;
}
function resetFilters() {
  fieldNames.forEach(id=>$("#"+id).value="");$("#search").value="";$("#sort").value="recent";$("#availability").value="current";
  state.student=true;state.international=false;state.savedOnly=false;state.page=1;
  try{const url=new URL(location.href);url.searchParams.delete("status");history.replaceState(null,"",url);}catch{/* Opaque previews do not expose History API. */}
  filterJobs();
}
function renderDomains() {
  $("#domain-grid").innerHTML=state.catalog.pathways.map(pathway=>`<article class="domain-card"><strong>${esc(pathway.id)}</strong><p>${esc(pathway.name)}</p><button type="button" data-pathway="${esc(pathway.id)}">${esc(t("results"))} ↗</button><a href="${esc(safeUrl(pathway.url))}" target="_blank" rel="noopener noreferrer">${esc(t("pathwayOfficial"))}</a></article>`).join("");
}
function renderRefresh() {
  const stamp=state.meta.last_success_at||state.meta.observed_at;
  $("#last-success").dateTime=stamp;
  $("#last-success").textContent=new Intl.DateTimeFormat(state.lang,{dateStyle:"long",timeStyle:"short",timeZone:"Europe/Paris"}).format(new Date(stamp))+" · Europe/Paris";
  const status=state.update?.status;
  $("#refresh-state").textContent=t(status==="failed"?"refreshFailed":status==="success"?"refreshSuccess":"refreshUnknown");
  $("#refresh-panel").classList.toggle("update-failed",status==="failed");
}
const directories = [
  ["Welcome to the Jungle","https://www.welcometothejungle.com/fr/jobs"],
  ["JobTeaser","https://www.jobteaser.com/en/job-offers"],
  ["Capgemini","https://www.capgemini.com/careers/join-capgemini/job-search/?keyword=Internship&size=30"],
  ["ErasmusIntern","https://erasmusintern.org/"]
];
function renderSources() {
  $("#source-grid").innerHTML=`<article><h3>Groupe BPCE · Open Data</h3><p>${esc(t("bpceShare",{n:number(state.meta.bpce_share_percent)}))}</p><p>${esc(t("sourceCount",{n:number(state.meta.bpce_unique_offers)}))}</p><p>${esc(t("methodScopeText"))}</p><a href="https://www.data.gouv.fr/datasets/groupe-bpce-offres-emploi-publiques" target="_blank" rel="noopener noreferrer">${esc(t("dataset"))}</a></article><article><h3>${esc(t("editorial"))}</h3><p>${esc(t("sourceCount",{n:number(state.meta.editorial_offers)}))}</p><p>${esc(t("sourcesIntro"))}</p><a href="https://careers.capgemini.com/job/Wroc%C5%82aw-Intern-Application-Consultant-(with-German)/1406556233/" target="_blank" rel="noopener noreferrer">${esc(t("editorialExample"))}</a></article>`;
  $("#directory-grid").innerHTML=directories.map(([name,url])=>`<a href="${esc(url)}" target="_blank" rel="noopener noreferrer"><span>${esc(name)}</span><span aria-hidden="true">↗</span></a>`).join("");
  (state.meta.additional_sources||[]).forEach(source=>{
    $("#source-grid").insertAdjacentHTML("beforeend",`<article><h3>${esc(source.name)} · SmartRecruiters</h3><p>${esc(t("sourceCount",{n:number(source.offers)}))}</p><p>${esc(t("apiCoverage"))}</p><p>${esc(t("observed"))} : ${esc(dateLabel(source.observed_at))}</p><a href="${esc(safeUrl(source.url))}" target="_blank" rel="noopener noreferrer">${esc(t("source"))} : ${esc(source.name)} ↗</a></article>`);
  });
}
function setView() {
  const previous=state.view;
  const aliases={overview:"offers",careers:"domains"};const requested=location.hash.slice(1)||"offers";
  state.view=["offers","domains","sources","method"].includes(requested)?requested:aliases[requested]||"offers";
  $$(".global-view").forEach(el=>el.hidden=el.id!==state.view+"-view");
  $$("[data-view]").forEach(el=>{const active=el.dataset.view===state.view;el.classList.toggle("active",active);if(active)el.setAttribute("aria-current","page");else el.removeAttribute("aria-current");});
  if(previous!==state.view)window.scrollTo({top:0,behavior:"instant"});
}
function detailPair(key,value) {return `<div><dt>${esc(t(key))}</dt><dd>${esc(value)}</dd></div>`;}
function renderDetail(job) {
  const url=safeUrl(job.source_url);
  const evidenceFields=[["duration","duration_evidence"],["education","education_evidence"],["studyStage","study_stage_evidence"]];
  const evidence=evidenceFields.filter(([,field])=>job[field]).map(([key,field])=>`<li><strong>${esc(t(key))} :</strong> ${esc(job[field])}</li>`).join("");
  const notes=[job.duration_note,job.education_note].filter(Boolean).map(note=>`<li>${esc(note)}</li>`).join("");
  $("#job-detail").innerHTML=`<p class="detail-company">${esc(job.company)} · ${esc(domainLabel(job.domain))}</p><h2 id="detail-heading">${esc(job.title)}</h2><p class="original-note">${esc(t("originalNote"))}</p><dl class="detail-grid">${detailPair("contract",contractLabel(job.contract))}${detailPair("sourceContract",job.source_contract||job.contract)}${detailPair("duration",valueLabel(job.duration))}${detailPair("education",valueLabel(job.education_level))}${detailPair("studyStage",valueLabel(job.study_stage))}${detailPair("locations",unique(job.locations.map(x=>[x.city==="Non renseignée"?"":x.city,countryLabel(x.country_code)].filter(Boolean).join(", "))).join(" · "))}${detailPair("source",job.source)}${detailPair("observed",dateLabel(job.observed_at))}${detailPair("modified",dateLabel(job.modified_at||job.published_at))}</dl><h3>${esc(t("description"))}</h3><p class="source-copy">${esc(job.description||t("unknown"))}</p>${job.eligibility_note?`<h3>${esc(t("eligibility"))}</h3><p class="source-copy">${esc(job.eligibility_note)}</p>`:""}<details><summary>${esc(t("evidence"))}</summary><p>${esc(t(job.collection_method!=="editorial"?"automatic":"editorial"))}</p><ul>${evidence||`<li>${esc(t("unknown"))}</li>`}${notes}</ul></details><p class="original-note">${esc(t("methodContractsText"))}</p>${url?`<a class="source-visit" href="${esc(url)}" target="_blank" rel="noopener noreferrer">${esc(t("sourceVisit"))}</a><p>${esc(t("sourceFallback"))}</p><a class="source-url" href="${esc(url)}" target="_blank" rel="noopener noreferrer">${esc(url)}</a>`:""}`;
  $("#job-dialog").setAttribute("aria-labelledby","detail-heading");
  $("#detail-heading").insertAdjacentHTML("afterend",`<p class="job-status ${job.status==="closed"?"archived-status":""}">${esc(statusLabel(job))}</p>${job.status_note?`<h3>${esc(t("statusEvidence"))}</h3><p>${esc(job.status_note)}</p>`:""}`);
}
function openDetail(id,opener) {
  const job=state.jobs.find(j=>j.id===id);if(!job)return;
  state.openJob=job;state.opener=opener;renderDetail(job);$("#job-dialog").showModal();$("#close-dialog").focus();
}
function closeDetail() {$("#job-dialog").close();}
const csvCell = value => {let text=String(value??"");if(/^\s*[=+\-@]/.test(text))text="'"+text;return '"'+text.replace(/"/g,'""')+'"';};
function exportJobs(format, saved=false) {
  try {
    const filters={query:$("#search").value,...Object.fromEntries(fieldNames.map(id=>[id,$("#"+id).value])),availability:$("#availability").value,student:state.student,international:state.international,sort:$("#sort").value};
    const rows=(saved ? state.jobs.filter(job=>state.saved.has(job.id)) : state.filtered).map(job=>({...job}));
    let content,mime;
    if(format==="json") {content=JSON.stringify({meta:{...state.meta,interface_language:state.lang,selection_count:rows.length,export_scope:saved?"session_favorites":"filtered_selection",filters:saved?null:filters},jobs:rows},null,2);mime="application/json";}
    else {
      const columns=["id","title","company","domain","contract","source_contract","duration","education_level","study_stage","countries","country_codes","cities","regions","pathways","skills","source","collection_method","duration_evidence","education_evidence","study_stage_evidence","duration_note","education_note","observed_at","modified_at","published_at","source_url","status","status_origin","status_checked_at","status_note"];
      const flattened=rows.map(job=>({...job,countries:unique(job.locations.map(x=>x.country||"")).join(" | "),country_codes:unique(job.locations.map(x=>x.country_code||"")).join(" | "),cities:unique(job.locations.map(x=>x.city)).join(" | "),regions:unique(job.locations.map(x=>x.region)).join(" | "),pathways:(job.pathways||[]).join(" | "),skills:job.skills.join(" | ")}));
      content="\ufeff"+[columns,...flattened.map(row=>columns.map(key=>row[key]??""))].map(row=>row.map(csvCell).join(",")).join("\r\n");mime="text/csv;charset=utf-8";
    }
    const url=URL.createObjectURL(new Blob([content],{type:mime}));const anchor=document.createElement("a");
    anchor.href=url;anchor.download=`${saved?"elan-msi-favoris-":"elan-msi-offres-"}${state.lang}-${state.meta.observed_at.slice(0,10)}.${format}`;document.body.append(anchor);anchor.click();anchor.remove();setTimeout(()=>URL.revokeObjectURL(url),10000);
    $("#export-status").textContent=t("exportSuccess",{format:format.toUpperCase(),n:number(rows.length)});
  }catch{$("#export-status").textContent=t("exportError");}
}
async function init() {
  translateInterface();setView();
  try {
    const response=await fetch("./data/jobs.json");if(!response.ok)throw new Error("HTTP");
    const data=await response.json();
    const catalogResponse=await fetch("./data/catalog.json");if(!catalogResponse.ok)throw new Error("catalog");
    state.catalog=await catalogResponse.json();
    try{const updateResponse=await fetch("./data/update-status.json",{cache:"no-store"});if(updateResponse.ok)state.update=await updateResponse.json();}catch{/* Dataset remains usable even if status is unavailable. */}
    if(!data.meta || !Array.isArray(data.meta.domain_options) || !Array.isArray(data.jobs) || !data.jobs.length)throw new Error("schema");
    if(data.jobs.some(job=>!Array.isArray(job.locations)||!Array.isArray(job.skills)))throw new Error("schema");
    state.jobs=data.jobs;state.meta=data.meta;state.ready=true;$("#loading").hidden=true;$("#load-error").hidden=true;$("#loaded").hidden=false;
    if($("#offer-preview"))$("#offer-preview").hidden=true;
    translateInterface();
    if(new URLSearchParams(location.search).get("status")==="archived"){$("#availability").value="archived";state.student=false;$("#advanced").open=true;}
    filterJobs();
  }catch{state.ready=false;$("#loaded").hidden=true;$("#loading").hidden=true;$("#load-error").hidden=false;}
}
$("#language").addEventListener("change",event=>{
  state.lang=event.target.value;
  try{const url=new URL(location.href);url.searchParams.set("lang",state.lang);history.replaceState(null,"",url);}catch{/* Opaque previews retain language in memory. */}
  // Preserve the selected set when changing language; language is not a data filter.
  translateInterface();
});
$("#search").addEventListener("input",()=>{state.page=1;filterJobs();});
fieldNames.forEach(id=>$("#"+id).addEventListener("change",()=>{
  if(id==="contract" && $("#contract").value && !["Stage","Alternance"].includes($("#contract").value))state.student=false;
  state.page=1;filterJobs();
}));
$("#sort").addEventListener("change",()=>{state.page=1;filterJobs();});
["reset","empty-reset","archive-reset"].forEach(id=>$("#"+id).addEventListener("click",resetFilters));
$("#student").addEventListener("click",()=>{state.student=!state.student;if(state.student)$("#contract").value="";state.page=1;filterJobs();});
$("#international").addEventListener("click",()=>{state.international=!state.international;state.page=1;filterJobs();});
$("#ara").addEventListener("click",()=>{$("#region").value=$("#region").value==="Auvergne-Rhône-Alpes"?"":"Auvergne-Rhône-Alpes";state.page=1;filterJobs();});
$("#prev").addEventListener("click",()=>{state.page--;renderResults();$("#result-count").scrollIntoView({block:"start"});});
$("#next").addEventListener("click",()=>{state.page++;renderResults();$("#result-count").scrollIntoView({block:"start"});});
$("#job-list").addEventListener("click",event=>{const button=event.target.closest("[data-job]");if(button)openDetail(button.dataset.job,button);});
$("#domain-grid").addEventListener("click",event=>{const button=event.target.closest("[data-pathway]");if(button){resetFilters();$("#pathway").value=button.dataset.pathway;$("#advanced").open=true;filterJobs();location.hash="offers";}});
$("#availability").addEventListener("change",()=>{if($("#availability").value==="archived"){state.student=false;$("#contract").value="";}state.page=1;filterJobs();});
$("#close-dialog").addEventListener("click",closeDetail);
$("#job-dialog").addEventListener("close",()=>{
  state.openJob=null;
  // Language rerender may replace the original button.
  const current=state.opener?.dataset.job?$$("[data-job]").find(el=>el.dataset.job===state.opener.dataset.job):null;
  (current||$("#result-count")).focus();state.opener=null;
});
$("#result-count").tabIndex=-1;
$("#export-csv").addEventListener("click",()=>exportJobs("csv"));$("#export-json").addEventListener("click",()=>exportJobs("json"));
$("#saved-only").addEventListener("click",()=>{state.savedOnly=!state.savedOnly;state.page=1;filterJobs();});
$("#saved-csv").addEventListener("click",()=>exportJobs("csv",true));$("#saved-json").addEventListener("click",()=>exportJobs("json",true));
$("#job-list").addEventListener("click",event=>{
  const button=event.target.closest("[data-save]");if(!button)return;
  const id=button.dataset.save;if(!state.jobs.some(job=>job.id===id))return;
  if(state.saved.has(id))state.saved.delete(id);else state.saved.add(id);
  filterJobs();const replacement=$$("[data-save]").find(el=>el.dataset.save===id);
  (replacement||$("#saved-only")).focus();
});
$("#retry").addEventListener("click",()=>location.reload());
window.addEventListener("hashchange",setView);
init();
