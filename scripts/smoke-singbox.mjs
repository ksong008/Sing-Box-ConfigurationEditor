import fs from 'node:fs/promises';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath, pathToFileURL } from 'node:url';

import {
    assert,
    collectBrowserErrors,
    extractLastInlineScript,
    logStep,
    resolveOptionalModule,
    waitForRenderedApp,
    withStaticServer,
} from './lib/smoke-helpers.mjs';
import { runNodeUiCapabilityRegression } from './lib/node-ui-regression.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

const buildScriptPath = path.join(rootDir, 'scripts', 'build-single-html.mjs');
const distHtmlPath = path.join(rootDir, 'dist', 'singbox.test.html');
const liveHtmlPath = path.join(rootDir, 'singbox.html');
const syntaxOnly = process.argv.includes('--syntax-only');

function runNodeCommand(args) {
    execFileSync(process.execPath, args, {
        cwd: rootDir,
        stdio: 'inherit',
    });
}

async function runRenderCheck(browser, url, label) {
    const page = await browser.newPage();
    const errors = collectBrowserErrors(page);

    await page.goto(url, { waitUntil: 'load' });
    const stats = await waitForRenderedApp(page, label);

    if (errors.length > 0) {
        throw new Error(`[${label}] browser reported errors:\n${errors.join('\n')}`);
    }

    logStep(`${label} page rendered (${stats.buttons} buttons, ${stats.headings} heading)`);
    await page.close();
}

async function runNodeUiRegressionCheck(browser, url, label) {
    const page = await browser.newPage();
    const errors = collectBrowserErrors(page);

    try {
        await page.addInitScript(() => {
            localStorage.clear();
            sessionStorage.clear();
        });
        await page.goto(url, { waitUntil: 'load' });
        await waitForRenderedApp(page, `${label} node UI regression`);
        await runNodeUiCapabilityRegression(page, { assert, logStep, label: `${label} node UI` });

        if (errors.length > 0) {
            throw new Error(`[${label}] node UI regression browser reported errors:\n${errors.join('\n')}`);
        }

        logStep(`${label} node UI regression passed`);
    } finally {
        await page.close();
    }
}

async function runBrowserStages() {
    const playwrightHref = resolveOptionalModule('playwright', rootDir);
    if (!playwrightHref) {
        logStep('Playwright not found. Skipping browser stages. Install it locally or expose it through NODE_PATH for full smoke coverage.');
        return;
    }

    const playwrightModule = await import(playwrightHref);
    const chromium = playwrightModule.chromium || playwrightModule.default?.chromium;
    assert(chromium, 'Resolved playwright module does not expose chromium');
    const browser = await chromium.launch({ headless: true });

    try {
        assert(await fs.stat(liveHtmlPath).then((item) => item.isFile()).catch(() => false), 'Missing singbox.html');
        assert(await fs.stat(distHtmlPath).then((item) => item.isFile()).catch(() => false), 'Missing dist/singbox.test.html');

        await withStaticServer(rootDir, async ({ origin }) => {
            await runRenderCheck(browser, `${origin}/singbox.html?smoke=${Date.now()}`, 'live');
        });

        await runRenderCheck(browser, pathToFileURL(distHtmlPath).href, 'offline');
        await runNodeUiRegressionCheck(browser, pathToFileURL(distHtmlPath).href, 'offline');
    } finally {
        await browser.close();
    }
}

async function main() {
    logStep('Building offline bundle');
    runNodeCommand([buildScriptPath]);

    logStep('Checking extracted offline bundle syntax');
    const extractedBundlePath = await extractLastInlineScript(distHtmlPath);
    try {
        runNodeCommand(['--check', extractedBundlePath]);
    } finally {
        await fs.unlink(extractedBundlePath).catch(() => {});
    }

    if (syntaxOnly) {
        logStep('Syntax-only smoke passed');
        return;
    }

    await runBrowserStages();
    logStep('Smoke checks passed');
}

main().catch((error) => {
    console.error(`[smoke] failed: ${error.message}`);
    process.exitCode = 1;
});
