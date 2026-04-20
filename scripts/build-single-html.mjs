import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

const htmlPath = path.join(rootDir, 'singbox.html');
const mainPath = path.join(rootDir, 'main.js');
const vendorDir = path.join(rootDir, 'vendor');
const outputPath = path.resolve(process.argv[2] || path.join(rootDir, 'dist', 'singbox.html'));

const html = fs.readFileSync(htmlPath, 'utf8');
const mainSource = fs.readFileSync(mainPath, 'utf8');

const moduleBodies = [];
const vendorBlockPattern = /[ \t]*<!-- BUILD_VENDOR_ASSETS_START -->[\s\S]*?<!-- BUILD_VENDOR_ASSETS_END -->/;
const externalEntryScriptTag = '<script type="module" src="./main.js"></script>';
const inlineEntryScriptPattern = /<script type="module">[\s\S]*?import\('\.\/main\.js'\)[\s\S]*?<\/script>/;
const visitedModules = new Set();

function readText(filePath, label) {
    if (!fs.existsSync(filePath)) {
        throw new Error(`Missing required file: ${label}`);
    }
    return fs.readFileSync(filePath, 'utf8');
}

function readBase64(filePath, label) {
    if (!fs.existsSync(filePath)) {
        throw new Error(`Missing required file: ${label}`);
    }
    return fs.readFileSync(filePath).toString('base64');
}

function escapeRegExp(value) {
    return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function escapeInlineScript(source) {
    return source.replace(/<\/script/gi, '<\\/script');
}

function escapeInlineStyle(source) {
    return source.replace(/<\/style/gi, '<\\/style');
}

function parseImportSpecifier(specifier) {
    const trimmed = specifier.trim();
    const aliasMatch = trimmed.match(/^([A-Za-z0-9_$]+)\s+as\s+([A-Za-z0-9_$]+)$/);
    if (aliasMatch) {
        return {
            imported: aliasMatch[1],
            local: aliasMatch[2],
            destructure: `${aliasMatch[1]}: ${aliasMatch[2]}`,
        };
    }

    return {
        imported: trimmed,
        local: trimmed,
        destructure: trimmed,
    };
}

function parseNamedImports(source) {
    return [...source.matchAll(/^import\s+\{\s*([^}]+)\s*\}\s+from\s+['"]([^'"]+)['"];?\s*$/gm)].map((match) => ({
        source: match[2],
        specifiers: match[1]
            .split(',')
            .map((part) => part.trim())
            .filter(Boolean)
            .map(parseImportSpecifier),
    }));
}

function stripImportStatements(source) {
    return source.replace(/^import\s+.*$/gm, '').trim();
}

function collectExports(source) {
    const exportNames = [];
    let transformed = source.replace(/^export function\s+([A-Za-z0-9_$]+)\s*\(/gm, (_, name) => {
        exportNames.push(name);
        return `function ${name}(`;
    });

    transformed = transformed.replace(/^export const\s+([A-Za-z0-9_$]+)\s*=/gm, (_, name) => {
        exportNames.push(name);
        return `const ${name} =`;
    });

    transformed = transformed.replace(/^export let\s+([A-Za-z0-9_$]+)\s*=/gm, (_, name) => {
        exportNames.push(name);
        return `let ${name} =`;
    });

    transformed = transformed.replace(/^export class\s+([A-Za-z0-9_$]+)\b/gm, (_, name) => {
        exportNames.push(name);
        return `class ${name}`;
    });

    return { exportNames, transformed };
}

function resolveImportPath(fromFile, specifier) {
    if (!specifier.startsWith('.')) {
        throw new Error(`Unsupported non-local import "${specifier}" in ${path.relative(rootDir, fromFile)}`);
    }

    return path.resolve(path.dirname(fromFile), specifier);
}

function bundleModule(modulePath) {
    const relativePath = path.relative(rootDir, modulePath).replace(/\\/g, '/');
    if (visitedModules.has(relativePath)) {
        return;
    }
    visitedModules.add(relativePath);

    const source = readText(modulePath, relativePath);
    const imports = parseNamedImports(source);

    for (const entry of imports) {
        bundleModule(resolveImportPath(modulePath, entry.source));
    }

    const importBindings = imports.flatMap((entry) => entry.specifiers.map((specifier) => specifier.destructure));
    const { exportNames, transformed } = collectExports(stripImportStatements(source));
    const importPrelude = importBindings.length > 0
        ? `const { ${importBindings.join(', ')} } = window.__SINGBOX_BUNDLE__;\n`
        : '';
    const exportAssignments = exportNames
        .map((name) => `window.__SINGBOX_BUNDLE__.${name} = ${name};`)
        .join('\n');

    moduleBodies.push(`(() => {\nwindow.__SINGBOX_BUNDLE__ = window.__SINGBOX_BUNDLE__ || {};\n${importPrelude}${transformed}\n${exportAssignments}\n})();`);
}

function buildFontAwesomeCss() {
    let css = readText(path.join(vendorDir, 'fontawesome-all.min.css'), 'vendor/fontawesome-all.min.css');
    const fontFiles = [
        'fa-brands-400',
        'fa-regular-400',
        'fa-solid-900',
        'fa-v4compatibility',
    ];

    for (const fontName of fontFiles) {
        const dataUri = `data:font/woff2;base64,${readBase64(path.join(vendorDir, `${fontName}.woff2`), `vendor/${fontName}.woff2`)}`;
        const sourcePattern = new RegExp(
            `url\\(\\.\\./webfonts/${escapeRegExp(fontName)}\\.woff2\\) format\\("woff2"\\),url\\(\\.\\./webfonts/${escapeRegExp(fontName)}\\.ttf\\) format\\("truetype"\\)`,
            'g',
        );
        css = css.replace(sourcePattern, `url(${dataUri}) format("woff2")`);
    }

    if (/\.\.\/webfonts\//.test(css)) {
        throw new Error('Failed to inline all Font Awesome font references');
    }

    return css;
}

function buildVendorBlock() {
    const fontAwesomeCss = escapeInlineStyle(buildFontAwesomeCss());
    const vueSource = escapeInlineScript(readText(path.join(vendorDir, 'vue.global.prod.js'), 'vendor/vue.global.prod.js'));
    const tailwindSource = escapeInlineScript(readText(path.join(vendorDir, 'tailwind.forms.js'), 'vendor/tailwind.forms.js'));

    return [
        '    <!-- BUILD_VENDOR_ASSETS_START -->',
        '    <style>',
        fontAwesomeCss,
        '    </style>',
        '    <script>',
        vueSource,
        '    </script>',
        '    <script>',
        tailwindSource,
        '    </script>',
        '    <!-- BUILD_VENDOR_ASSETS_END -->',
    ].join('\n');
}

const mainImports = parseNamedImports(mainSource);
for (const entry of mainImports) {
    bundleModule(resolveImportPath(mainPath, entry.source));
}

const mainBindings = mainImports.flatMap((entry) => entry.specifiers.map((specifier) => specifier.destructure));
const mainPrelude = mainBindings.length > 0 ? `const { ${mainBindings.join(', ')} } = window.__SINGBOX_BUNDLE__;\n` : '';
const mainBody = stripImportStatements(mainSource);
const bundledCode = `window.__SINGBOX_BUNDLE__ = window.__SINGBOX_BUNDLE__ || {};\n${moduleBodies.join('\n\n')}\n\n(() => {\n${mainPrelude}${mainBody}\n})();`;
const bundledScript = `<script>\n${escapeInlineScript(bundledCode)}\n</script>`;

if (!vendorBlockPattern.test(html)) {
    throw new Error('Failed to find vendor asset block in singbox.html');
}

let packedHtml = html.replace(vendorBlockPattern, () => buildVendorBlock());
if (packedHtml.includes(externalEntryScriptTag)) {
    packedHtml = packedHtml.replace(externalEntryScriptTag, () => bundledScript);
} else if (inlineEntryScriptPattern.test(packedHtml)) {
    packedHtml = packedHtml.replace(inlineEntryScriptPattern, () => bundledScript);
} else {
    throw new Error('Failed to find module entry script in singbox.html');
}

if (packedHtml === html || packedHtml.includes(externalEntryScriptTag) || inlineEntryScriptPattern.test(packedHtml)) {
    throw new Error('Failed to replace module entry script in singbox.html');
}

fs.mkdirSync(path.dirname(outputPath), { recursive: true });
fs.writeFileSync(outputPath, packedHtml);

console.log(`Built single-file HTML: ${outputPath}`);
