const {test,expect}=require("@playwright/test");
const fs=require("node:fs");
const payload=require("../../site/data/jobs.json");

test("MSI, archives séparées, profils et exports complets",async({page})=>{
  const errors=[];page.on("pageerror",error=>errors.push(error.message));
  await page.goto("./");
  await expect(page.locator("#loaded")).toBeVisible();
  await expect(page).toHaveTitle("Élan MSI | Débouchés et opportunités");
  await expect(page.locator("#result-count")).toContainText(String(payload.meta.student_offers));
  await expect(page.locator(".job-status.archived-status")).toHaveCount(0);
  const finalYear=payload.jobs.find(j=>j.study_stage==="Fin d’études" && ["Stage","Alternance"].includes(j.contract) && j.status!=="closed");
  await page.locator("#search").fill(finalYear.title);
  await page.locator(".job-open").first().click();
  await expect(page.locator("#job-detail")).toContainText("Fin d’études");
  await expect(page.locator("#job-detail")).toContainText(finalYear.duration || "Non précisée");
  await expect(page.locator("#job-detail")).toContainText(finalYear.education_level || "Non précisé");
  await page.keyboard.press("Escape");
  await page.locator("#reset").click();
  await page.locator("#advanced summary").click();
  await page.locator("#availability").selectOption("archived");
  await expect(page.locator(".archived-status")).toHaveCount(2);
  const [download]=await Promise.all([page.waitForEvent("download"),page.locator("#export-json").click()]);
  const json=JSON.parse(fs.readFileSync(await download.path(),"utf8"));
  expect(json.jobs).toHaveLength(2);
  expect(json.jobs.every(j=>j.status==="closed")).toBe(true);
  await page.locator(".job-open").first().click();
  await expect(page.locator("#job-detail")).toContainText("Offre fermée — exemple archivé");
  await page.keyboard.press("Escape");
  await page.locator("#reset").click();
  const [allDownload]=await Promise.all([page.waitForEvent("download"),page.locator("#export-json").click()]);
  const all=JSON.parse(fs.readFileSync(await allDownload.path(),"utf8"));
  expect(all.jobs).toHaveLength(payload.meta.student_offers);
  expect(all.jobs.every(j=>j.pathways.length>0 && j.status!=="closed")).toBe(true);
  expect(errors).toEqual([]);
});

test("six langues, parcours et stage international",async({page})=>{
  await page.goto("./");
  await expect(page.locator("#loaded")).toBeVisible();
  await page.locator("#international").click();
  await page.locator("#search").fill("Intern Application Consultant (with German)");
  await page.locator("#country").selectOption("PL");
  for(const lang of ["fr","en","es","de","ja","zh"]){
    await page.locator("#language").selectOption(lang);
    await expect(page.locator("html")).toHaveAttribute("lang",lang);
    await expect(page.locator("#country")).toHaveValue("PL");
    await expect(page.locator(".job-open")).toHaveCount(1);
    if(lang==="fr")await expect(page.locator("#selection-note")).toContainText("Résultats : 1");
    for(const view of ["domains","sources","method","offers"]){
      await page.locator(`[data-view="${view}"]`).click();
      await expect(page.locator(`#${view}-view`)).toBeVisible();
    }
  }
  await page.locator(".job-open").click();
  await expect(page.locator("#detail-heading")).toContainText("Intern Application Consultant");
  await expect(page.locator(".source-visit")).toHaveAttribute("href",/1406556233/);
  await page.keyboard.press("Escape");
  await page.locator('[data-view="domains"]').click();
  await page.locator('[data-pathway="ID"]').click();
  await expect(page.locator("#pathway")).toHaveValue("ID");
});

test("filtres, tri, pagination et captures desktop/mobile",async({page},testInfo)=>{
  await page.goto("./");
  await expect(page.locator("#loaded")).toBeVisible();
  await page.screenshot({path:testInfo.outputPath("desktop.png"),fullPage:true});
  await page.locator("#next").click();
  await expect(page.locator("#page-status")).toContainText("2");
  await page.locator("#prev").click();
  await page.locator("#sort").selectOption("company");
  await page.locator("#domain").selectOption("Business Analyst");
  await page.locator("#contract").selectOption("Stage");
  await page.locator("#advanced summary").click();
  await page.locator("#source").selectOption("bpce");
  await page.locator("#reset").click();
  await page.locator("#ara").click();await page.locator("#ara").click();
  await page.setViewportSize({width:375,height:850});
  await page.locator("#language").selectOption("de");
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
  await page.screenshot({path:testInfo.outputPath("mobile.png"),fullPage:true});
  await page.locator(".msi-resource").click();
  await expect(page.locator("#loaded")).toBeVisible();
  for(const view of ["careers","sources","method","overview","offers"]){
    await page.locator(`[data-view="${view}"]`).click();
    await expect(page.locator(view==="offers"?"#offers-section":`#${view}-view`)).toBeVisible();
  }
  await expect(page.locator("#jobs-table")).not.toContainText("Product Owner Data (M/F) - Internship - Paris");
});

test("échec actualisation visible, anciennes données utilisables et stockage bloqué",async({page})=>{
  await page.addInitScript(()=>Object.defineProperty(window,"localStorage",{get(){throw new Error("blocked for test");}}));
  await page.route("**/data/update-status.json",route=>route.fulfill({json:{status:"failed",last_success_at:payload.meta.last_success_at}}));
  await page.goto("./");
  await expect(page.locator("#loaded")).toBeVisible();
  await expect(page.locator("#refresh-state")).toContainText("échoué");
  await expect(page.locator("#last-success")).toHaveAttribute("datetime",payload.meta.last_success_at);
  await page.locator("#language").selectOption("en");
  await expect(page.locator("#refresh-state")).toContainText("failed");
  await expect(page.locator(".job-open").first()).toBeVisible();
});

test("chargement réseau en erreur puis réessai sans données inventées",async({page})=>{
  let broken=true;
  await page.route("**/data/jobs.json",route=>broken?route.fulfill({status:503,body:"Unavailable"}):route.continue());
  await page.goto("./");
  await expect(page.locator("#load-error")).toBeVisible();
  await expect(page.locator("#loaded")).toBeHidden();
  broken=false;
  await page.locator("#retry").click();
  await expect(page.locator("#loaded")).toBeVisible();
  await expect(page.locator("#load-error")).toBeHidden();
});

test("échappement HTML, URL dangereuse et formule CSV",async({page})=>{
  const fixture=structuredClone(payload);
  const job=fixture.jobs.find(j=>j.contract==="Stage" && j.status!=="closed");
  Object.assign(job,{title:"<img src=x onerror='window.__xss=1'>",company:"=1+1",
    description:"<script>window.__xss=2</script>",source_url:"javascript:window.__xss=3"});
  fixture.jobs=[job];fixture.meta.student_offers=1;fixture.meta.unique_offers=1;
  await page.route("**/data/jobs.json",route=>route.fulfill({json:fixture}));
  await page.goto("./");
  await expect(page.locator("#loaded")).toBeVisible();
  await expect(page.locator("#job-list img")).toHaveCount(0);
  await page.locator(".job-open").click();
  await expect(page.locator("#job-detail script")).toHaveCount(0);
  await expect(page.locator("#job-detail a[href^='javascript:']")).toHaveCount(0);
  expect(await page.evaluate(()=>window.__xss)).toBeUndefined();
  await page.keyboard.press("Escape");
  const [download]=await Promise.all([page.waitForEvent("download"),page.locator("#export-csv").click()]);
  const csv=fs.readFileSync(await download.path(),"utf8");
  expect(csv).toContain("\"'=1+1\"");
  expect(csv).toContain('"status"');
});

test("readable local font, responsive pages and 200% text scaling",async({page},testInfo)=>{
  for(const path of ["./","./msi.html"]){
    await page.goto(path);
    await expect(page.locator("#loaded")).toBeVisible();
    await page.evaluate(()=>document.fonts.ready);
    expect(await page.evaluate(()=>[...document.fonts].some(font=>font.family.includes("Source Sans 3")&&font.status==="loaded"))).toBe(true);
    await expect(page.locator("body")).toHaveCSS("font-family",/Source Sans 3/);
    for(const width of [1440,768,375,320]){
      await page.setViewportSize({width,height:950});
      expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
      const navSize=await page.locator(".nav-item").first().evaluate(e=>parseFloat(getComputedStyle(e).fontSize));
      expect(navSize).toBeGreaterThanOrEqual(14);
    }
    if(path==="./"){
      for(const lang of ["fr","en","es","de","ja","zh"]){
        await page.locator("#language").selectOption(lang);
        expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
      }
      await page.locator("#language").selectOption("fr");
      expect(await page.locator(".job-open").first().evaluate(e=>parseFloat(getComputedStyle(e).fontSize))).toBeGreaterThanOrEqual(17);
      expect(await page.locator(".job-employer").first().evaluate(e=>parseFloat(getComputedStyle(e).fontSize))).toBeGreaterThanOrEqual(14);
    }
    await page.screenshot({path:testInfo.outputPath(path==="./"?"search-320.png":"resources-320.png")});
    await page.setViewportSize({width:1440,height:1000});
    await page.evaluate(()=>document.documentElement.style.fontSize="200%");
    expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
    await page.evaluate(()=>document.documentElement.style.fontSize="");
  }
});
