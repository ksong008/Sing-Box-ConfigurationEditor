import fs from 'node:fs/promises';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath, pathToFileURL } from 'node:url';

import {
    assert,
    collectBrowserErrors,
    logStep,
    resolveOptionalModule,
    waitForRenderedApp,
} from './lib/smoke-helpers.mjs';
import { runNodeUiCapabilityRegression } from './lib/node-ui-regression.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');
const buildScriptPath = path.join(rootDir, 'scripts', 'build-single-html.mjs');
const distHtmlPath = path.join(rootDir, 'dist', 'singbox.test.html');
const requirePlaywright = process.argv.includes('--require-playwright');
const skipBuild = process.argv.includes('--skip-build');

function runNodeCommand(args) {
    execFileSync(process.execPath, args, {
        cwd: rootDir,
        stdio: 'inherit',
    });
}

async function runBrowserRegression() {
    const playwrightHref = resolveOptionalModule('playwright', rootDir);
    if (!playwrightHref) {
        const message = 'Playwright not found. Skipping node UI regression. Install it locally or expose it through NODE_PATH for full UI coverage.';
        if (requirePlaywright) throw new Error(message);
        logStep(message);
        return;
    }

    if (!skipBuild) {
        logStep('Building offline bundle for node UI regression');
        runNodeCommand([buildScriptPath]);
    }

    assert(await fs.stat(distHtmlPath).then((item) => item.isFile()).catch(() => false), 'Missing dist/singbox.test.html');

    const playwrightModule = await import(playwrightHref);
    const chromium = playwrightModule.chromium || playwrightModule.default?.chromium;
    assert(chromium, 'Resolved playwright module does not expose chromium');

    const browser = await chromium.launch({ headless: true });
    const page = await browser.newPage();
    const errors = collectBrowserErrors(page);

    try {
        await page.addInitScript(() => {
            localStorage.clear();
            sessionStorage.clear();
        });
        await page.goto(pathToFileURL(distHtmlPath).href, { waitUntil: 'load' });
        await waitForRenderedApp(page, 'offline node UI regression');
        await runNodeUiCapabilityRegression(page, { assert, logStep, label: 'offline node UI' });

        if (errors.length > 0) {
            throw new Error(`Node UI regression browser reported errors:\n${errors.join('\n')}`);
        }

        logStep('Node UI regression passed');
    } finally {
        await page.close().catch(() => {});
        await browser.close();
    }
}

runBrowserRegression().catch((error) => {
    console.error(`[node-ui] failed: ${error.message}`);
    process.exitCode = 1;
});
