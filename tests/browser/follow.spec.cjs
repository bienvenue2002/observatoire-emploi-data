const {test,expect}=require("@playwright/test");
const fs=require("node:fs");
const payload=require("../../site/data/jobs.json");

test("favoris de session, export indépendant des filtres et six langues",async({page})=>{
  const errors=[];page.on("pageerror",e=>errors.push(e.message));
  await page.goto("./");await expect(page.locator("#loaded")).toBeVisible();
  await expect(page.locator("#advanced")).not.toHaveAttribute("open","");
  await expect(page.locator("#offer-preview")).toBeHidden();
  const savedId=await page.locator("[data-save]").first().getAttribute("data-save");
  await page.locator("[data-save]").first().click();
  await expect(page.locator("#saved-only")).toContainText("(1)");
  await page.locator("#search").fill("no-result-fixture-9431");
  await expect(page.locator("#empty")).toBeVisible();
  const [download]=await Promise.all([page.waitForEvent("download"),page.locator("#saved-json").click()]);
  const parsed=JSON.parse(fs.readFileSync(await download.path(),"utf8"));
  expect(parsed.jobs.map(j=>j.id)).toEqual([savedId]);
  expect(parsed.meta.export_scope).toBe("session_favorites");
  expect(parsed.meta.filters).toBeNull();
  await page.locator("#reset").click();
  await page.locator("#saved-only").click();
  await expect(page.locator(".job-open")).toHaveCount(1);
  for(const lang of ["fr","en","es","de","ja","zh"]){
    await page.locator("#language").selectOption(lang);
    await expect(page.locator("#saved-only")).toContainText("1");
    await expect(page.locator(".job-open")).toHaveCount(1);
    await page.locator(".job-open").click();await page.keyboard.press("Escape");
  }
  const [csv]=await Promise.all([page.waitForEvent("download"),page.locator("#saved-csv").click()]);
  expect(fs.readFileSync(await csv.path(),"utf8")).toContain(savedId);
  await page.locator("[data-save]").click();
  await expect(page.locator("#empty")).toBeVisible();
  await expect(page.locator("#saved-json")).toBeDisabled();
  await page.reload();await expect(page.locator("#loaded")).toBeVisible();
  await expect(page.locator("#saved-only")).toContainText("0");
  expect(errors).toEqual([]);
});

test("entrée archives explicite et retour canonique hors archives",async({page})=>{
  await page.goto("./?status=archived#offers");
  await expect(page.locator("#archive-notice")).toBeVisible();
  await expect(page.locator(".archived-status")).toHaveCount(payload.meta.archived_offers);
  await page.locator("#archive-reset").click();
  await expect(page.locator("#archive-notice")).toBeHidden();
  expect(new URL(page.url()).searchParams.has("status")).toBe(false);
  await page.reload();await expect(page.locator("#availability")).toHaveValue("current");
  await expect(page.locator(".archived-status")).toHaveCount(0);
});

test("aperçu initial réel avant chargement et page sans JavaScript",async({browser})=>{
  const context=await browser.newContext({javaScriptEnabled:false,viewport:{width:375,height:900}});
  const page=await context.newPage();
  await page.goto("./");
  await expect(page.locator("#offer-preview")).toBeVisible();
  await expect(page.locator("#offer-preview .snapshot-offer")).toHaveCount(3);
  await page.locator("#offer-preview a[href='./offres.html']").click();
  await expect(page.locator("h1")).toHaveText("Stages et alternances MSI");
  await expect(page.locator(".snapshot-offer")).toHaveCount(payload.meta.student_offers);
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
  await context.close();
});

test("aperçu HTML visible pendant la requête JSON puis masqué",async({page})=>{
  let release;
  const gate=new Promise(resolve=>release=resolve);
  await page.route("**/data/jobs.json",async route=>{await gate;await route.continue();});
  await page.goto("./",{waitUntil:"domcontentloaded"});
  await expect(page.locator("#offer-preview")).toBeVisible();
  await expect(page.locator("#loaded")).toBeHidden();
  release();
  await expect(page.locator("#loaded")).toBeVisible();
  await expect(page.locator("#offer-preview")).toBeHidden();
});

test("sources diversifiées, flux accessible et favoris sans stockage",async({page})=>{
  await page.addInitScript(()=>Object.defineProperty(window,"localStorage",{get(){throw new Error("blocked");}}));
  await page.goto("./");await expect(page.locator("#loaded")).toBeVisible();
  await page.locator("[data-save]").first().click();
  await expect(page.locator("#saved-only")).toContainText("1");
  await page.locator('[data-view="sources"]').click();
  for(const source of payload.meta.additional_sources||[]){
    await expect(page.locator("#source-grid")).toContainText(source.name);
  }
  const feed=await page.request.get("./feed.xml");
  expect(feed.ok()).toBe(true);
  expect(await feed.text()).toContain("<rss version=\"2.0\">");
});
