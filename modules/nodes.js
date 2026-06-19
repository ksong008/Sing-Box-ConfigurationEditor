import {
    getNodeAvailableNetworkOptions as resolveNodeAvailableNetworkOptions,
    getNodeCapabilityIssues as resolveNodeCapabilityIssues,
    getNodeAvailableTransportOptions as resolveNodeAvailableTransportOptions,
    getNodeCurrentNetworkValue as resolveNodeCurrentNetworkValue,
    isNodeTransportFieldVisible as resolveNodeTransportFieldVisible,
    isNodeTlsDefaultOn,
    resolveNodeCapabilities,
    sanitizeNodeByCapabilities,
    setNodeCurrentNetworkValue as resolveSetNodeCurrentNetworkValue,
    shouldShowNodeTransportSection as resolveShouldShowNodeTransportSection,
} from '../core/node-capabilities.js';
import { createNode } from './nodes/defaults.js';
import {
    getNodeDialVisibleFields as getNodeDialVisibleFieldsBase,
    hasNodeDialConfig as hasNodeDialConfigBase,
    hasNodeDialOptions as hasNodeDialOptionsBase,
    isNodeDialFieldEffectivelyMuted,
    isNodeDialFieldVisible as isNodeDialFieldVisibleBase,
    nodeHasBindingOverride,
    nodeHasDetourOverride,
} from './nodes/dial-fields.js';

const { ref, nextTick } = window.Vue;

export function setupNodesModule(ctx) {
    const makeNode = (overrides = {}) => createNode(overrides);

    const nodes = ref([]);
    const draggedNodeIndex = ref(null);
    const dragOverNodeIndex = ref(null);

    const focusNodeCard = async (index) => {
        await nextTick();
        const el = document.getElementById(`node-card-${index}`);
        if (el) {
            el.scrollIntoView({ behavior: 'smooth', block: 'center' });
            el.style.transition = 'box-shadow 0.2s, border-color 0.2s';
            el.style.borderColor = '#6366f1';
            el.style.boxShadow = '0 0 0 3px rgba(99,102,241,0.25)';
            setTimeout(() => {
                el.style.borderColor = '';
                el.style.boxShadow = '';
            }, 1800);
            const nameInput = el.querySelector('input[type="text"]');
            if (nameInput) setTimeout(() => nameInput.focus(), 300);
        }
    };

    const addNode = async (placement = 'top') => {
        const newTag = `Node-${nodes.value.length + 1}`;
        const newNode = makeNode({ tag: newTag, collapsed: true });
        if (placement === 'bottom') nodes.value.push(newNode);
        else nodes.value.unshift(newNode);
        const newIdx = placement === 'bottom' ? nodes.value.length - 1 : 0;
        await focusNodeCard(newIdx);
        if (typeof ctx.scrollJsonTo === 'function') {
            ctx.scrollJsonTo(`"tag": "${newTag}"`, { fallbackToEnd: true });
        }
    };

    const toggleNodeCollapsed = (index) => {
        nodes.value[index].collapsed = !nodes.value[index].collapsed;
    };

    const onNodeDragStart = (index, event) => {
        draggedNodeIndex.value = index;
        event.dataTransfer.effectAllowed = 'move';
    };
    const onNodeDragEnter = (index) => {
        if (draggedNodeIndex.value !== null) dragOverNodeIndex.value = index;
    };
    const onNodeDragEnd = () => {
        draggedNodeIndex.value = null;
        dragOverNodeIndex.value = null;
        nodes.value.forEach((node) => {
            node.draggable = false;
        });
    };
    const onNodeDrop = (index) => {
        const from = draggedNodeIndex.value;
        if (from !== null && from !== index) {
            const item = nodes.value.splice(from, 1)[0];
            nodes.value.splice(index, 0, item);
        }
        onNodeDragEnd();
    };

    const isNodeStreamTransport = (node = {}) => resolveNodeCapabilities(node).supportsStreamTransport;
    const isNodeDatagramTransport = (node = {}) => resolveNodeCapabilities(node).supportsDatagramTransport;
    const isNodeTlsSupported = (node = {}) => resolveNodeCapabilities(node).supportsTls;
    const isNodeTlsToggleVisible = (node = {}) => resolveNodeCapabilities(node).tlsToggleVisible;
    const isNodeMultiplexSupported = (node = {}) => resolveNodeCapabilities(node).supportsMultiplex;
    const isNodeQuicFieldSupported = (node = {}) => resolveNodeCapabilities(node).supportsQuicAdvancedFields;
    const isNodeTlsInsecureSupported = (node = {}) => resolveNodeCapabilities(node).supportsTlsInsecure;
    const isNodeTlsAlpnSupported = (node = {}) => resolveNodeCapabilities(node).supportsTlsAlpn;
    const isNodeTlsDisableSniSupported = (node = {}) => resolveNodeCapabilities(node).supportsTlsDisableSni;
    const isNodeTlsVersionSupported = (node = {}) => resolveNodeCapabilities(node).supportsTlsVersion;
    const isNodeTlsFragmentSupported = (node = {}) => resolveNodeCapabilities(node).supportsTlsFragment;
    const isNodeTlsContext = (node = {}) => resolveNodeCapabilities(node).hasTlsContext;
    const isNodeQuicTlsContext = (node = {}) => resolveNodeCapabilities(node).isQuicTlsContext;
    const isNodeTcpTlsContext = (node = {}) => resolveNodeCapabilities(node).isTcpTlsContext;
    const isNodeUtlsSupported = (node = {}) => resolveNodeCapabilities(node).supportsUtls;
    const isNodeRealitySupported = (node = {}) => resolveNodeCapabilities(node).supportsReality;
    const isNodeShadowtlsPasswordSupported = (node = {}) => resolveNodeCapabilities(node).supportsShadowtlsPassword;
    const isNodeTransportSectionVisible = (node = {}) => resolveShouldShowNodeTransportSection(node);
    const isNodeTransportFieldVisible = (node = {}, field = '') => resolveNodeTransportFieldVisible(node, field);
    const getNodeResolvedTransport = (node = {}) => resolveNodeCapabilities(node).transport;
    const isNodeTransport = (node = {}, transport = '') => getNodeResolvedTransport(node) === String(transport || '').trim();
    const getNodeAvailableTransportOptions = (node = {}) => resolveNodeAvailableTransportOptions(node);
    const getNodeCapabilityIssues = (node = {}) => resolveNodeCapabilityIssues(node);
    const hasNodeCapabilityIssues = (node = {}) => getNodeCapabilityIssues(node).length > 0;
    const getNodeCapabilityMessages = (node = {}) => getNodeCapabilityIssues(node).map((issue) => issue.message);
    const getNodeCapabilityFieldMessages = (node = {}, field = '') => {
        const targetField = String(field || '').trim();
        return getNodeCapabilityIssues(node)
            .filter((issue) => issue.field === targetField)
            .map((issue) => issue.message);
    };
    const isNodeCapabilityFieldInvalid = (node = {}, field = '') => getNodeCapabilityFieldMessages(node, field).length > 0;
    const isNodeServerEndpointVisible = (node = {}) => resolveNodeCapabilities(node).supportsServerEndpoint;
    const getNodeDisplayEndpoint = (node = {}) => {
        if (!isNodeServerEndpointVisible(node)) {
            return node.type === 'tor' ? 'local tor' : 'internal dns';
        }
        return `${node.server || '未设置'}${node.port ? `:${node.port}` : ''}`;
    };
    const isNodeSharedSecretSectionVisible = (node = {}) => ['vless', 'vmess', 'trojan', 'shadowsocks', 'tuic', 'hysteria2'].includes(node.type || '');
    const getNodeSharedSecretLabel = (node = {}) => (['vless', 'vmess', 'tuic'].includes(node.type || '') ? 'UUID' : '密码 (Password)');
    const isNodeCredentialSniVisible = (node = {}) => isNodeTlsContext(node) && ['vless', 'vmess', 'trojan', 'hysteria2', 'hysteria'].includes(node.type || '');

    const getNodeDialDeps = () => ({
        isNodeStreamTransport,
        isNodeDatagramTransport,
    });
    const getNodeDialVisibleFields = (node = {}) => getNodeDialVisibleFieldsBase(node, getNodeDialDeps());
    const hasNodeDialOptions = (node = {}) => hasNodeDialOptionsBase(node, getNodeDialDeps());
    const isNodeDialFieldVisible = (node = {}, field) => isNodeDialFieldVisibleBase(node, field, getNodeDialDeps());

    const isNodeCipherSuitesMeaningful = (node = {}) => isNodeTcpTlsContext(node) && node.tls_min_version !== '1.3';

    const hasNodeTlsAdvancedConfig = (node = {}) => {
        if (!isNodeTlsContext(node)) return false;
        const supportsClassicTlsAdvanced = node.type !== 'naive';
        return !!(
            (supportsClassicTlsAdvanced && node.disable_sni)
            || (supportsClassicTlsAdvanced && node.tls_min_version)
            || (supportsClassicTlsAdvanced && node.tls_max_version)
            || (supportsClassicTlsAdvanced && isNodeCipherSuitesMeaningful(node) && node.cipher_suites)
            || (supportsClassicTlsAdvanced && isNodeTcpTlsContext(node) && (node.tls_fragment || node.tls_record_fragment || node.tls_fragment_fallback_delay))
            || node.ech_enabled
        );
    };

    const hasNodeDialConfig = (node = {}) => hasNodeDialConfigBase(node, getNodeDialDeps());

    const getNodeAvailableNetworkOptions = (node = {}) => resolveNodeAvailableNetworkOptions(node);
    const getNodeCurrentNetworkValue = (node = {}) => resolveNodeCurrentNetworkValue(node);
    const setNodeCurrentNetworkValue = (node = {}, value = '') => resolveSetNodeCurrentNetworkValue(node, value);

    const syncNodeNetworkConstraints = (node = {}) => {
        sanitizeNodeByCapabilities(node);
    };

    const onNodeTypeChange = (node) => {
        if (['tor', 'dns'].includes(node.type)) {
            node.server = '';
            node.port = 0;
        } else if (!node.port) {
            node.port = 443;
        }
        node.tls = isNodeTlsDefaultOn(node);
        sanitizeNodeByCapabilities(node);
    };

    const removeNode = (index) => {
        ctx.showConfirm('确定要删除此节点吗？此操作不可恢复。', () => {
            const tagToRemove = nodes.value[index].tag;
            nodes.value.splice(index, 1);
            ctx.groups.value.forEach((group) => {
                const groupIndex = group.members.indexOf(tagToRemove);
                if (groupIndex !== -1) group.members.splice(groupIndex, 1);
            });
            ctx.dnsList.value.forEach((dns) => {
                if (dns.detour === tagToRemove) dns.detour = '';
            });
            if (ctx.ntp.value.detour === tagToRemove) ctx.ntp.value.detour = 'direct';
            ctx.routeRules.value.forEach((rule) => {
                if (rule.outbound === tagToRemove) rule.outbound = 'direct';
            });
            if (ctx.settings.value.final_outbound === tagToRemove) ctx.settings.value.final_outbound = 'direct';
        }, { title: '删除节点', okText: '删除' });
    };

    const clearNodes = () => {
        ctx.showConfirm('确定清空所有节点吗？此操作不可恢复！', () => {
            const nodeTags = new Set(nodes.value.map((node) => node.tag));
            nodes.value = [];
            ctx.groups.value.forEach((group) => {
                group.members = group.members.filter((member) => !nodeTags.has(member));
            });
        }, { title: '清空节点', okText: '清空' });
    };

    Object.assign(ctx, {
        makeNode,
        nodes,
        draggedNodeIndex,
        dragOverNodeIndex,
        focusNodeCard,
        addNode,
        toggleNodeCollapsed,
        onNodeDragStart,
        onNodeDragEnter,
        onNodeDrop,
        onNodeDragEnd,
        getNodeDialVisibleFields,
        hasNodeDialOptions,
        isNodeDialFieldVisible,
        isNodeTlsSupported,
        isNodeTlsToggleVisible,
        isNodeCipherSuitesMeaningful,
        isNodeTlsContext,
        isNodeQuicTlsContext,
        isNodeTcpTlsContext,
        isNodeUtlsSupported,
        isNodeRealitySupported,
        isNodeShadowtlsPasswordSupported,
        isNodeTransportSectionVisible,
        isNodeTransportFieldVisible,
        getNodeResolvedTransport,
        isNodeTransport,
        isNodeMultiplexSupported,
        isNodeQuicFieldSupported,
        isNodeTlsInsecureSupported,
        isNodeTlsAlpnSupported,
        isNodeTlsDisableSniSupported,
        isNodeTlsVersionSupported,
        isNodeTlsFragmentSupported,
        hasNodeTlsAdvancedConfig,
        hasNodeDialConfig,
        nodeHasDetourOverride,
        nodeHasBindingOverride,
        isNodeDialFieldEffectivelyMuted,
        getNodeAvailableTransportOptions,
        getNodeAvailableNetworkOptions,
        getNodeCurrentNetworkValue,
        getNodeCapabilityIssues,
        hasNodeCapabilityIssues,
        getNodeCapabilityMessages,
        getNodeCapabilityFieldMessages,
        isNodeCapabilityFieldInvalid,
        isNodeServerEndpointVisible,
        getNodeDisplayEndpoint,
        isNodeSharedSecretSectionVisible,
        getNodeSharedSecretLabel,
        isNodeCredentialSniVisible,
        setNodeCurrentNetworkValue,
        syncNodeNetworkConstraints,
        onNodeTypeChange,
        removeNode,
        clearNodes,
    });
}
