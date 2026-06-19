import { applyRuntimeDnsImport } from './runtime-import/dns.js';
import { applyRuntimeInboundsImport } from './runtime-import/inbounds.js';
import { applyRuntimeOutboundsImport } from './runtime-import/outbounds.js';
import { applyRuntimeRouteImport } from './runtime-import/route.js';
import {
    applyRuntimeExperimentalImport,
    applyRuntimeLogImport,
    applyRuntimeNtpImport,
} from './runtime-import/settings.js';
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

        applyRuntimeLogImport(ctx, data.log);
        applyRuntimeDnsImport(ctx, data.dns, absorbFakeip);
        applyRuntimeExperimentalImport(ctx, data.experimental);
        applyRuntimeNtpImport(ctx, data.ntp);
        applyRuntimeInboundsImport(ctx, data.inbounds);
        applyRuntimeOutboundsImport(ctx, data.outbounds);
        applyRuntimeRouteImport(ctx, data.route);

        ctx.showImportExport.value = false;
    };

    return {
        applyRuntimeImport,
    };
}
