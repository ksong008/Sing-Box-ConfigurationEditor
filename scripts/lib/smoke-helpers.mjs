import fs from 'node:fs';
import fsp from 'node:fs/promises';
import http from 'node:http';
import os from 'node:os';
import path from 'node:path';
import { createRequire } from 'node:module';
import { pathToFileURL } from 'node:url';

const MIME_TYPES = new Map([
    ['.css', 'text/css; charset=utf-8'],
    ['.html', 'text/html; charset=utf-8'],
    ['.js', 'text/javascript; charset=utf-8'],
    ['.json', 'application/json; charset=utf-8'],
    ['.svg', 'image/svg+xml'],
    ['.txt', 'text/plain; charset=utf-8'],
    ['.woff2', 'font/woff2'],
]);

export function logStep(message) {
    console.log(`[smoke] ${message}`);
}

export function assert(condition, message) {
    if (!condition) throw new Error(message);
}

export const DEFAULT_IGNORED_BROWSER_WARNING_PATTERNS = Object.freeze([
    /cdn\.tailwindcss\.com should not be used in production/i,
    /parser-blocking, cross site .* invoked via document\.write/i,
]);

export function collectBrowserErrors(page, ignoredWarningPatterns = DEFAULT_IGNORED_BROWSER_WARNING_PATTERNS) {
    const errors = [];

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

    return errors;
}

export async function waitForRenderedApp(page, label) {
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

function getMimeType(filePath) {
    return MIME_TYPES.get(path.extname(filePath).toLowerCase()) || 'application/octet-stream';
}

function normalizePathname(pathname) {
    const decoded = decodeURIComponent(pathname || '/');
    return decoded === '/' ? '/singbox.html' : decoded;
}

export async function withStaticServer(rootDir, callback) {
    const server = http.createServer(async (req, res) => {
        try {
            const requestUrl = new URL(req.url || '/', 'http://127.0.0.1');
            const relativePath = normalizePathname(requestUrl.pathname);
            const resolvedPath = path.resolve(rootDir, `.${relativePath}`);

            if (!resolvedPath.startsWith(rootDir + path.sep) && resolvedPath !== rootDir) {
                res.writeHead(403, { 'content-type': 'text/plain; charset=utf-8' });
                res.end('Forbidden');
                return;
            }

            const stat = await fsp.stat(resolvedPath).catch(() => null);
            if (!stat || !stat.isFile()) {
                res.writeHead(404, { 'content-type': 'text/plain; charset=utf-8' });
                res.end('Not Found');
                return;
            }

            res.writeHead(200, {
                'content-type': getMimeType(resolvedPath),
                'cache-control': 'no-store',
            });
            fs.createReadStream(resolvedPath).pipe(res);
        } catch (error) {
            res.writeHead(500, { 'content-type': 'text/plain; charset=utf-8' });
            res.end(`Internal Server Error: ${error.message}`);
        }
    });

    await new Promise((resolve, reject) => {
        server.once('error', reject);
        server.listen(0, '127.0.0.1', resolve);
    });

    const { port } = server.address();
    const origin = `http://127.0.0.1:${port}`;

    try {
        return await callback({ origin, port });
    } finally {
        await new Promise((resolve, reject) => {
            server.close((error) => (error ? reject(error) : resolve()));
        });
    }
}

export async function extractLastInlineScript(htmlPath) {
    const html = await fsp.readFile(htmlPath, 'utf8');
    const inlineScripts = [...html.matchAll(/<script>([\s\S]*?)<\/script>/gi)];
    assert(inlineScripts.length > 0, `No inline <script> block found in ${htmlPath}`);

    const extractedPath = path.join(os.tmpdir(), `singbox-smoke-${Date.now()}-${Math.random().toString(36).slice(2)}.js`);
    await fsp.writeFile(extractedPath, inlineScripts[inlineScripts.length - 1][1], 'utf8');
    return extractedPath;
}

export function resolveOptionalModule(specifier, rootDir) {
    const require = createRequire(import.meta.url);
    const nodePathDirs = String(process.env.NODE_PATH || '')
        .split(path.delimiter)
        .map((item) => item.trim())
        .filter(Boolean);

    const resolvePaths = [
        rootDir,
        path.join(rootDir, 'node_modules'),
        ...nodePathDirs,
    ];

    try {
        const resolved = require.resolve(specifier, { paths: resolvePaths });
        return pathToFileURL(resolved).href;
    } catch {
        return null;
    }
}
