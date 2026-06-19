import { inferJsonFieldKey } from './json-scroll/field-inference.js';
import {
    findFirstMatchingLineIndex,
    findFirstMatchingLineIndexInRange,
    findLineIndex,
} from './json-scroll/line-search.js';
import { buildJsonScrollRequest } from './json-scroll/requests.js';

const { watch, nextTick } = window.Vue;

export function setupJsonPreviewScroll(ctx, generatedJson) {
    let jsonTargetScrollTimer = null;
    let diffScrollTimer = null;

    const scrollJsonToLineIndex = async (lineIndex, { offset = 0, align = 0.5 } = {}) => {
        await nextTick();
        const el = ctx.jsonContainer.value;
        const text = generatedJson?.value;
        if (!el || !text) return;
        const lines = text.split('\n');
        if (lineIndex < 0 || lineIndex >= lines.length) return;
        const lineHeight = el.scrollHeight / Math.max(lines.length, 1) || 20;
        const targetLine = Math.max(0, Math.min(lines.length - 1, lineIndex + offset));
        const rawTop = targetLine * lineHeight - el.clientHeight * align;
        const maxTop = Math.max(0, el.scrollHeight - el.clientHeight);
        el.scrollTo({
            top: Math.max(0, Math.min(maxTop, rawTop)),
            behavior: 'smooth',
        });
    };

    const scrollJsonTo = async (keyword, { offset = 0, fallbackToEnd = false } = {}) => {
        await nextTick();
        const el = ctx.jsonContainer.value;
        if (!el || !generatedJson) return;
        const text = generatedJson.value;
        const lines = text.split('\n');
        let targetLine = -1;
        for (let i = 0; i < lines.length; i += 1) {
            if (lines[i].includes(keyword)) {
                targetLine = i;
                break;
            }
        }
        if (targetLine === -1) {
            if (fallbackToEnd) el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' });
            return;
        }
        await scrollJsonToLineIndex(targetLine, { offset, align: 0.25 });
    };

    const scrollJsonToRequest = async (type, payload = null) => {
        await nextTick();
        const text = generatedJson?.value;
        if (!text) return;
        const lines = text.split('\n');
        const request = buildJsonScrollRequest(type, payload, lines);
        if (!request) return;

        let targetLine = findFirstMatchingLineIndex(lines, request.matchers, request.startIndex || 0);
        if (targetLine !== -1 && Array.isArray(request.fieldMatchers) && request.fieldMatchers.length > 0) {
            const nextTagIndex = findLineIndex(lines, '"tag":', targetLine + 1);
            const searchEnd = nextTagIndex === -1
                ? Math.min(lines.length, targetLine + (request.fieldSearchWindow || 180))
                : Math.min(nextTagIndex, targetLine + (request.fieldSearchWindow || 180));
            const fieldLine = findFirstMatchingLineIndexInRange(lines, request.fieldMatchers, targetLine, searchEnd);
            if (fieldLine !== -1) targetLine = fieldLine;
        }
        if (targetLine === -1) {
            targetLine = findFirstMatchingLineIndex(lines, request.fallbackMatchers, 0);
        }
        if (targetLine === -1) return;
        await scrollJsonToLineIndex(targetLine, { align: 0.5 });
    };

    const queueJsonScrollTo = (type, payload = null) => {
        clearTimeout(jsonTargetScrollTimer);
        jsonTargetScrollTimer = setTimeout(() => {
            scrollJsonToRequest(type, payload);
        }, 80);
    };

    const queueJsonScrollToTarget = (type, payload = null, event = null) => {
        const fieldKey = inferJsonFieldKey(type, payload, event);
        queueJsonScrollTo(type, {
            target: payload,
            fieldKey,
        });
    };

    watch(generatedJson, (newStr, oldStr) => {
        if (!oldStr || !ctx.jsonContainer.value) return;
        clearTimeout(diffScrollTimer);
        diffScrollTimer = setTimeout(async () => {
            await nextTick();
            const el = ctx.jsonContainer.value;
            if (!el) return;
            const newLines = newStr.split('\n');
            const oldLines = oldStr.split('\n');
            let diffLine = -1;
            for (let i = 0; i < newLines.length; i += 1) {
                if (newLines[i] !== oldLines[i]) {
                    diffLine = i;
                    break;
                }
            }
            if (diffLine === -1 && newLines.length < oldLines.length) diffLine = newLines.length - 1;
            if (diffLine !== -1) {
                const lineHeight = el.scrollHeight / Math.max(newLines.length, 1);
                const targetY = diffLine * lineHeight;
                const currentTop = el.scrollTop;
                const viewHeight = el.clientHeight;
                if (targetY < currentTop + 60 || targetY > currentTop + viewHeight - 60) {
                    el.scrollTo({
                        top: Math.max(0, targetY - viewHeight * 0.25),
                        behavior: 'smooth',
                    });
                }
            }
        }, 80);
    });

    watch(ctx.currentTab, (newTab) => {
        if (!ctx.jsonContainer.value) return;
        const tabMap = {
            dns: '"dns": {',
            nodes: '"outbounds": [',
            groups: '"outbounds": [',
            rules: '"route": {',
            advanced: '"inbounds": [',
        };
        const keyword = tabMap[newTab];
        if (keyword) {
            setTimeout(() => {
                const el = ctx.jsonContainer.value;
                const text = generatedJson.value;
                const idx = text.indexOf(keyword);
                if (idx !== -1) {
                    const lines = text.substring(0, idx).split('\n');
                    const lineHeight = el.scrollHeight / Math.max(text.split('\n').length, 1);
                    const targetY = lines.length * lineHeight + 24;
                    el.scrollTo({ top: Math.max(0, targetY - 60), behavior: 'smooth' });
                }
            }, 50);
        }
    });

    const cleanupJsonScroll = () => {
        clearTimeout(diffScrollTimer);
        clearTimeout(jsonTargetScrollTimer);
    };

    return {
        scrollJsonTo,
        scrollJsonToRequest,
        queueJsonScrollTo,
        queueJsonScrollToTarget,
        cleanupJsonScroll,
    };
}
