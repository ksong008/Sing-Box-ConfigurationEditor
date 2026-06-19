import {
    applyDialFields,
    parseList,
    parseOptionalInteger,
} from './config-utils.js';
import { buildConfigDns } from './config/dns.js';
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

        const inbounds = [];
        const mixedIn = {
            type: 'mixed',
            tag: 'mixed-in',
            listen: '127.0.0.1',
            listen_port: ctx.settings.value.listen_port,
        };
        if (ctx.tproxy.value.enabled) {
            const tproxyInbound = {
                type: 'tproxy',
                tag: 'tproxy-in',
                listen: '::',
                listen_port: ctx.tproxy.value.listen_port,
            };
            if (ctx.tproxy.value.udp_fragment) tproxyInbound.udp_fragment = true;
            if (ctx.settings.value.sniff_enabled) {
                tproxyInbound.sniff = true;
                if (ctx.settings.value.sniff_override_destination) tproxyInbound.sniff_override_destination = true;
                if (ctx.settings.value.sniff_timeout) tproxyInbound.sniff_timeout = ctx.settings.value.sniff_timeout;
            }
            inbounds.push(tproxyInbound);
            if (useDnsNatInTproxy) {
                inbounds.push({
                    type: 'direct',
                    tag: 'dns-in',
                    listen: '127.0.0.1',
                    listen_port: ctx.tproxy.value.dns_port || 1053,
                    override_port: 53,
                });
            }
        }
        if (ctx.settings.value.sniff_enabled) {
            mixedIn.sniff = true;
            if (ctx.settings.value.sniff_override_destination) mixedIn.sniff_override_destination = true;
            if (ctx.settings.value.sniff_timeout) mixedIn.sniff_timeout = ctx.settings.value.sniff_timeout;
        }
        inbounds.push(mixedIn);

        if (ctx.tun.value.enabled) {
            const addresses = [ctx.tun.value.address_v4].filter(Boolean);
            if (ctx.tun.value.address_v6) addresses.push(ctx.tun.value.address_v6);
            const tunInbound = {
                type: 'tun',
                tag: 'tun-in',
                interface_name: ctx.tun.value.interface_name,
                address: addresses,
                mtu: ctx.tun.value.mtu,
                stack: ctx.tun.value.stack,
                auto_route: ctx.tun.value.auto_route,
                strict_route: ctx.tun.value.strict_route,
                endpoint_independent_nat: ctx.tun.value.endpoint_independent_nat,
            };
            if (ctx.tun.value.loopback_address) tunInbound.loopback_address = ctx.tun.value.loopback_address;
            if (ctx.tun.value.auto_redirect) tunInbound.auto_redirect = true;
            if (ctx.tun.value.auto_redirect && ctx.tun.value.auto_redirect_input_mark) tunInbound.auto_redirect_input_mark = ctx.tun.value.auto_redirect_input_mark;
            if (ctx.tun.value.auto_redirect && ctx.tun.value.auto_redirect_output_mark) tunInbound.auto_redirect_output_mark = ctx.tun.value.auto_redirect_output_mark;
            if (ctx.tun.value.udp_timeout) tunInbound.udp_timeout = ctx.tun.value.udp_timeout;
            const iproute2TableIndex = parseOptionalInteger(ctx.tun.value.iproute2_table_index);
            if (iproute2TableIndex !== undefined) tunInbound.iproute2_table_index = iproute2TableIndex;
            const iproute2RuleIndex = parseOptionalInteger(ctx.tun.value.iproute2_rule_index);
            if (iproute2RuleIndex !== undefined) tunInbound.iproute2_rule_index = iproute2RuleIndex;
            const includeInterface = parseList(ctx.tun.value.include_interface);
            if (includeInterface.length > 0) tunInbound.include_interface = includeInterface;
            const excludeInterface = parseList(ctx.tun.value.exclude_interface);
            if (excludeInterface.length > 0) tunInbound.exclude_interface = excludeInterface;
            const includePackage = parseList(ctx.tun.value.include_package);
            if (includePackage.length > 0) tunInbound.include_package = includePackage;
            const excludePackage = parseList(ctx.tun.value.exclude_package);
            if (excludePackage.length > 0) tunInbound.exclude_package = excludePackage;
            if (ctx.tun.value.non_gateway_mode && ctx.tun.value.route_exclude_address) {
                const excludeList = ctx.tun.value.route_exclude_address
                    .split('\n')
                    .map((line) => line.replace(/#.*$/, '').trim())
                    .filter((line) => line.length > 0);
                if (excludeList.length > 0) tunInbound.route_exclude_address = excludeList;
            }
            if (ctx.settings.value.sniff_enabled) {
                tunInbound.sniff = true;
                if (ctx.settings.value.sniff_override_destination) tunInbound.sniff_override_destination = true;
                if (ctx.settings.value.sniff_timeout) tunInbound.sniff_timeout = ctx.settings.value.sniff_timeout;
            }
            inbounds.push(tunInbound);
        }

        inbounds.push(...ctx.buildExtraInbounds());

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
