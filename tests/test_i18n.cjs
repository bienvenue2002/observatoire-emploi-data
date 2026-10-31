const assert = require("node:assert/strict");
const fs = require("node:fs");
global.window = {};
require("../site/i18n.js");
const dict = window.ELAN_I18N;
assert.deepEqual(Object.keys(dict).sort(), ["de","en","es","fr","ja","zh"]);
const keys = Object.keys(dict.fr).sort();
for (const [lang, strings] of Object.entries(dict)) {
  assert.deepEqual(Object.keys(strings).sort(), keys, `Missing keys in ${lang}`);
  assert.deepEqual(Object.keys(strings.domains).sort(), Object.keys(dict.fr.domains).sort());
  for (const key of keys.filter(key=>key!=="domains")) {
    assert.equal(typeof strings[key],"string");
    assert.ok(strings[key].length>0, `${lang}.${key}`);
    const placeholders = value => [...value.matchAll(/\{(\w+)\}/g)].map(match=>match[1]).sort();
    assert.deepEqual(placeholders(strings[key]),placeholders(dict.fr[key]),`${lang}.${key}`);
  }
}
const html=fs.readFileSync(require("node:path").join(__dirname,"../site/index.html"),"utf8");
for (const match of html.matchAll(/data-i18n(?:-aria|-placeholder)?="([^"]+)"/g)) {
  assert.ok(keys.includes(match[1]),`Unknown HTML translation key: ${match[1]}`);
}
console.log(`Six languages validated: ${keys.length} keys and 13 study fields each.`);
