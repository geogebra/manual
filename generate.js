const active = 'cs,de,es,fr,it,ja,nl,tr'.split(',');

const fs = require('fs');
const path = require('path');

const directoryPath = path.join(__dirname, 'your-directory'); // replace 'your-directory' with your target directory

function listFilesSync(directory, callback) {
  try {
    const files = fs.readdirSync(directory);

    files.forEach((file) => {
      const filePath = path.join(directory, file);
      const stats = fs.statSync(filePath);

      if (stats.isDirectory()) {
        // If the file is a directory, recurse into the directory
        listFilesSync(filePath, callback);
      } else {
        // If the file is not a directory, print its path
        callback(filePath);
      }
    });
  } catch (err) {
    console.error('Error reading directory:', err);
  }
}

const simplePath = p => p ? p.split(/pages./)[1].replace('\\', '/') : 'missing.adoc';
const allEn = [];
listFilesSync(`en/modules/ROOT/pages`, filePath => allEn.push(simplePath(filePath).replace('.adoc', '')));
for (const lang of active) {
    const orphans = [];
    const duplicates = [];
    const translations = {};
    const partials = [];
    listFilesSync(`${lang}/modules/ROOT/pages`, filePath => {
        const content = fs.readFileSync(filePath, 'utf8');
        const pageEn = content.match(/:page-en:(.*)/);
        if (!pageEn || allEn.indexOf(pageEn[1].trim()) == -1) {
            if (lang == "ja" && fs.existsSync(filePath.replace(/ja.modules/,'en/modules'))) {
                const lines = content.split('\n');
                const fixedContent = lines[0]+'\n:page-en: '+simplePath(filePath).replace('.adoc','')+'\n'+lines.slice(1).join('\n')
                fs.writeFileSync(filePath, fixedContent, 'utf8')
            }
            if (simplePath(filePath) != "missing.adoc") {
                orphans.push(simplePath(filePath));
            }
        } else {
            if (content.includes('UnderConstruction.png')) {
                partials.push(simplePath(filePath));
            }
            if (translations[pageEn[1].trim()]) {
              duplicates.push(simplePath(translations[pageEn[1].trim()]));
              duplicates.push(simplePath(filePath));
            }
            translations[pageEn[1].trim()] = filePath;
        }
    });
    const nav = fs.readFileSync('en/modules/ROOT/nav.adoc', 'utf8');
    const localNav = nav.replace(/xref:(.+?).adoc/g, function(match, contents) {
            return "xref:" + simplePath(translations[contents]);
    });
    const missing = [];
    for (const enPage of allEn) {
      if (!translations[enPage]) {
        missing.push(enPage);
      }
    }
    if (!fs.existsSync(`${lang}/modules/ROOT/nav.adoc`)) {
       fs.writeFileSync(`${lang}/modules/ROOT/nav.adoc`, localNav, 'utf8');
    }
    const missingList = !missing.length ? "All clear"
        : missing.map(k=>`\n * xref:en@manual::${k}.adoc[${k}]`).join('');
    const orphanList = !orphans.length ? "All clear"
        : orphans.map(k=>`\n * xref:${k}[${k.substr(0, k.length - 5)}]`).join('');
    const partialList = !partials.length ? "All clear"
        : partials.map(k=>`\n * xref:${k}[${k.substr(0, k.length - 5)}]`).join('');
    const dupeList = !duplicates.length ? "All clear"
            : duplicates.map(k=>`\n * xref:${k}[${k.substr(0, k.length - 5)}]`).join('');
    fs.writeFileSync(`${lang}/modules/ROOT/pages/missing.adoc`, '= Translation issues\n'
        + '\n== Extra translations\n'
        + orphanList
        + '\n\n== Missing translations\n'
        + missingList
        + '\n\n== Partial translations\n'
        + partialList
        + '\n\n== Duplicate translations\n'
        + dupeList, 'utf8');
}