/* Espace pédagogique : orientation et étude de cas. La recherche reste dans app.js. */
"use strict";
const $=selector=>document.querySelector(selector);
const $$=selector=>[...document.querySelectorAll(selector)];
const state={jobs:[],meta:null,catalog:null,view:"overview",careerPath:""};
const esc=s=>String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const unique=xs=>[...new Set(xs)];
const fmt=new Intl.NumberFormat("fr-FR");
const dateFR=value=>value&&!Number.isNaN(Date.parse(value))?new Intl.DateTimeFormat("fr-FR",{dateStyle:"long",timeZone:"Europe/Paris"}).format(new Date(value)):"Non renseignée";
const safeUrl=value=>{try{const u=new URL(value);return u.protocol==="https:"?u.href:"";}catch{return "";}};
const ranked=values=>Object.entries(values.reduce((a,x)=>(a[x]=(a[x]||0)+1,a),{})).sort((a,b)=>b[1]-a[1]||a[0].localeCompare(b[0],"fr"));
function searchLink(criteria={}){
  const query=new URLSearchParams({...criteria,student:"all"});
  return "./index.html?"+query.toString()+"#offers";
}
function setView(view){
  if(view==="offers"){location.replace(searchLink());return;}
  state.view=["overview","careers","sources","method"].includes(view)?view:"overview";
  $$(".nav-item[data-view]").forEach(el=>{
    const selected=el.dataset.view===state.view;el.classList.toggle("active",selected);
    if(selected)el.setAttribute("aria-current","page");else el.removeAttribute("aria-current");
  });
  ["overview","careers","sources","method"].forEach(v=>$("#"+v+"-view").hidden=state.view!==v);
  $("#pathways-section").hidden=state.view!=="overview";
}
function renderPathways(){
  $("#pathway-cards").innerHTML=state.catalog.pathways.map((p,i)=>{
    const n=state.jobs.filter(j=>j.pathways.includes(p.id)).length;
    return `<article class="pathway-card"><span class="pathway-number">0${i+1} · ${esc(p.id)}</span><h3>${esc(p.name)}</h3><p>${esc(p.line)}</p><p>${esc(p.details)}</p><a class="text-link" href="${esc(searchLink({pathway:p.id}))}">${n} fiche${n===1?"":"s"} du corpus dans la recherche ↗</a><br><a href="${esc(safeUrl(p.url))}" target="_blank" rel="noopener noreferrer">Programme officiel ↗</a></article>`;
  }).join("");
}
function renderCareers(){
  const rows=state.catalog.careers.filter(c=>!state.careerPath||c.pathways.includes(state.careerPath));
  $("#career-summary").textContent=`${rows.length} fiches · ${state.careerPath||"tous les parcours"} · les idées de projets sont des suggestions pédagogiques.`;
  $("#career-grid").innerHTML=rows.map(c=>{
    const n=state.jobs.filter(j=>j.family===c.family).length;
    const path=state.catalog.pathways.find(p=>p.id===(state.careerPath||c.pathways[0]));
    return `<article class="career-card"><div class="career-kicker"><span>${c.pathways.map(esc).join(" / ")}</span><span>${esc(c.kind)}</span></div><h3>${esc(c.name)}</h3><p class="level-note">${esc(c.level)}</p><p>${esc(c.mission)}</p><details class="project-idea"><summary>Un projet pour se préparer</summary><p>${esc(c.project)}</p></details><div class="career-actions"><a class="text-link" data-career-family="${esc(c.family)}" href="${esc(searchLink({domain:c.family}))}">${n?n+" fiche"+(n===1?"":"s")+" de cette famille":"Explorer cette famille"} dans la recherche ↗</a><a href="${esc(safeUrl(path?.url))}" target="_blank" rel="noopener noreferrer">Parcours officiel ↗</a></div></article>`;
  }).join("");
  $$("[data-career-path]").forEach(button=>button.setAttribute("aria-pressed",String(button.dataset.careerPath===state.careerPath)));
}
function renderSources(){
  $("#source-grid").innerHTML=state.catalog.sources.map(s=>{
    const jobs=state.jobs.filter(j=>j.source_key===s.id),n=jobs.length;
    const href=n?searchLink({source:s.id}):"./index.html?status=archived#offers";
    const action=n?`${n} fiche${n===1?"":"s"} dans la recherche ↗`:"Voir les exemples archivés ↗";
    return `<article class="source-card"><div class="career-kicker"><span>${esc(s.tag)}</span><span>${n} fiche${n===1?"":"s"} hors archives</span></div><h3>${esc(s.name)}</h3><p class="source-mode">${esc(s.mode)}</p><p>${esc(s.text)}</p><p class="source-terms">${esc(s.use)}</p><div class="source-actions"><a class="secondary-btn" data-source-pick="${esc(s.id)}" href="${esc(href)}">${action}</a><a href="${esc(safeUrl(s.url))}" target="_blank" rel="noopener noreferrer">Ouvrir la source ↗</a><a href="${esc(safeUrl(s.secondary_url))}" target="_blank" rel="noopener noreferrer">${esc(s.secondary_label)} ↗</a></div></article>`;
  }).join("");
}
function bars(root,entries,total,type){
  if(!entries.length){$(root).innerHTML="<p>Aucune donnée comparable dans ce corpus.</p>";return;}
  $(root).innerHTML=entries.slice(0,8).map(([label,n])=>{
    const bpce=type==="skill",width=bpce?n/total*100:n/entries[0][1]*100;
    const criteria=bpce?{source:"bpce",skill:label}:{region:label};
    const accessible=bpce?`${label} : ${n} sur ${total} descriptions BPCE. Ouvrir les offres BPCE correspondantes.`:`${label} : ${n} fiches du corpus. Ouvrir la recherche.`;
    return `<a class="bar-row" data-chart="${type}" data-value="${esc(label)}" href="${esc(searchLink(criteria))}" aria-label="${esc(accessible)}"><span class="bar-label">${esc(label)}</span><span class="bar-track" aria-hidden="true"><span class="bar-fill" style="--width:${width}%"></span></span><span class="bar-value">${bpce?n+" / "+total:n}</span></a>`;
  }).join("");
}
function renderStudy(){
  const jobs=state.jobs,bpce=jobs.filter(j=>j.source_key==="bpce"&&j.collection_method==="open_data"),top=ranked(bpce.flatMap(j=>j.skills))[0];
  $("#stat-jobs").textContent=fmt.format(jobs.length);
  $("#stat-jobs-note").textContent="Toutes sources, hors archives";
  $("#stat-student").textContent=fmt.format(jobs.filter(j=>["Stage","Alternance"].includes(j.contract)).length);
  $("#stat-student-note").textContent="Toutes sources, hors archives";
  $("#stat-regions").textContent=fmt.format(unique(jobs.flatMap(j=>j.locations.map(p=>p.region)).filter(p=>p&&p!=="Non renseignée")).length);
  $("#stat-skill").textContent=top?.[0]||"Non calculé";
  $("#stat-skill-note").textContent=top?`${top[1]} mentions sur ${bpce.length} descriptions BPCE`:"Aucune description BPCE disponible";
  $("#skill-denominator").textContent=`Lecture : nombre de fiches mentionnant le mot-clé sur ${bpce.length} descriptions BPCE complètes. Ce dénominateur exclut toutes les autres sources.`;
  $("#corpus-note").textContent=`Le corpus hors archives compte ${jobs.length} fiches toutes sources. Le graphique de mots-clés ci-dessous utilise seulement les ${bpce.length} fiches BPCE : ce n’est pas un indicateur du marché.`;
  bars("#skills-chart",ranked(bpce.flatMap(j=>j.skills)),bpce.length,"skill");
  bars("#regions-chart",ranked(jobs.flatMap(j=>unique(j.locations.map(p=>p.region)).filter(Boolean))),jobs.length,"region");
}
async function init(){
  // Keep legacy offer URLs useful even if the pedagogical JSON cannot load.
  if(location.hash==="#offers"){location.replace(searchLink());return;}
  try{
    const responses=await Promise.all([fetch("./data/msi-jobs.json"),fetch("./data/catalog.json")]);
    if(responses.some(r=>!r.ok))throw new Error("Données indisponibles");
    const [data,catalog]=await Promise.all(responses.map(r=>r.json()));
    if(!data.meta||!Array.isArray(data.jobs)||!Array.isArray(catalog.careers)||!Array.isArray(catalog.pathways)||!Array.isArray(catalog.sources))throw new Error("Format inattendu");
    state.jobs=data.jobs.filter(j=>j.status!=="closed");state.meta=data.meta;state.catalog=catalog;
    $("#snapshot-date").textContent=dateFR(data.meta.observed_at);
    $("#refresh-info").textContent=`Corpus du ${dateFR(data.meta.last_success_at||data.meta.observed_at)}. Les fiches éditoriales ne sont pas revérifiées automatiquement.`;
    $("#salary-note").textContent="Aucun salaire moyen n’est calculé ; aucun salaire ou télétravail manquant n’est estimé.";
    $("#audit-counts").textContent=`BPCE : ${data.meta.bpce_unique_offers} fiches ; API Sopra Steria/Bosch : ${data.meta.public_api_offers||0} ; sélection éditoriale : ${data.meta.editorial_offers}. Archives exclues ici : ${data.meta.archived_offers}.`;
    $("#audit-meta").textContent=JSON.stringify(data.meta,null,2);
    $("#academic-links").innerHTML=catalog.pathways.map(p=>`<a href="${esc(safeUrl(p.url))}" target="_blank" rel="noopener noreferrer">${esc(p.id)} : page officielle ↗</a>`).join("");
    renderPathways();renderCareers();renderSources();renderStudy();
    $$("[data-career-path]").forEach(button=>button.addEventListener("click",()=>{state.careerPath=button.dataset.careerPath;renderCareers();}));
    window.addEventListener("hashchange",()=>setView(location.hash.slice(1)));
    setView(location.hash.slice(1));$("#loaded").hidden=false;$("#msi-fallback").hidden=true;
    try{
      const response=await fetch("./data/update-status.json",{cache:"no-store"});
      if(!response.ok)throw new Error("État indisponible");
      const status=await response.json();
      if(status.status==="failed")$("#refresh-info").textContent+=" Dernière tentative échouée : dernier corpus valide conservé.";
    }catch{/* The dated snapshot stays readable independently of the status endpoint. */}
  }catch{
    $("#loaded").hidden=true;$("#snapshot-date").textContent="Version statique disponible";
    $("#msi-fallback").hidden=false;$("#load-error").hidden=false;
    $("#load-error").textContent="Le contenu interactif n’a pas pu être chargé. Les parcours et les offres datées ci-dessous restent consultables ; les liens vers la recherche et la liste sans JavaScript restent disponibles.";
  }
}
init();
