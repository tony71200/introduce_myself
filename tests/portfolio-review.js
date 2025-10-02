const path = require("path");
const fs = require("fs/promises");
const vm = require("vm");
const { JSDOM } = require("jsdom");

const rootDir = path.resolve(__dirname, "..");
const htmlPath = path.join(rootDir, "index.html");
const dataPath = path.join(rootDir, "data.json");
const scriptPath = path.join(rootDir, "assets/js/update.js");

(async () => {
  const [html, dataContent, scriptSource] = await Promise.all([
    fs.readFile(htmlPath, "utf8"),
    fs.readFile(dataPath, "utf8"),
    fs.readFile(scriptPath, "utf8"),
  ]);

  const dom = new JSDOM(html, {
    url: "http://localhost/index.html",
    runScripts: "outside-only",
    pretendToBeVisual: true,
  });

  const { window } = dom;
  const requests = [];
  const dataUrl = new URL("./data.json", window.location.href).href;

  window.fetch = async (input) => {
    const resolved = typeof input === "string" ? new URL(input, window.location.href) : new URL(input.url);
    requests.push(resolved.href);

    if (resolved.href === dataUrl) {
      const payload = JSON.parse(dataContent);
      return {
        ok: true,
        status: 200,
        json: async () => payload,
      };
    }

    throw new Error(`Unexpected fetch to ${resolved.href}`);
  };

  // Ensure the script tag mirrors the runtime environment
  const scriptTag = window.document.querySelector("script[data-json-url]");
  if (scriptTag) {
    scriptTag.setAttribute("src", "./assets/js/update.js");
    scriptTag.setAttribute("data-json-url", "./data.json");
  }

  const updatePromise = new Promise((resolve) => {
    window.document.addEventListener("site-data-updated", () => resolve(), { once: true });
  });

  vm.runInContext(scriptSource, dom.getInternalVMContext(), { filename: "assets/js/update.js" });

  await updatePromise;

  const data = JSON.parse(dataContent);
  const expectedProjects = Array.isArray(data?.portfolio?.projects) ? data.portfolio.projects.length : 0;
  const renderedProjects = window.document.querySelectorAll("[data-project-list] > [data-project-index]");

  if (expectedProjects === 0) {
    throw new Error("Test data does not contain any portfolio projects.");
  }

  if (renderedProjects.length !== expectedProjects) {
    throw new Error(`Expected ${expectedProjects} rendered project items but found ${renderedProjects.length}.`);
  }

  if (!requests.includes(dataUrl)) {
    throw new Error(`fetch was not invoked with the expected data URL: ${dataUrl}`);
  }

  console.log("Portfolio review passed.");
  console.log(`fetch() requested: ${requests[0]}`);
  console.log(`Rendered projects: ${renderedProjects.length}`);
})();
