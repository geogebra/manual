import fs from "node:fs";
import path from "node:path";
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

function normalize(page) {
  return page
    .replace(/^([^/]*)_Command/, "commands/$1")
    .replace(/^([^/]*)_Tool/, "tools/$1")
    .replace(/^([^/]*)_Commands/, "commands/$1_Commands")
    .replace(/^([^/]*)_Tools/, "tools/$1_Tools");
}

const simplePath = (p) =>
  p ? p.split(/pages./)[1].replace("\\", "/") : "missing.adoc";

for (const lang of active) {
  const translations = {};
  await listFilesSync(
    `${lang}/modules/ROOT/pages`,
    async (filePath, directory) => {
      const content = fs.readFileSync(filePath, "utf8");
      const pageEn = content.match(/:page-en:(.*)/);
      if (pageEn) {
        translations[pageEn[1].trim()] = simplePath(filePath);
      }
    });
  await listFilesSync(
    `${lang}/modules/ROOT/pages`,
    async (filePath, directory) => {
      let content = fs.readFileSync(filePath, "utf8");
      const pageEn = content.match(/:page-en:(.*)/);
      translations[simplePath(filePath)] = pageEn;
      const refs = [...content.matchAll(/xref:([^.@]*\.adoc)/g)];
      let fixes = 0;
      for (const [_,absRef] of refs) {
        const ref = absRef.replace(/^\//, '').replace(/.adoc$/, '');
        if (!fs.existsSync(`${lang}/modules/ROOT/pages/${ref}.adoc`)) {
          if (translations[ref]) {
            content = content.replace("xref:"+absRef, "xref:/" +translations[ref]);
            fixes++;
          } else if (translations[normalize(ref)]) {
            content = content.replace("xref:"+absRef, "xref:/" +translations[normalize(ref)]);
            fixes++;
          }
        }
      }
      if (fixes > 0) {
        fs.writeFileSync(filePath, content, "utf8");
      }
    }
  );
}

