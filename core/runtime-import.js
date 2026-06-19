import {
    parseRuntimeGroupOutbound,
    parseRuntimeOutbound,
} from './protocol-codecs/index.js';
import { applyRuntimeDnsImport } from './runtime-import/dns.js';
import { applyRuntimeInboundsImport } from './runtime-import/inbounds.js';
import { applyRuntimeRouteImport } from './runtime-import/route.js';
import { looksLikeRuntimeConfig } from './runtime-import/utils.js';

export { looksLikeRuntimeConfig } from './runtime-import/utils.js';

export function createRuntimeImporter(ctx, {
    resetRuntimeImportState,
    absorbFakeipServer,
} = {}) {
    const resetRuntime = typeof resetRuntimeImportState === 'function' ? resetRuntimeImportState : () => {};
    const absorbFakeip = typeof absorbFakeipServer === 'function' ? absorbFakeipServer : () => {};

    const applyRuntimeImport = (data) => {
        if (!looksLikeRuntimeConfig(data)) throw new Error('这不是可识别的 sing-box 运行配置 JSON');
        resetRuntime();

        if (data.log && typeof data.log.level === 'string') {
            ctx.settings.value.log_level = data.log.level;
        }

        applyRuntimeDnsImport(ctx, data.dns, absorbFakeip);

        if (data.experimental && Object.prototype.toString.call(data.experimental) === '[object Object]') {
            if (data.experimental.cache_file) {
                const cacheFile = data.experimental.cache_file;
                ctx.settings.value.cache_file_path = cacheFile.path || ctx.settings.value.cache_file_path;
                ctx.clashApi.value.store_fakeip = !!cacheFile.store_fakeip;
                ctx.settings.value.store_rdrc = !!cacheFile.store_rdrc;
            }
            if (data.experimental.clash_api) {
                const clashApi = data.experimental.clash_api;
                ctx.clashApi.value.enabled = true;
                ctx.clashApi.value.external_controller = clashApi.external_controller || ctx.clashApi.value.external_controller;
                ctx.clashApi.value.default_mode = clashApi.default_mode || ctx.clashApi.value.default_mode;
                ctx.clashApi.value.secret = clashApi.secret || '';
                ctx.clashApi.value.external_ui = clashApi.external_ui || '';
                ctx.clashApi.value.download_url = clashApi.external_ui_download_url || '';
                ctx.clashApi.value.allow_lan = !!clashApi.access_control_allow_private_network;
            }
        }

        if (data.ntp && Object.prototype.toString.call(data.ntp) === '[object Object]') {
            ctx.ntp.value = typeof ctx.normalizeNtp === 'function' ? ctx.normalizeNtp(data.ntp) : data.ntp;
        }

        applyRuntimeInboundsImport(ctx, data.inbounds);

        const outbounds = Array.isArray(data.outbounds) ? data.outbounds : [];
        outbounds.forEach((outbound) => {
            if (!outbound || typeof outbound !== 'object') return;
            if (outbound.type === 'direct' && outbound.bind_interface) {
                ctx.tun.value.non_gateway_mode = true;
                ctx.tun.value.bind_interface = outbound.bind_interface;
                return;
            }
            const group = parseRuntimeGroupOutbound(outbound, ctx);
            if (group) {
                ctx.groups.value.push(group);
                return;
            }
            const node = parseRuntimeOutbound(outbound, ctx);
            if (node) ctx.nodes.value.push(node);
        });

        applyRuntimeRouteImport(ctx, data.route);

        ctx.showImportExport.value = false;
    };

    return {
        applyRuntimeImport,
    };
}
