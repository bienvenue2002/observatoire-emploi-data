const { defineConfig } = require("@playwright/test");
module.exports = defineConfig({
  testDir: "./tests/browser",
  timeout: 30000,
  workers: 1,
  reporter: [["list"],["html",{open:"never"}]],
  use: {
    baseURL: `${(process.env.ELAN_BASE_URL || "http://127.0.0.1:8000").replace(/\/$/, "")}/`,
    viewport:{width:1440,height:960},
    launchOptions:{channel:"chromium"},
    trace:"retain-on-failure",
    screenshot:"only-on-failure"
  },
  webServer: process.env.ELAN_BASE_URL ? undefined : {
    command:"python -m http.server 8000 --bind 127.0.0.1 --directory site",
    url:"http://127.0.0.1:8000",
    reuseExistingServer:!process.env.CI
  }
});
