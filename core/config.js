import { applyDialFields } from './config-utils.js';
import { buildConfigDns } from './config/dns.js';
import { buildConfigInbounds } from './config/inbounds.js';
import { buildConfigOutbounds } from './config/outbounds.js';
import { buildConfigRoute, getTproxyDnsContext } from './config/route.js';
import { setupJsonPreviewScroll } from './json-scroll.js';
import { createFullStateGetter } from './state-snapshot.js';

const { computed, onUnmounted } = window.Vue;

export function setupConfigCore(ctx) {
    const generatedJson = computed(() => {
        const outbounds = buildConfigOutbounds(ctx);
        const { dnsTagSet, dnsServers, dnsRules } = buildConfigDns(ctx);
        const { useDnsNatInTproxy, useDnsDirectInTproxy } = getTproxyDnsContext(ctx);
        const route = buildConfigRoute(ctx, {
            dnsTagSet,
            dnsServers,
            useDnsNatInTproxy,
            useDnsDirectInTproxy,
        });
        const inbounds = buildConfigInbounds(ctx, { useDnsNatInTproxy });

        let experimental = undefined;
        const cache_file = {};
        let hasCache = false;

        if (ctx.settings.value.cache_file_path) {
            cache_file.path = ctx.settings.value.cache_file_path;
            hasCache = true;
        }
        if (ctx.clashApi.value.store_fakeip) {
            cache_file.store_fakeip = true;
            hasCache = true;
        }
        if (ctx.settings.value.store_rdrc) {
            cache_file.store_rdrc = true;
            hasCache = true;
        }

        if (hasCache) cache_file.enabled = true;

        if (ctx.clashApi.value.enabled) {
            const clashApi = {
                external_controller: ctx.clashApi.value.external_controller,
                default_mode: ctx.clashApi.value.default_mode || 'rule',
            };
            if (ctx.clashApi.value.secret) clashApi.secret = ctx.clashApi.value.secret;
            if (ctx.clashApi.value.external_ui) clashApi.external_ui = ctx.clashApi.value.external_ui;
            if (ctx.clashApi.value.download_url) clashApi.external_ui_download_url = ctx.clashApi.value.download_url;
            if (ctx.clashApi.value.allow_lan) clashApi.access_control_allow_private_network = true;

            experimental = { clash_api: clashApi };
            if (hasCache) experimental.cache_file = cache_file;
        } else if (hasCache) {
            experimental = { cache_file };
        }

        let ntpConfig;
        if (ctx.ntp.value.enabled) {
            ntpConfig = {
                enabled: true,
                server: ctx.ntp.value.server,
                server_port: ctx.ntp.value.server_port,
                interval: ctx.ntp.value.interval,
                detour: ctx.ntp.value.detour,
            };
            applyDialFields(ntpConfig, ctx.ntp.value, { validDnsTags: dnsTagSet });
        }

        const config = {
            log: { level: ctx.settings.value.log_level, timestamp: true },
            ntp: ntpConfig,
            dns: {
                servers: dnsServers,
                rules: dnsRules.length > 0 ? dnsRules : undefined,
                strategy: ctx.settings.value.dns_strategy,
                final: ctx.settings.value.dns_final || undefined,
                disable_cache: ctx.settings.value.dns_disable_cache || undefined,
                disable_expire: ctx.settings.value.dns_disable_expire || undefined,
                cache_capacity: ctx.settings.value.dns_cache_capacity || undefined,
                client_subnet: ctx.settings.value.dns_client_subnet || undefined,
                independent_cache: ctx.settings.value.independent_cache || undefined,
                reverse_mapping: ctx.settings.value.reverse_mapping || undefined,
            },
            inbounds,
            outbounds,
            route,
            experimental,
        };

        return JSON.stringify(config, (key, value) => {
            if (value === undefined || value === null || value === '' || (Array.isArray(value) && value.length === 0)) return undefined;
            return value;
        }, 2);
    });

    const jsonScroll = setupJsonPreviewScroll(ctx, generatedJson);
    const getFullState = createFullStateGetter(ctx);

    onUnmounted(() => {
        jsonScroll.cleanupJsonScroll();
    });

    Object.assign(ctx, {
        scrollJsonTo: jsonScroll.scrollJsonTo,
        scrollJsonToRequest: jsonScroll.scrollJsonToRequest,
        queueJsonScrollTo: jsonScroll.queueJsonScrollTo,
        queueJsonScrollToTarget: jsonScroll.queueJsonScrollToTarget,
        generatedJson,
        getFullState,
    });
}
