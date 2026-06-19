import { createTproxyConflicts, showTproxyConflictModal } from './tproxy/conflicts.js';
import {
    buildExtraInbounds as buildExtraInboundsBase,
    makeExtraInbound as makeExtraInboundBase,
    nextExtraInboundTag as nextExtraInboundTagBase,
    normalizeExtraInbound as normalizeExtraInboundBase,
    onExtraInboundSocksVersionChange,
    onExtraInboundTypeChange as onExtraInboundTypeChangeBase,
    resetExtraInboundTls,
} from './tproxy/extra-inbounds.js';
import {
    getTproxyMarkIssues,
    resetTproxyMarksSafe as resetTproxyMarksSafeBase,
    sanitizeTproxyMarks as sanitizeTproxyMarksBase,
} from './tproxy/marks.js';
import { buildTproxyNft, cleanTproxyNft } from './tproxy/nft.js';

const { ref, computed, watch, nextTick } = window.Vue;

export function setupTproxyModule(ctx) {
    const extraInbounds = ref([]);
    const normalizeExtraInbound = (item = {}) => normalizeExtraInboundBase(item, ctx.generateId);

    const nextExtraInboundTag = (type = 'http') => nextExtraInboundTagBase(extraInbounds.value, type);
    const makeExtraInbound = (type = 'http') => makeExtraInboundBase({
        type,
        existing: extraInbounds.value,
        generateId: ctx.generateId,
    });

    const addExtraInbound = (type = 'http') => {
        extraInbounds.value.push(makeExtraInbound(type));
    };

    const removeExtraInbound = (index) => {
        extraInbounds.value.splice(index, 1);
    };

    const onExtraInboundTypeChange = (inbound) => onExtraInboundTypeChangeBase(inbound, nextExtraInboundTag);

    const buildExtraInbounds = () => buildExtraInboundsBase({
        extraInbounds: extraInbounds.value,
        settings: ctx.settings.value,
        generateId: ctx.generateId,
    });

    const tproxyMarkIssues = computed(() => getTproxyMarkIssues(ctx.tproxy.value));

    const sanitizeTproxyMarks = () => {
        if (sanitizeTproxyMarksBase(ctx.tproxy.value)) {
            ctx.showToast('Mark 已自动修正为安全值（111/112 或可用值）', 'warn', 3200);
        }
    };

    const resetTproxyMarksSafe = () => {
        resetTproxyMarksSafeBase(ctx.tproxy.value);
        ctx.showToast('已恢复安全默认：Mark=111，Route Mark=112', 'ok', 2800);
    };

    const tproxyConflicts = computed(() => createTproxyConflicts({
        tproxy: ctx.tproxy.value,
        tun: ctx.tun.value,
        markIssues: tproxyMarkIssues.value,
        resetTproxyMarksSafe,
    }));

    watch(() => ctx.tproxy.value.enabled, (newVal) => {
        if (newVal) {
            nextTick(() => {
                const conflicts = tproxyConflicts.value;
                if (conflicts.length > 0) {
                    showTproxyConflictModal(conflicts, {
                        onCancel: () => {
                            ctx.tproxy.value.enabled = false;
                        },
                    });
                }
            });
        }
    });

    const generatedNft = computed(() => buildTproxyNft({
        tproxy: ctx.tproxy.value,
        settings: ctx.settings.value,
        fakeip: ctx.fakeip.value,
    }));

    const generatedNftClean = computed(() => cleanTproxyNft(generatedNft.value));

    const nftCopyText = ref('复制 .nft');
    const nftCopyIcon = ref('fas fa-copy');

    const copyNft = async () => {
        nftCopyIcon.value = 'fas fa-spinner fa-spin';
        const ok = await ctx.copyToClipboard(generatedNftClean.value);
        setTimeout(() => {
            if (ok) {
                nftCopyIcon.value = 'fas fa-check';
                nftCopyText.value = '已复制';
                ctx.showToast('NFTables 规则已复制（纯净版）', 'ok');
            } else {
                nftCopyIcon.value = 'fas fa-times';
                nftCopyText.value = '复制失败';
            }
            setTimeout(() => {
                nftCopyIcon.value = 'fas fa-copy';
                nftCopyText.value = '复制 .nft';
            }, 2000);
        }, 300);
    };

    const downloadNft = () => {
        const blob = new Blob([generatedNftClean.value], { type: 'text/plain' });
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = `${ctx.tproxy.value.nft_table || 'singbox'}.nft`;
        a.click();
        URL.revokeObjectURL(a.href);
    };

    Object.assign(ctx, {
        normalizeExtraInbound,
        buildExtraInbounds,
        extraInbounds,
        addExtraInbound,
        removeExtraInbound,
        onExtraInboundTypeChange,
        onExtraInboundSocksVersionChange,
        resetExtraInboundTls,
        tproxyMarkIssues,
        sanitizeTproxyMarks,
        resetTproxyMarksSafe,
        tproxyConflicts,
        generatedNft,
        generatedNftClean,
        nftCopyText,
        nftCopyIcon,
        copyNft,
        downloadNft,
    });
}
