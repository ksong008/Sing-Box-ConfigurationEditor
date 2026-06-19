import { buildConfigDns } from './config/dns.js';
import { buildConfigExperimental } from './config/experimental.js';
import { buildConfigInbounds } from './config/inbounds.js';
import { buildConfigNtp } from './config/ntp.js';
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
        const experimental = buildConfigExperimental(ctx);
        const ntpConfig = buildConfigNtp(ctx, { dnsTagSet });

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
