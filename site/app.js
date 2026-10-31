/* Élan MSI : HTML/CSS/JS sans framework, état en mémoire, aucune clé privée. */
"use strict";
const $ = selector => document.querySelector(selector);
const $$ = selector => [...document.querySelectorAll(selector)];
const state = {jobs:[],meta:null,catalog:null,filtered:[],page:1,pageSize:8,view:"overview",student:false,careerPath:""};
const fmt = new Intl.NumberFormat("fr-FR");
const esc = s => String(s ?? "").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const normal = s => String(s||"").normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase();
const unique = xs => [...new Set(xs)];
const count = xs => xs.reduce((acc,x)=>(acc[x]=(acc[x]||0)+1,acc),{});
const ranked = xs => Object.entries(count(xs)).sort((a,b)=>b[1]-a[1]||a[0].localeCompare(b[0],"fr"));
const dateFR = v => v && !Number.isNaN(Date.parse(v)) ? new Intl.DateTimeFormat("fr-FR",{day:"2-digit",month:"long",year:"numeric",timeZone:"Europe/Paris"}).format(new Date(v)) : "Non renseignée";
const isStudent = j => ["Stage","Alternance"].includes(j.contract);
const safeUrl = value => {try{const u=new URL(value);return u.protocol==="https:"?u.href:"";}catch{return "";}};
const isAutomatic = j => j.collection_method==="open_data";
const fields = ["search","pathway","family","region","contract","source","skill"];
const csvCell = value => {let s=String(value??"");if(/^\s*[=+\-@]/.test(s))s="'"+s;return '"'+s.replace(/"/g,'""')+'"';};
function populate(id,values){
  const el=$("#"+id);
  values.sort((a,b)=>a.localeCompare(b,"fr")).forEach(value=>{const o=document.createElement("option");o.value=value;o.textContent=value;el.append(o);});
}
function setView(view){
  const previous=state.view;
  state.view=["overview","offers","careers","sources","method"].includes(view)?view:"overview";
  $$(".nav-item").forEach(el=>{
    el.classList.toggle("active",el.dataset.view===state.view);
    if(el.dataset.view===state.view)el.setAttribute("aria-current","page");else el.removeAttribute("aria-current");
  });
  ["overview","careers","sources","method"].forEach(v=>$("#"+v+"-view").hidden=state.view!==v);
  const explore=["overview","offers"].includes(state.view);
  $("#offers-section").hidden=!explore;
  $("#filter-section").hidden=!explore;
  $(".filter-bottom").hidden=!explore;
  $("#active-summary").hidden=!explore;
  $("#pathways-section").hidden=state.view!=="overview";
  if(previous!==state.view)window.scrollTo({top:0,behavior:"instant"});
}
function filterJobs(){
  const q=normal($("#search").value.trim()), family=$("#family").value, region=$("#region").value,
    contract=$("#contract").value, skill=$("#skill").value, source=$("#source").value, pathway=$("#pathway").value;
  state.filtered=state.jobs.filter(j=>
    (!q||normal([j.title,j.company,j.family,j.source,...j.pathways,...j.locations.flatMap(x=>[x.city,x.region]),...j.skills].join(" ")).includes(q))&&
    (!family||j.family===family)&&(!region||j.locations.some(x=>x.region===region))&&
    (!contract||j.contract===contract)&&(!skill||j.skills.includes(skill))&&(!source||j.source===source)&&
    (!pathway||j.pathways.includes(pathway))&&(!state.student||isStudent(j))
  );
  const sorting=$("#sort").value;
  state.filtered.sort((a,b)=>sorting==="title"?a.title.localeCompare(b.title,"fr"):sorting==="company"?a.company.localeCompare(b.company,"fr"):(b.modified_at||b.published_at||"").localeCompare(a.modified_at||a.published_at||""));
  const active=[q&&`Recherche : ${$("#search").value}`,pathway,family,region,contract,source,skill,state.student&&"Stages et alternance"].filter(Boolean);
  $("#active-summary").textContent=`${state.filtered.length} annonces · ${active.join(" · ")||"Tous les parcours, toutes les sources."}`;
  $$("[data-quick]").forEach(el=>el.setAttribute("aria-pressed",String(el.dataset.quick==="student"?state.student:region==="Auvergne-Rhône-Alpes")));
  $$("[data-pathway]").forEach(el=>el.setAttribute("aria-pressed",String(el.dataset.pathway===pathway)));
  renderMetrics();renderCharts();renderTable();
}
function renderMetrics(){
  const rows=state.filtered,n=rows.length,automatic=rows.filter(isAutomatic),students=rows.filter(isStudent).length;
  $("#stat-jobs").textContent=fmt.format(n);$("#stat-jobs-note").textContent=`sur ${state.jobs.length} dans le corpus`;
  $("#stat-student").textContent=fmt.format(students);
  $("#stat-student-note").textContent=n?`${Math.round(students/n*100)} % des annonces sélectionnées`:"Aucune annonce sélectionnée";
  $("#stat-regions").textContent=unique(rows.flatMap(j=>j.locations.map(x=>x.region)).filter(x=>x!=="Non renseignée")).length;
  const top=ranked(automatic.flatMap(j=>j.skills))[0];
  $("#stat-skill").textContent=top?top[0]:"Non calculé";
  $("#stat-skill-note").textContent=top?`${top[1]} sur ${automatic.length} offres BPCE (${Math.round(top[1]/automatic.length*100)} %)`:"Pas de description BPCE dans cette sélection";
  $("#corpus-note").textContent=`Corpus complet : ${state.meta.bpce_unique_offers} offres BPCE + ${state.meta.editorial_offers} fiches éditoriales. Les parcours peuvent se recouper ; ces chiffres ne mesurent pas le marché de l’emploi.`;
  $("#skill-denominator").textContent=`Part des ${automatic.length} offres BPCE sélectionnées. Cliquez pour filtrer.`;
}
function bars(target,entries,total,type){
  const root=$(target);
  if(!entries.length){root.innerHTML='<p class="no-chart">Pas de données comparables pour cette sélection. Les fiches éditoriales ne sont pas incluses dans les statistiques de compétences.</p>';return;}
  root.innerHTML=entries.slice(0,7).map(([label,n])=>{
    const value=type==="skill"?`${Math.round(n/total*100)} %`:String(n),width=type==="skill"?n/total*100:n/entries[0][1]*100;
    return `<button type="button" class="bar-row" data-chart="${type}" data-value="${esc(label)}" aria-label="${esc(label)} : ${n} annonces. Filtrer."><span class="bar-label">${esc(label)}</span><span class="bar-track" aria-hidden="true"><span class="bar-fill" style="--width:${width}%"></span></span><span class="bar-value">${esc(value)}</span></button>`;
  }).join("");
  root.querySelectorAll("button").forEach(btn=>btn.addEventListener("click",()=>{$("#"+(btn.dataset.chart==="skill"?"skill":"region")).value=btn.dataset.value;state.page=1;filterJobs();}));
}
function renderCharts(){
  const automatic=state.filtered.filter(isAutomatic);
  bars("#skills-chart",ranked(automatic.flatMap(j=>j.skills)),automatic.length,"skill");
  bars("#regions-chart",ranked(state.filtered.flatMap(j=>unique(j.locations.map(x=>x.region)))),state.filtered.length,"region");
}
function renderTable(){
  const n=state.filtered.length,max=Math.max(1,Math.ceil(n/state.pageSize));state.page=Math.max(1,Math.min(state.page,max));
  const from=(state.page-1)*state.pageSize,rows=state.filtered.slice(from,from+state.pageSize);
  $("#result-count").textContent=`(${n})`;
  $("#result-detail").textContent=`${n} annonce${n>1?"s":""} · corpus daté du ${dateFR(state.meta.observed_at)} · disponibilité à vérifier`;
  $("#jobs-table").innerHTML=rows.map(j=>{
    const cities=unique(j.locations.map(x=>x.city)),regions=unique(j.locations.map(x=>x.region));
    return `<tr><td><button class="job-title" type="button" data-job="${esc(j.id)}">${esc(j.title)}</button><span class="job-company">${esc(j.company)}</span><span class="job-provenance">${esc(j.source)}</span><span class="path-label">${j.pathways.map(esc).join(" / ")} · ${isAutomatic(j)?"Open Data":"Sélection éditoriale"}</span></td><td>${esc(cities.slice(0,2).join(", "))}${cities.length>2?` + ${cities.length-2} villes`:""}<span class="location-detail">${regions.length===1?esc(regions[0]):regions.length+" régions"}</span></td><td><span class="contract-tag ${isStudent(j)?"student":""}">${esc(j.contract)}</span></td><td><div class="tags">${j.skills.length?j.skills.slice(0,3).map(s=>`<span class="tag">${esc(s)}</span>`).join("")+(j.skills.length>3?`<span class="tag">+${j.skills.length-3}</span>`:""):'<span class="muted">Non documentées</span>'}</div></td><td><button class="detail-btn" type="button" data-job="${esc(j.id)}" aria-label="Détails : ${esc(j.title)}">↗</button></td></tr>`;
  }).join("");
  $$("[data-job]").forEach(el=>el.addEventListener("click",()=>openJob(el.dataset.job)));
  $("#empty").hidden=n!==0;$(".table-wrap").hidden=n===0;
  $("#page-label").textContent=n?`${from+1}–${Math.min(from+state.pageSize,n)} sur ${n} · Page ${state.page}/${max}`:"0 annonce";
  $("#prev").disabled=state.page<=1;$("#next").disabled=state.page>=max;
  $("#export-csv").disabled=n===0;$("#export-json").disabled=n===0;
}
function reset(){
  fields.forEach(id=>$("#"+id).value="");state.student=false;state.page=1;
  $("#export-status").textContent="";filterJobs();
}
function openJob(id){
  const j=state.jobs.find(x=>x.id===id);if(!j)return;
  const url=safeUrl(j.source_url),editorial=!isAutomatic(j);
  $("#job-detail").innerHTML=`
    <h2>${esc(j.title)}</h2><p class="detail-meta">${esc(j.company)} · ${esc(j.contract)}<br>${esc(j.family)} · ${j.pathways.map(esc).join(" / ")}</p>
    <div class="tags">${j.skills.map(s=>`<span class="tag">${esc(s)}</span>`).join("")||'<span class="muted">Aucun mot-clé du dictionnaire documenté.</span>'}</div>
    <p class="detail-locations">${j.locations.map(x=>esc(x.city)+" · "+esc(x.region)).join("<br>")}</p>
    <div class="detail-source"><p><b>Source : ${esc(j.source)}</b><br>${editorial?"Page consultée":"Export collecté"} le ${esc(dateFR(j.observed_at))}<br>${j.published_at?`Publication : ${esc(dateFR(j.published_at))}`:`Dernière modification source : ${esc(dateFR(j.modified_at))}`}<br>Mode : ${editorial?"sélection éditoriale, pas de flux automatique":"Open Data BPCE, pipeline Python"}. Référence : ${esc(j.id)}.</p><p>L’ouverture actuelle du poste n’est pas garantie. Vérifie la page d’origine et le profil demandé avant de candidater.</p>
    ${url?`<a class="primary-btn" href="${esc(url)}" target="_blank" rel="noopener noreferrer">Consulter l’annonce d’origine ↗</a><p class="selectable-url">${esc(url)}</p>`:'<p>Lien source indisponible.</p>'}</div>
    ${j.eligibility_note?`<aside class="eligibility"><b>Point de vigilance</b><p>${esc(j.eligibility_note)}</p></aside>`:""}
    <h3>${editorial?"Notre synthèse de l’annonce":"Description publiée par l’employeur"}</h3><p class="job-description">${esc(j.description||"Description non renseignée.")}</p>
    ${editorial?'<p class="muted">Synthèse originale abrégée. Le texte complet et les conditions figurent sur la plateforme source.</p>':""}`;
  $("#job-dialog").showModal();document.body.style.overflow="hidden";
}
function renderPathways(){
  $("#pathway-cards").innerHTML=state.catalog.pathways.map((p,i)=>{
    const n=state.jobs.filter(j=>j.pathways.includes(p.id)).length;
    return `<button type="button" class="pathway-card" data-pathway="${esc(p.id)}" aria-pressed="false"><span class="pathway-top"><span>${String(i+1).padStart(2,"0")} / ${esc(p.id)}</span><span aria-hidden="true">↗</span></span><h3>${esc(p.name)}</h3><p>${esc(p.line)}</p><span class="pathway-bottom">${n} offres rattachées dans le corpus <span aria-hidden="true">→</span></span></button>`;
  }).join("");
  $$("[data-pathway]").forEach(btn=>btn.addEventListener("click",()=>{$("#pathway").value=$("#pathway").value===btn.dataset.pathway?"":btn.dataset.pathway;state.page=1;filterJobs();}));
}
function renderCareers(){
  const rows=state.catalog.careers.filter(c=>!state.careerPath||c.pathways.includes(state.careerPath));
  $("#career-summary").textContent=`${rows.length} fiches · ${state.careerPath||"tous les parcours"} · les idées de projets sont des suggestions pédagogiques.`;
  $("#career-grid").innerHTML=rows.map(c=>{
    const n=state.jobs.filter(j=>j.family===c.family).length;
    const p=state.catalog.pathways.find(x=>x.id===(state.careerPath||c.pathways[0]));
    const source=safeUrl(p?.url);
    return `<article class="career-card"><div class="career-kicker"><span>${c.pathways.map(esc).join(" / ")}</span><span>${esc(c.kind)}</span></div><h3>${esc(c.name)}</h3><p class="level-note">${esc(c.level)}</p><p>${esc(c.mission)}</p><details class="project-idea"><summary>Un projet pour se préparer</summary><p>${esc(c.project)}</p></details><div class="career-actions"><button type="button" class="text-link" data-career-family="${esc(c.family)}">${n?`${n} offre${n>1?"s":""} de cette famille`:"Explorer cette famille"} →</button><a href="${esc(source)}" target="_blank" rel="noopener noreferrer">Parcours officiel ↗</a></div></article>`;
  }).join("");
  $$("[data-career-family]").forEach(btn=>btn.addEventListener("click",()=>{
    reset();$("#family").value=btn.dataset.careerFamily;state.page=1;filterJobs();location.hash="offers";setView("offers");$("#offers-section").scrollIntoView({block:"start"});
  }));
  $$("[data-career-path]").forEach(btn=>btn.setAttribute("aria-pressed",String(btn.dataset.careerPath===state.careerPath)));
}
function renderSources(){
  $("#source-grid").innerHTML=state.catalog.sources.map(s=>{
    const n=state.jobs.filter(j=>j.source_key===s.id).length;
    return `<article class="source-card"><div class="career-kicker"><span>${esc(s.tag)}</span><span>${n} fiche${n>1?"s":""}</span></div><h3>${esc(s.name)}</h3><p class="source-mode">${esc(s.mode)}</p><p>${esc(s.text)}</p><p class="source-terms">${esc(s.use)}</p><div class="source-actions"><button type="button" class="secondary-btn" data-source-pick="${esc(s.id)}">${n===1?"Voir la fiche":`Voir les ${n} fiches`} →</button><a href="${esc(safeUrl(s.url))}" target="_blank" rel="noopener noreferrer">Ouvrir la source ↗</a><a href="${esc(safeUrl(s.secondary_url))}" target="_blank" rel="noopener noreferrer">${esc(s.secondary_label)} ↗</a></div><p class="selectable-url">${esc(s.url)}</p></article>`;
  }).join("");
  $$("[data-source-pick]").forEach(btn=>btn.addEventListener("click",()=>{
    reset();const job=state.jobs.find(j=>j.source_key===btn.dataset.sourcePick);
    if(job)$("#source").value=job.source;filterJobs();location.hash="offers";setView("offers");$("#offers-section").scrollIntoView({block:"start"});
  }));
}
function download(kind){
  const flat=state.filtered.map(j=>({
    reference:j.id,intitule:j.title,entreprise:j.company,metier:j.family,parcours:j.pathways.join(" | "),contrat:j.contract,
    villes:unique(j.locations.map(x=>x.city)).join(" | "),regions:unique(j.locations.map(x=>x.region)).join(" | "),
    competences:j.skills.join(" | "),provenance:j.source,mode_collecte:j.collection_method,publication:j.published_at||"",
    modification_source:j.modified_at||"",collecte:j.observed_at,source:j.source_url
  }));
  if(!flat.length)return;
  const text=kind==="json"?JSON.stringify({meta:{...state.meta,exported_at:new Date().toISOString(),filtered_count:flat.length},jobs:flat},null,2):
    "\uFEFF"+[Object.keys(flat[0]).map(csvCell).join(";"),...flat.map(r=>Object.values(r).map(csvCell).join(";"))].join("\r\n");
  const url=URL.createObjectURL(new Blob([text],{type:kind==="json"?"application/json;charset=utf-8":"text/csv;charset=utf-8"})),a=document.createElement("a");
  a.href=url;a.download=`elan-msi-offres-${new Date().toISOString().slice(0,10)}.${kind}`;document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),20000);
  $("#export-status").textContent=`Export ${kind.toUpperCase()} préparé : ${flat.length} annonces sélectionnées, avec parcours, provenance et dates.`;
}
async function init(){
  try{
    const responses=await Promise.all([fetch("./data/jobs.json"),fetch("./data/catalog.json")]);
    if(responses.some(r=>!r.ok))throw new Error("Chargement des fichiers de données interrompu");
    const [data,catalog]=await Promise.all(responses.map(r=>r.json()));
    if(!data.meta||!Array.isArray(data.jobs)||!Array.isArray(catalog.careers)||!Array.isArray(catalog.pathways))throw new Error("Format inattendu");
    state.jobs=data.jobs;state.meta=data.meta;state.catalog=catalog;
    $("#nav-count").textContent=data.jobs.length;$("#snapshot-date").textContent=dateFR(data.meta.observed_at);
    populate("pathway",catalog.pathways.map(p=>p.id));populate("family",unique([...data.jobs.map(j=>j.family),...catalog.careers.map(c=>c.family)]));
    populate("region",unique(data.jobs.flatMap(j=>j.locations.map(x=>x.region))));populate("contract",unique(data.jobs.map(j=>j.contract)));
    populate("source",unique(data.jobs.map(j=>j.source)));populate("skill",unique(data.jobs.flatMap(j=>j.skills)));
    $("#salary-note").textContent=`${data.meta.salary_available} sur ${data.jobs.length} annonces contiennent un champ salarial structuré exploitable. Aucun salaire moyen n’est calculé.`;
    $("#audit-counts").textContent=`BPCE : ${data.meta.raw_rows} lignes → ${data.meta.france_rows} lignes France → ${data.meta.matched_location_rows} lignes MSI → ${data.meta.bpce_unique_offers} annonces uniques. Complément : ${data.meta.editorial_offers} fiches éditoriales. Total : ${data.jobs.length}.`;
    $("#audit-meta").textContent=JSON.stringify(data.meta,null,2);
    $("#academic-links").innerHTML=catalog.pathways.map(p=>`<a href="${esc(safeUrl(p.url))}" target="_blank" rel="noopener noreferrer">${esc(p.id)} : page officielle ↗</a>`).join("");
    renderPathways();renderCareers();renderSources();$("#loaded").hidden=false;
    fields.forEach(id=>$("#"+id).addEventListener(id==="search"?"input":"change",()=>{state.page=1;$("#export-status").textContent="";filterJobs();}));
    $("#sort").addEventListener("change",()=>{state.page=1;filterJobs();});
    ["reset","empty-reset"].forEach(id=>$("#"+id).addEventListener("click",reset));
    $$("[data-quick]").forEach(el=>el.addEventListener("click",()=>{
      if(el.dataset.quick==="student"){state.student=!state.student;if(state.student)$("#contract").value="";}
      else $("#region").value=$("#region").value==="Auvergne-Rhône-Alpes"?"":"Auvergne-Rhône-Alpes";
      state.page=1;filterJobs();
    }));
    $$("[data-career-path]").forEach(el=>el.addEventListener("click",()=>{state.careerPath=el.dataset.careerPath;renderCareers();}));
    $("#prev").addEventListener("click",()=>{state.page--;renderTable();});$("#next").addEventListener("click",()=>{state.page++;renderTable();});
    $("#export-csv").addEventListener("click",()=>download("csv"));$("#export-json").addEventListener("click",()=>download("json"));
    $("#close-dialog").addEventListener("click",()=>$("#job-dialog").close());$("#job-dialog").addEventListener("close",()=>document.body.style.overflow="");
    $("#job-dialog").addEventListener("click",e=>{if(e.target===$("#job-dialog")){const r=e.target.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)e.target.close();}});
    window.addEventListener("hashchange",()=>setView(location.hash.slice(1)));
    setView(location.hash.slice(1));filterJobs();
  }catch(error){
    $("#loaded").hidden=true;$("#snapshot-date").textContent="Chargement interrompu";$("#load-error").hidden=false;
    $("#load-error").textContent="Les données n’ont pas pu être chargées. Rechargez la page ou lancez le site avec un serveur local (voir README). Aucun chiffre de démonstration n’a été substitué.";
    console.error(error);
  }
}
init();
