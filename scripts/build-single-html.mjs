import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

const bundleOrder = [
    'core/state.js',
    'core/config.js',
    'core/import-export.js',
    'core/storage.js',
    'modules/dns.js',
    'modules/groups.js',
    'modules/nodes.js',
    'modules/providers.js',
    'modules/rules.js',
    'modules/tproxy.js',
    'modules/tun.js',
];

const htmlPath = path.join(rootDir, 'singbox.html');
const mainPath = path.join(rootDir, 'main.js');
const outputPath = path.resolve(process.argv[2] || path.join(rootDir, 'dist', 'singbox.html'));

const html = fs.readFileSync(htmlPath, 'utf8');
const mainSource = fs.readFileSync(mainPath, 'utf8');

const exportBundleLines = [];
const moduleBodies = [];

for (const relativePath of bundleOrder) {
    const absPath = path.join(rootDir, relativePath);
    let source = fs.readFileSync(absPath, 'utf8');
    const exportNames = [...source.matchAll(/export function\s+([A-Za-z0-9_]+)/g)].map((match) => match[1]);
    source = source.replace(/export function\s+/g, 'function ');
    const assignments = exportNames
        .map((name) => `window.__SINGBOX_BUNDLE__.${name} = ${name};`)
        .join('\n');
    moduleBodies.push(`(() => {\n${source.trim()}\nwindow.__SINGBOX_BUNDLE__ = window.__SINGBOX_BUNDLE__ || {};\n${assignments}\n})();`);
    exportBundleLines.push(...exportNames);
}

const importedNames = [...mainSource.matchAll(/import\s+\{\s*([A-Za-z0-9_,\s]+)\s*\}\s+from\s+['"][^'"]+['"];?/g)]
    .flatMap((match) => match[1].split(',').map((name) => name.trim()).filter(Boolean));

const uniqueImportedNames = [...new Set(importedNames)];

const mainBody = mainSource
    .replace(/^import\s+.*$/gm, '')
    .trim();

const bundledScript = `<script>
${moduleBodies.join('\n\n')}

(() => {
const { ${uniqueImportedNames.join(', ')} } = window.__SINGBOX_BUNDLE__;
${mainBody}
})();
</script>`;

const packedHtml = html.replace(
    '<script type="module" src="./main.js"></script>',
    bundledScript,
);

if (packedHtml === html) {
    throw new Error('Failed to find module entry script tag in singbox.html');
}

fs.mkdirSync(path.dirname(outputPath), { recursive: true });
fs.writeFileSync(outputPath, packedHtml);

console.log(`Built single-file HTML: ${outputPath}`);
