import fs from "node:fs";
import path from "node:path";
import MathJax from "mathjax";

const active = fs.readdirSync(".").filter((f) => fs.existsSync(`${f}/modules`));

async function listFilesSync(directory, callback) {
  try {
    const files = fs.readdirSync(directory).sort();

    for (const file of files) {
      const filePath = path.join(directory, file);
      const stats = fs.statSync(filePath);

      if (stats.isDirectory()) {
        // If the file is a directory, recurse into the directory
        await listFilesSync(filePath, callback);
      } else {
        // If the file is not a directory, print its path
        await callback(filePath, directory);
      }
    }
  } catch (err) {
    console.error("Error reading directory:", err);
  }
}

const simplePath = (p) =>
  p ? p.split(/pages./)[1].replace("\\", "/") : "missing.adoc";
const allEn = [];
await listFilesSync(`en/modules/ROOT/pages`, (filePath) =>
  allEn.push(simplePath(filePath).replace(".adoc", "")),
);
let status = "";
await MathJax.init({
  loader: { load: ["input/tex", "output/svg"] },
});
for (const lang of active) {
  const orphans = [];
  const duplicates = [];
  const translations = {};
  const partials = [];
  const antora = fs.readFileSync(`${lang}/antora.yml`, "utf8");
  const display = antora
    .split("\n")
    .find((l) => l.includes("display_version"))
    .split(":")[1]
    .trim()
    .replaceAll("'", "");
  let ok = 0;
  const links = {};
  const allPages = [];
  const images = {};
  const unparsedFormulas = {};
  await listFilesSync(
    `${lang}/modules/ROOT/pages`,
    async (filePath, directory) => {
      const content = fs.readFileSync(filePath, "utf8");
      const pageEn = content.match(/:page-en:(.*)/);
      const currentPath = simplePath(filePath);
      allPages.push(currentPath);
      if (currentPath == "missing.adoc" || currentPath == "broken.adoc") {
        return;
      }
      if (!pageEn || allEn.indexOf(pageEn[1].trim()) == -1) {
        if (
          lang == "nl" &&
          fs.existsSync(filePath.replace(/nl.modules/, "en/modules"))
        ) {
          const lines = content.split("\n");
          const fixedContent =
            lines[0] +
            "\n:page-en: " +
            currentPath.replace(".adoc", "") +
            "\n" +
            lines.slice(1).join("\n");
          fs.writeFileSync(filePath, fixedContent, "utf8");
        }
        orphans.push(currentPath);
      } else {
        if (content.includes("UnderConstruction.png")) {
          partials.push(simplePath(filePath));
        }
        if (translations[pageEn[1].trim()]) {
          duplicates.push(simplePath(translations[pageEn[1].trim()]));
          duplicates.push(currentPath);
        } else if (!content.includes("UnderConstruction.png")) {
          ok++;
        }
        translations[pageEn[1].trim()] = filePath;
      }
      const refs = [...content.matchAll(/xref:([^.@]*\.adoc)/g)];
      (refs || []).forEach((m) => {
        const linkRef = m[1].replace(/^\//, "");
        const absRef = linkRef.startsWith("./")
          ? simplePath(directory) + linkRef.substring(1)
          : linkRef;
        links[absRef] = links[absRef] || [];
        links[absRef].push(simplePath(filePath));
      });
      const imageRefs = [...content.matchAll(/image:([^:\[]+)\[/g)];
      (imageRefs || []).forEach((m) => {
        const absRef = m[1];
        images[absRef] = images[absRef] || [];
        images[absRef].push(simplePath(filePath));
      });

      const formulas = content.split("stem:[");
      for (const formula of formulas.slice(1)) {
        const formulaFlat = formula.replaceAll("\n", " ").replaceAll("\r", " ");
        const formulaTrimmed = formulaFlat
          .replace(/([^\\])\].*$/, "$1")
          .replaceAll("\\]", "]")
          .replace(/^\$(.*)\$$/, "$1");

        try {
          const svg = await MathJax.tex2svgPromise(formulaTrimmed, {
            display: true,
          });
          const output = MathJax.startup.adaptor.serializeXML(svg);
          if (!output || output.includes("error")) {
            throw "empty";
          }
        } catch (e) {
          const formulaAdoc = `\`++${formulaTrimmed}++\``;
          unparsedFormulas[formulaAdoc] = unparsedFormulas[formulaAdoc] || [];
          unparsedFormulas[formulaAdoc].push(simplePath(filePath));
        }
      }
    },
  );
  for (const page of allPages) {
    delete links[page];
  }

  await listFilesSync(
    `${lang}/modules/ROOT/assets/images`,
    (filePath, directory) => {
      delete images[filePath.substring(directory.length + 1)];
    },
  );
  if (Object.keys(images).length) {
    await listFilesSync(
      `en/modules/ROOT/assets/images`,
      (filePath, directory) => {
        const fn = filePath.substring(directory.length + 1);
        if (images[fn]) {
          fs.copyFileSync(filePath, `${lang}/modules/ROOT/assets/images/${fn}`);
          delete images[fn];
        }
      },
    );
  }
  const nav = fs.readFileSync("en/modules/ROOT/nav.adoc", "utf8");
  const localNav = nav.replace(/xref:(.+?).adoc/g, function (match, contents) {
    return "xref:" + simplePath(translations[contents]);
  });
  const missing = [];
  for (const enPage of allEn) {
    if (!translations[enPage] && enPage != "missing" && enPage != "broken") {
      missing.push(enPage);
    }
  }
  if (!fs.existsSync(`${lang}/modules/ROOT/nav.adoc`)) {
    fs.writeFileSync(`${lang}/modules/ROOT/nav.adoc`, localNav, "utf8");
  }
  const linkify = (k) => `\n * xref:${k}[${k.substr(0, k.length - 5)}]`;
  const indentLinkify = (k) => `\n ** xref:${k}[${k.substr(0, k.length - 5)}]`;
  const listBroken = (links) =>
    Object.entries(links)
      .map(
        ([link, sources]) =>
          `* ${link}:\n ${sources.map(indentLinkify).join("")}\n`,
      )
      .join("")
      .trim();
  const missingList = !missing.length
    ? "All clear"
    : missing.map((k) => `\n * xref:en@manual::${k}.adoc[${k}]`).join("");
  const orphanList = !orphans.length
    ? "All clear"
    : orphans.map(linkify).join("");
  const partialList = !partials.length
    ? "All clear"
    : partials.map(linkify).join("");
  const dupeList = !duplicates.length
    ? "All clear"
    : duplicates
        .map((k) => `\n * xref:${k}[${k.substr(0, k.length - 5)}]`)
        .join("");
  fs.writeFileSync(
    `${lang}/modules/ROOT/pages/missing.adoc`,
    "= Translation issues\n" +
      "\n== Extra translations\n" +
      orphanList +
      "\n\n== Missing translations\n" +
      missingList +
      "\n\n== Partial translations\n" +
      partialList +
      "\n\n== Duplicate translations\n" +
      dupeList,
    "utf8",
  );
  fs.writeFileSync(
    `${lang}/modules/ROOT/pages/broken.adoc`,
    "= Broken links and syntax issues\n\n" +
      "== Broken document links\n" +
      listBroken(links) +
      "\n\n" +
      "== Broken image links\n" +
      listBroken(images) +
      "\n\n" +
      "== Broken formulas\n" +
      listBroken(unparsedFormulas),
    "utf8",
  );
  status += `| ${display} (${lang}) `.padEnd(25, " ");
  for (const stat of [
    ok,
    missing.length,
    orphans.length,
    duplicates.length,
    partials.length,
  ]) {
    status += `| ${stat}`.padEnd(10, " ");
  }
  status += "|\n";
}

const readme =
  fs.readFileSync("README.md", "utf8").split(/---\|\r?\n/)[0] + "---|\n";
fs.writeFileSync("README.md", readme + status, "utf8");
