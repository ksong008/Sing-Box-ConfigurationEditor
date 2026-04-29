import fs from 'node:fs/promises';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath, pathToFileURL } from 'node:url';

import {
    assert,
    extractLastInlineScript,
    logStep,
    resolveOptionalModule,
    withStaticServer,
} from './lib/smoke-helpers.mjs';

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

async function waitForRenderedApp(page, label) {
    const deadline = Date.now() + 15000;
    let lastButtons = 0;
    let lastHeadings = 0;
    let lastMounted = null;

    while (Date.now() < deadline) {
        lastButtons = await page.locator('button').count();
        lastHeadings = await page.locator('h1').count();
        lastMounted = await page.locator('#app').getAttribute('data-v-app');

        if (lastButtons >= 10 && lastHeadings >= 1 && lastMounted !== null) {
            return {
                buttons: lastButtons,
                headings: lastHeadings,
            };
        }

        await page.waitForTimeout(250);
    }

    throw new Error(
        `[${label}] app did not render expected controls within timeout (buttons=${lastButtons}, h1=${lastHeadings}, data-v-app=${lastMounted})`,
    );
}

async function runRenderCheck(browser, url, label) {
    const page = await browser.newPage();
    const errors = [];
    const ignoredWarningPatterns = [
        /cdn\.tailwindcss\.com should not be used in production/i,
        /parser-blocking, cross site .* invoked via document\.write/i,
    ];

    page.on('pageerror', (error) => {
        errors.push(`pageerror: ${error.stack || error.message}`);
    });

    page.on('console', (msg) => {
        const text = msg.text();
        if (msg.type() === 'error') {
            errors.push(`console:error: ${text}`);
            return;
        }
        if (msg.type() === 'warning' && !ignoredWarningPatterns.some((pattern) => pattern.test(text))) {
            errors.push(`console:warning: ${text}`);
        }
    });

    await page.goto(url, { waitUntil: 'load' });
    const stats = await waitForRenderedApp(page, label);

    if (errors.length > 0) {
        throw new Error(`[${label}] browser reported errors:\n${errors.join('\n')}`);
    }

    logStep(`${label} page rendered (${stats.buttons} buttons, ${stats.headings} heading)`);
    await page.close();
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
