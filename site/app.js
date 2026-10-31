/* DataScope : affichage statique, état en mémoire, aucune clé et aucun suivi. */
"use strict";
const $ = selector => document.querySelector(selector);
const $$ = selector => [...document.querySelectorAll(selector)];
const state = {jobs:[],meta:null,filtered:[],page:1,pageSize:8,view:"overview",student:false};
const fmt = new Intl.NumberFormat("fr-FR");
const esc = s => String(s ?? "").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const normal = s => String(s||"").normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase();
const unique = xs => [...new Set(xs)];
const count = xs => xs.reduce((acc,x)=>(acc[x]=(acc[x]||0)+1,acc),{});
const ranked = xs => Object.entries(count(xs)).sort((a,b)=>b[1]-a[1]||a[0].localeCompare(b[0],"fr"));
const dateFR = value => value ? new Intl.DateTimeFormat("fr-FR",{day:"2-digit",month:"long",year:"numeric"}).format(new Date(value)) : "Non renseignée";
const isStudent = j => ["Stage","Alternance"].includes(j.contract);
const safeUrl = value => {try {const u=new URL(value);return u.protocol==="https:"?u.href:"";}catch{return "";}};
const csvCell = value => {
  let s=String(value??"");
  if(/^\s*[=+\-@]/.test(s))s="'"+s;
  return '"'+s.replace(/"/g,'""')+'"';
};

function populate(id,values) {
  const el=$("#"+id);
  values.sort((a,b)=>a.localeCompare(b,"fr")).forEach(value=>{
    const o=document.createElement("option");o.value=value;o.textContent=value;el.append(o);
  });
}
function setView(view) {
  state.view=["overview","offers","method"].includes(view)?view:"overview";
  $$(".nav-item").forEach(el=>{
    el.classList.toggle("active",el.dataset.view===state.view);
    if(el.dataset.view===state.view)el.setAttribute("aria-current","page");else el.removeAttribute("aria-current");
  });
  $("#overview-view").hidden=state.view!=="overview";
  $("#offers-section").hidden=state.view==="method";
  $("#method-view").hidden=state.view!=="method";
  $("#filter-section").hidden=state.view==="method";
  $(".filter-bottom").hidden=state.view==="method";
}
function filterJobs(){
  const q=normal($("#search").value.trim()), family=$("#family").value, region=$("#region").value, contract=$("#contract").value, skill=$("#skill").value;
  state.filtered=state.jobs.filter(j=>
    (!q||normal([j.title,j.company,j.family,...j.locations.flatMap(x=>[x.city,x.region]),...j.skills].join(" ")).includes(q))&&
    (!family||j.family===family)&&(!region||j.locations.some(x=>x.region===region))&&
    (!contract||j.contract===contract)&&(!skill||j.skills.includes(skill))&&(!state.student||isStudent(j))
  );
  const sorting=$("#sort").value;
  state.filtered.sort((a,b)=>sorting==="title"?a.title.localeCompare(b.title,"fr"):sorting==="company"?a.company.localeCompare(b.company,"fr"):(b.modified_at||"").localeCompare(a.modified_at||""));
  const active=[q&&`Recherche : ${$("#search").value}`,family,region,contract,skill,state.student&&"Stages et alternance"].filter(Boolean);
  $("#active-summary").textContent=`${state.filtered.length} annonces. ${active.join(". ")||"Tous les métiers, toutes les régions."}`;
  $$("[data-quick]").forEach(el=>el.setAttribute("aria-pressed",String(el.dataset.quick==="student"?state.student:region==="Auvergne-Rhône-Alpes")));
  renderMetrics();renderCharts();renderTable();
}
function renderMetrics(){
  const rows=state.filtered,n=rows.length;
  $("#stat-jobs").textContent=fmt.format(n);
  $("#stat-jobs-note").textContent=`sur ${state.jobs.length} dans l’instantané`;
  const students=rows.filter(isStudent).length;
  $("#stat-student").textContent=fmt.format(students);
  $("#stat-student-note").textContent=n?`${Math.round(students/n*100)} % des annonces sélectionnées`:"Aucune annonce sélectionnée";
  $("#stat-regions").textContent=unique(rows.flatMap(j=>j.locations.map(x=>x.region)).filter(x=>x!=="Non renseignée")).length;
  const top=ranked(rows.flatMap(j=>j.skills))[0];
  $("#stat-skill").textContent=top?top[0]:"—";
  $("#stat-skill-note").textContent=top?`${top[1]} annonces sur ${n} (${Math.round(top[1]/n*100)} %)`:"Aucune mention détectée";
}
function bars(target,entries,total,type){
  const root=$(target);
  if(!entries.length){root.innerHTML='<p class="no-chart">Aucune donnée pour ces filtres. Élargissez votre sélection.</p>';return;}
  root.innerHTML=entries.slice(0,7).map(([label,n])=>{
    const value=type==="skill"?`${Math.round(n/total*100)} %`:String(n);
    const width=type==="skill"?n/total*100:n/entries[0][1]*100;
    return `<button type="button" class="bar-row" data-chart="${type}" data-value="${esc(label)}" aria-label="${esc(label)} : ${n} annonces. Filtrer."><span class="bar-label">${esc(label)}</span><span class="bar-track" aria-hidden="true"><span class="bar-fill" style="--width:${width}%"></span></span><span class="bar-value">${esc(value)}</span></button>`;
  }).join("");
  root.querySelectorAll("button").forEach(btn=>btn.addEventListener("click",()=>{
    const field=btn.dataset.chart==="skill"?"skill":"region";
    $("#"+field).value=btn.dataset.value;
    state.page=1;filterJobs();
  }));
}
function renderCharts(){
  bars("#skills-chart",ranked(state.filtered.flatMap(j=>j.skills)),state.filtered.length,"skill");
  bars("#regions-chart",ranked(state.filtered.flatMap(j=>unique(j.locations.map(x=>x.region)))),state.filtered.length,"region");
}
function renderTable(){
  const n=state.filtered.length,max=Math.max(1,Math.ceil(n/state.pageSize));
  state.page=Math.max(1,Math.min(state.page,max));
  const from=(state.page-1)*state.pageSize,rows=state.filtered.slice(from,from+state.pageSize);
  $("#result-count").textContent=`(${n})`;
  $("#result-detail").textContent=`${n} annonce${n>1?"s":""} unique${n>1?"s":""} · Instantané du ${dateFR(state.meta.observed_at)}`;
  $("#jobs-table").innerHTML=rows.map(j=>{
    const cities=unique(j.locations.map(x=>x.city)), regions=unique(j.locations.map(x=>x.region));
    return `<tr><td><button class="job-title" type="button" data-job="${esc(j.id)}">${esc(j.title)}</button><span class="job-company">${esc(j.company)}</span></td><td>${esc(cities.slice(0,2).join(", "))}${cities.length>2?` + ${cities.length-2} villes`:""}<span class="location-detail">${regions.length===1?esc(regions[0]):regions.length+" régions"}</span></td><td><span class="contract-tag ${isStudent(j)?"student":""}">${esc(j.contract)}</span></td><td><div class="tags">${j.skills.length?j.skills.slice(0,3).map(s=>`<span class="tag">${esc(s)}</span>`).join("")+(j.skills.length>3?`<span class="tag">+${j.skills.length-3}</span>`:""):'<span class="muted">Non détectées</span>'}</div></td><td><button class="detail-btn" type="button" data-job="${esc(j.id)}" aria-label="Détails : ${esc(j.title)}">↗</button></td></tr>`;
  }).join("");
  $$("[data-job]").forEach(el=>el.addEventListener("click",()=>openJob(el.dataset.job)));
  $("#empty").hidden=n!==0;$(".table-wrap").hidden=n===0;
  $("#page-label").textContent=n?`${from+1}–${Math.min(from+state.pageSize,n)} sur ${n} · Page ${state.page}/${max}`:"0 annonce";
  $("#prev").disabled=state.page<=1;$("#next").disabled=state.page>=max;
  $("#export-csv").disabled=n===0;$("#export-json").disabled=n===0;
}
function reset(){
  ["search","family","region","contract","skill"].forEach(id=>$("#"+id).value="");
  state.student=false;state.page=1;filterJobs();
}
function openJob(id){
  const j=state.jobs.find(x=>x.id===id);if(!j)return;
  const url=safeUrl(j.source_url);
  $("#job-detail").innerHTML=`
    <h2>${esc(j.title)}</h2><p class="detail-meta">${esc(j.company)} · ${esc(j.contract)}<br>${esc(j.family)}</p>
    <div class="tags">${j.skills.map(s=>`<span class="tag">${esc(s)}</span>`).join("")||'<span class="muted">Aucune compétence du dictionnaire détectée.</span>'}</div>
    <p class="detail-locations">${j.locations.map(x=>esc(x.city)+" · "+esc(x.region)).join("<br>")}</p>
    <div class="detail-source"><p><b>Source : ${esc(j.source)}</b><br>Collectée le ${esc(dateFR(j.observed_at))} · Dernière modification source : ${esc(dateFR(j.modified_at))}<br>Référence : ${esc(j.id)}. L’ouverture actuelle du poste n’est pas garantie par cet instantané.</p>
    ${url?`<a class="primary-btn" href="${esc(url)}" target="_blank" rel="noopener noreferrer">Vérifier sur le site employeur ↗</a><p class="selectable-url">${esc(url)}</p>`:'<p>Lien employeur indisponible.</p>'}</div>
    <h3>Description publiée par l’employeur</h3><p class="job-description">${esc(j.description||"Description non renseignée.")}</p>`;
  $("#job-dialog").showModal();document.body.style.overflow="hidden";
}
function download(kind){
  const flat=state.filtered.map(j=>({
    reference:j.id,intitule:j.title,entreprise:j.company,metier:j.family,contrat:j.contract,
    villes:unique(j.locations.map(x=>x.city)).join(" | "),regions:unique(j.locations.map(x=>x.region)).join(" | "),
    competences:j.skills.join(" | "),modification_source:j.modified_at||"",collecte:j.observed_at,source:j.source_url
  }));
  const text=kind==="json"?JSON.stringify({meta:{...state.meta,exported_at:new Date().toISOString(),filtered_count:flat.length},jobs:flat},null,2):
    "\uFEFF"+[Object.keys(flat[0]).map(csvCell).join(";"),...flat.map(r=>Object.values(r).map(csvCell).join(";"))].join("\r\n");
  const blob=new Blob([text],{type:kind==="json"?"application/json;charset=utf-8":"text/csv;charset=utf-8"});
  const url=URL.createObjectURL(blob),a=document.createElement("a");
  a.href=url;a.download=`datascope-offres-${new Date().toISOString().slice(0,10)}.${kind}`;document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),20000);
  $("#export-status").textContent=`Export ${kind.toUpperCase()} préparé : ${flat.length} annonces de la sélection, avec leurs sources et dates de collecte.`;
}
async function init(){
  try{
    const response=await fetch("./data/jobs.json");
    if(!response.ok)throw new Error("HTTP "+response.status);
    const data=await response.json();if(!data.meta||!Array.isArray(data.jobs))throw new Error("Format inattendu");
    state.jobs=data.jobs;state.meta=data.meta;
    $("#nav-count").textContent=data.jobs.length;
    $("#snapshot-date").textContent=dateFR(data.meta.observed_at);
    populate("family",unique(data.jobs.map(j=>j.family)));
    populate("region",unique(data.jobs.flatMap(j=>j.locations.map(x=>x.region))));
    populate("contract",unique(data.jobs.map(j=>j.contract)));
    populate("skill",unique(data.jobs.flatMap(j=>j.skills)));
    $("#salary-note").textContent=`Dans cet instantané, ${data.meta.salary_available} annonce sur ${data.jobs.length} renseigne un champ salarial structuré. Aucune moyenne salariale n’est calculée ; aucun salaire n’est estimé ou inventé.`;
    $("#audit-counts").textContent=`${data.meta.raw_rows} lignes source → ${data.meta.france_rows} lignes France → ${data.meta.matched_location_rows} lignes data / business analyst → ${data.jobs.length} annonces uniques.`;
    $("#audit-meta").textContent=JSON.stringify(data.meta,null,2);
    $("#loaded").hidden=false;
    ["search","family","region","contract","skill"].forEach(id=>$("#"+id).addEventListener(id==="search"?"input":"change",()=>{state.page=1;filterJobs();}));
    $("#sort").addEventListener("change",()=>{state.page=1;filterJobs();});
    ["reset","empty-reset"].forEach(id=>$("#"+id).addEventListener("click",reset));
    $$("[data-quick]").forEach(el=>el.addEventListener("click",()=>{
      if(el.dataset.quick==="student"){state.student=!state.student;if(state.student)$("#contract").value="";}
      else $("#region").value=$("#region").value==="Auvergne-Rhône-Alpes"?"":"Auvergne-Rhône-Alpes";
      state.page=1;filterJobs();
    }));
    $("#prev").addEventListener("click",()=>{state.page--;renderTable();});
    $("#next").addEventListener("click",()=>{state.page++;renderTable();});
    $("#export-csv").addEventListener("click",()=>download("csv"));
    $("#export-json").addEventListener("click",()=>download("json"));
    $("#close-dialog").addEventListener("click",()=>$("#job-dialog").close());
    $("#job-dialog").addEventListener("close",()=>document.body.style.overflow="");
    $("#job-dialog").addEventListener("click",event=>{if(event.target===$("#job-dialog")){const r=event.target.getBoundingClientRect();if(event.clientX<r.left||event.clientX>r.right||event.clientY<r.top||event.clientY>r.bottom)event.target.close();}});
    window.addEventListener("hashchange",()=>setView(location.hash.slice(1)));
    setView(location.hash.slice(1));filterJobs();
  }catch(error){
    $("#snapshot-date").textContent="Chargement interrompu";
    $("#load-error").hidden=false;
    $("#load-error").textContent="Les données n’ont pas pu être chargées. Rechargez la page ou lancez le site avec un serveur local (voir README). Aucun chiffre de démonstration n’a été substitué.";
    console.error(error);
  }
}
init();
