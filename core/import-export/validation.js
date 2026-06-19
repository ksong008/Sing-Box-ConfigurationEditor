import {
    getNodeCapabilityIssues,
} from '../node-capabilities.js';

export const validateRuntimeConfig = (ctx) => {
    const warnings = [];
    if (ctx.nodes.value.length === 0 && ctx.groups.value.length === 0) warnings.push('没有任何出站节点或策略组');
    const finalTag = ctx.settings.value.final_outbound;
    const allOut = new Set([...ctx.groups.value.map((group) => group.tag), ...ctx.nodes.value.map((node) => node.tag), 'direct']);
    if (finalTag && !allOut.has(finalTag)) warnings.push(`默认路由出站 "${finalTag}" 不存在`);
    const dnsTagSet = new Set();
    let dnsDup = false;
    ctx.dnsList.value.forEach((dns) => {
        if (dns.tag) {
            if (dnsTagSet.has(dns.tag)) dnsDup = true;
            dnsTagSet.add(dns.tag);
        }
    });
    if (dnsDup) warnings.push('DNS 服务器存在重复 tag');
    if (ctx.duplicateOutboundTags.value.length > 0) warnings.push(`出站 tag 重名: ${ctx.duplicateOutboundTags.value.join(', ')}`);
    const emptyRuleSets = ctx.ruleSets.value.filter((ruleSet) => ruleSet.tag && !ruleSet.url);
    if (emptyRuleSets.length > 0) warnings.push(`${emptyRuleSets.length} 个规则集 URL 为空（已自动忽略）`);
    ctx.nodes.value.forEach((node, index) => {
        const label = node.tag ? `节点 "${node.tag}"` : `第 ${index + 1} 个节点`;
        getNodeCapabilityIssues(node).forEach((issue) => {
            warnings.push(`${label} ${issue.message}`);
        });
    });
    return warnings;
};
