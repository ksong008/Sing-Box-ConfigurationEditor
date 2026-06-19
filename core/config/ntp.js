import { applyDialFields } from '../config-utils.js';

export const buildConfigNtp = (ctx, { dnsTagSet = new Set() } = {}) => {
    if (!ctx.ntp.value.enabled) return undefined;

    const ntpConfig = {
        enabled: true,
        server: ctx.ntp.value.server,
        server_port: ctx.ntp.value.server_port,
        interval: ctx.ntp.value.interval,
        detour: ctx.ntp.value.detour,
    };
    applyDialFields(ntpConfig, ctx.ntp.value, { validDnsTags: dnsTagSet });
    return ntpConfig;
};
