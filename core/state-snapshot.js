import { sanitizeNodeByCapabilities } from './node-capabilities.js';

export function createFullStateGetter(ctx) {
    return () => {
        const cleanNodes = ctx.nodes.value.map((node) => {
            const cleanNode = { ...node };
            sanitizeNodeByCapabilities(cleanNode);
            const defaultNode = ctx.makeNode({ type: cleanNode.type });

            Object.keys(cleanNode).forEach((key) => {
                if (['tag', 'type', 'server', 'port', 'insecure'].includes(key)) return;
                if (cleanNode[key] === '' || cleanNode[key] === null) {
                    delete cleanNode[key];
                } else if (cleanNode[key] === false && defaultNode[key] === false) {
                    delete cleanNode[key];
                }
            });

            return cleanNode;
        });

        const cleanDnsList = ctx.dnsList.value.map((dns, index) => {
            const cleanDns = typeof ctx.normalizeDnsServer === 'function' ? ctx.normalizeDnsServer(dns, index) : { ...dns };

            if (!['https', 'h3'].includes(cleanDns.type)) {
                delete cleanDns.path;
                delete cleanDns.headers_text;
            }

            Object.keys(cleanDns).forEach((key) => {
                if (['tag', 'type'].includes(key)) return;
                if (cleanDns[key] === '' || cleanDns[key] === null) delete cleanDns[key];
                else if (cleanDns[key] === false) delete cleanDns[key];
            });

            return cleanDns;
        });

        const defaultNtp = typeof ctx.normalizeNtp === 'function' ? ctx.normalizeNtp() : {};
        const cleanNtp = { ...ctx.ntp.value };
        Object.keys(cleanNtp).forEach((key) => {
            if (cleanNtp[key] === '' || cleanNtp[key] === null) {
                delete cleanNtp[key];
                return;
            }
            if (cleanNtp[key] === false && defaultNtp[key] === false) {
                delete cleanNtp[key];
                return;
            }
            if (cleanNtp[key] === defaultNtp[key]) {
                delete cleanNtp[key];
            }
        });

        return {
            _version: '1.12',
            _exported: new Date().toISOString(),
            settings: ctx.settings.value,
            fakeip: ctx.fakeip.value,
            tun: ctx.tun.value,
            clashApi: ctx.clashApi.value,
            ntp: cleanNtp,
            tproxy: (({ server_ports, ...rest }) => rest)(ctx.tproxy.value),
            extraInbounds: ctx.extraInbounds.value.map(ctx.normalizeExtraInbound),
            corsProxyEnabled: ctx.corsProxyEnabled.value,
            dnsList: cleanDnsList,
            providers: ctx.providers.value,
            nodes: cleanNodes,
            groups: ctx.groups.value.map((group) => {
                const cleanGroup = { ...group };
                delete cleanGroup.draggable;
                delete cleanGroup.collapsed;
                return cleanGroup;
            }),
            ruleSets: ctx.ruleSets.value,
            routeRules: ctx.routeRules.value.map((rule) => {
                const cleanRule = { ...rule };
                delete cleanRule.isEditing;
                delete cleanRule.draggable;
                delete cleanRule.route_options_enabled;
                delete cleanRule.route_options_show_all;

                if (cleanRule.action !== 'route') delete cleanRule.outbound;
                if (cleanRule.action !== 'reject') {
                    delete cleanRule.reject_method;
                    delete cleanRule.reject_no_drop;
                }
                if (cleanRule.action !== 'sniff') {
                    delete cleanRule.sniff_sniffer;
                    delete cleanRule.sniff_timeout;
                }
                if (cleanRule.action !== 'resolve') {
                    delete cleanRule.resolve_server;
                    delete cleanRule.resolve_strategy;
                    delete cleanRule.resolve_disable_cache;
                    delete cleanRule.resolve_rewrite_ttl;
                    delete cleanRule.resolve_client_subnet;
                }
                if (cleanRule.action !== 'route') {
                    delete cleanRule.option_override_address;
                    delete cleanRule.option_override_port;
                    delete cleanRule.option_network_strategy;
                    delete cleanRule.option_network_type;
                    delete cleanRule.option_fallback_network_type;
                    delete cleanRule.option_fallback_delay;
                    delete cleanRule.option_udp_disable_domain_unmapping;
                    delete cleanRule.option_udp_connect;
                    delete cleanRule.option_udp_timeout;
                    delete cleanRule.option_tls_fragment;
                    delete cleanRule.option_tls_fragment_fallback_delay;
                    delete cleanRule.option_tls_record_fragment;
                }

                Object.keys(cleanRule).forEach((key) => {
                    if (['id', 'enabled', 'name', 'mode', 'invert', 'conditions', 'action'].includes(key)) return;
                    if (cleanRule[key] === '' || cleanRule[key] === null) delete cleanRule[key];
                    else if (cleanRule[key] === false) delete cleanRule[key];
                });

                return cleanRule;
            }),
        };
    };
}
