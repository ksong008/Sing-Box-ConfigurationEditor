import { parseList, parseOptionalInteger } from '../config-utils.js';

const buildValueMatchers = (value) => {
    const matchers = [];
    parseList(value).forEach((item) => {
        matchers.push(JSON.stringify(item));
        const numericValue = parseOptionalInteger(item);
        if (numericValue !== undefined) matchers.push(String(numericValue));
    });
    return Array.from(new Set(matchers.filter(Boolean)));
};

export const buildRouteRuleMatchers = (rule) => {
    const matchers = [];
    if (Array.isArray(rule?.conditions)) {
        rule.conditions.forEach((condition) => {
            if (!condition?.value) return;
            matchers.push(...buildValueMatchers(condition.value));
        });
    }
    if (rule?.action) matchers.push(`"action": ${JSON.stringify(rule.action)}`);
    if (rule?.action === 'route' && rule?.outbound) matchers.push(`"outbound": ${JSON.stringify(rule.outbound)}`);
    return Array.from(new Set(matchers.filter(Boolean)));
};
