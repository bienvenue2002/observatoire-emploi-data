const {test,expect}=require("@playwright/test");
const data=require("../../site/data/jobs.json");

test("espace pédagogique distinct, atelier BPCE explicite et moteur unique",async({page})=>{
  const errors=[];page.on("pageerror",error=>errors.push(error.message));
  await page.goto("./msi.html");await expect(page.locator("#loaded")).toBeVisible();
  await expect(page.locator("#msi-fallback")).toBeHidden();
  await expect(page.locator("#jobs-table")).toHaveCount(0);
  await expect(page.locator("#export-csv")).toHaveCount(0);
  await expect(page.locator("#filter-section")).toHaveCount(0);
  await expect(page.locator("#bpce-case-study")).not.toHaveAttribute("open","");
  await expect(page.locator("#skills-chart")).toBeHidden();
  await page.locator("#bpce-case-study summary").click();
  await expect(page.locator("#skill-denominator")).toContainText("BPCE");
  const bpce=data.jobs.filter(j=>j.status!=="closed"&&j.collection_method==="open_data");
  await expect(page.locator("#skills-chart .bar-value").first()).toContainText(" / "+bpce.length);
  const word=await page.locator("#skills-chart a").first().getAttribute("data-value");
  await page.locator("#skills-chart a").first().click();
  await expect(page.locator("#loaded")).toBeVisible();
  await expect(page.locator("#source")).toHaveValue("bpce");
  await expect(page.locator("#skill")).toHaveValue(word);
  await expect(page.locator("#student")).toHaveAttribute("aria-pressed","false");
  const expected=bpce.filter(j=>j.skills.includes(word)).length;
  await expect(page.locator("#result-count")).toContainText(String(expected));
  await page.locator("#reset").click();await page.reload();
  await expect(page.locator("#source")).toHaveValue("");
  await expect(page.locator("#skill")).toHaveValue("");
  expect(errors).toEqual([]);
});

test("liens parcours, métiers et sources transmettent les critères valides",async({page})=>{
  await page.goto("./msi.html");await expect(page.locator("#loaded")).toBeVisible();
  await page.locator('#pathway-cards a[href*="pathway=CMSI"]').click();
  await expect(page.locator("#pathway")).toHaveValue("CMSI");
  await page.goto("./msi.html#careers");await expect(page.locator("#careers-view")).toBeVisible();
  await page.locator('[data-career-path="ID"]').click();
  const family=await page.locator("[data-career-family]").first().getAttribute("data-career-family");
  await page.locator("[data-career-family]").first().click();
  await expect(page.locator("#domain")).toHaveValue(family);
  await page.goto("./msi.html#sources");await expect(page.locator("#sources-view")).toBeVisible();
  await page.locator('[data-source-pick="sr-boschgroup"]').click();
  await expect(page.locator("#source")).toHaveValue("sr-boschgroup");
  const bosch=data.jobs.filter(j=>j.source_key==="sr-boschgroup"&&j.status!=="closed").length;
  await expect(page.locator("#result-count")).toContainText(String(bosch));
  await page.goto("./msi.html#offers");
  await expect(page).toHaveURL(/index\.html\?student=all#offers/);
  await expect(page.locator("#loaded")).toBeVisible();
});

test("ressources et trois vraies offres sans JavaScript sur les deux pages",async({browser})=>{
  const context=await browser.newContext({javaScriptEnabled:false,viewport:{width:320,height:900}});
  const page=await context.newPage();
  await page.goto("./msi.html");
  await expect(page.locator("#msi-fallback")).toBeVisible();
  await expect(page.locator("#msi-fallback .pathway-card")).toHaveCount(3);
  await expect(page.locator("#msi-fallback .snapshot-offer")).toHaveCount(3);
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
  await page.locator('#msi-fallback a[href="./offres.html"]').click();
  await expect(page.locator(".snapshot-offer")).toHaveCount(data.meta.student_offers);
  await context.close();
});

test("échec et attente réseau pédagogique ne masquent pas le contenu statique",async({page})=>{
  let release;const gate=new Promise(resolve=>release=resolve);
  await page.route("**/data/msi-jobs.json",async route=>{await gate;await route.abort();});
  await page.goto("./msi.html",{waitUntil:"domcontentloaded"});
  await expect(page.locator("#msi-fallback")).toBeVisible();
  release();
  await expect(page.locator("#load-error")).toBeVisible();
  await expect(page.locator("#msi-fallback .snapshot-offer")).toHaveCount(3);
  await expect(page.locator("#loaded")).toBeHidden();
  await page.locator('#msi-fallback a[href="./offres.html"]').click();
  await expect(page.locator("h1")).toHaveText("Stages et alternances MSI");
});

test("critères URL inconnus ignorés sans injection ni modification du corpus",async({page})=>{
  await page.goto("./index.html?source="+encodeURIComponent("<img src=x onerror=alert(1)>")+"&domain=not-real&student=not-real#offers");
  await expect(page.locator("#loaded")).toBeVisible();
  await expect(page.locator("#source")).toHaveValue("");
  await expect(page.locator("#domain")).toHaveValue("");
  await expect(page.locator("#student")).toHaveAttribute("aria-pressed","true");
  await expect(page.locator("#result-count")).toContainText(String(data.meta.student_offers));
});
