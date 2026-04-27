const CJK_PATTERN = /[\u3400-\u9fff]/;
const LATIN_PATTERN = /[A-Za-z]/;

const BILINGUAL_TEXT_MAP = new Map([
    ['基础设置', ['基础设置', 'Basic Settings']],
    ['上游 DNS', ['上游 DNS', 'Upstream DNS']],
    ['服务端入站', ['服务端入站', 'Server Inbounds']],
    ['客户端分享参数', ['客户端分享参数', 'Client Share Fields']],
    ['路由 / 出站', ['路由 / 出站', 'Route / Outbounds']],
    ['订阅 / 节点链接', ['订阅 / 节点链接', 'Subscriptions / Links']],
    ['当前阶段说明', ['当前阶段说明', 'Current Stage']],
    ['标签', ['标签', 'Tag']],
    ['类型', ['类型', 'Type']],
    ['监听地址', ['监听地址', 'Listen Address']],
    ['监听端口', ['监听端口', 'Listen Port']],
    ['绑定接口', ['绑定接口', 'Bind Interface']],
    ['路由标记', ['路由标记', 'Routing Mark']],
    ['网络命名空间', ['网络命名空间', 'Network Namespace']],
    ['Reuse Addr', ['地址复用', 'Reuse Addr']],
    ['TCP Fast Open', ['TCP 快速打开', 'TCP Fast Open']],
    ['TCP Multi Path', ['TCP 多路径', 'TCP Multi Path']],
    ['UDP Fragment', ['UDP 分片', 'UDP Fragment']],
    ['UDP Timeout', ['UDP 超时', 'UDP Timeout']],
    ['TLS / Reality', ['TLS 与 Reality', 'TLS / Reality']],
    ['主密码', ['主密码', 'Primary Password']],
    ['模式', ['模式', 'Mode']],
    ['名称', ['名称', 'Name']],
    ['域名解析器', ['域名解析器', 'Domain Resolver']],
    ['出站 Detour', ['出站绕行', 'Outbound Detour']],
    ['客户端子网', ['客户端子网', 'Client Subnet']],
    ['连接超时', ['连接超时', 'Connect Timeout']],
    ['使用 CORS 代理兜底', ['使用 CORS 代理兜底', 'Use CORS Proxy Fallback']],
    ['使用 jsDelivr CDN 补全 Rule Set 链接', ['使用 jsDelivr CDN 补全 Rule Set 链接', 'Auto-fill Rule Set URLs via jsDelivr']],
    ['disable_cache', ['禁用缓存', 'disable_cache']],
    ['disable_expire', ['禁用过期', 'disable_expire']],
    ['启用', ['启用', 'Enabled']],
    ['启用 Multiplex', ['启用多路复用', 'Enable Multiplex']],
    ['启用 Reality', ['启用 Reality', 'Enable Reality']],
    ['服务器', ['服务器', 'Server']],
    ['端口', ['端口', 'Port']],
    ['路径', ['路径', 'Path']],
    ['密码', ['密码', 'Password']],
    ['认证方式', ['认证方式', 'Authentication Method']],
    ['自动探测接口', ['自动探测接口', 'Auto Detect Interface']],
    ['日志级别', ['日志级别', 'Log Level']],
    ['路由 / 出站', ['路由 / 出站', 'Route / Outbounds']],
    ['UDP over Stream', ['流式 UDP', 'UDP over Stream']],
    ['Zero RTT Handshake', ['零 RTT 握手', 'Zero RTT Handshake']],
    ['全局下载出站', ['全局下载出站', 'Global Download Detour']],
    ['UUID', ['唯一标识', 'UUID']],
    ['MTU', ['最大传输单元', 'MTU']],
]);

const LABEL_SELECTORS = [
    '.stitle',
    'label.block',
    'div[class*="tracking-wider"]',
    'div.text-sm.font-extrabold.text-gray-800',
    'div.text-xs.font-extrabold.text-gray-700',
    'span.text-xs.font-bold',
    'span.text-sm.font-bold',
].join(', ');

const normalizeRawText = (value) => String(value || '')
    .replace(/\s+/g, ' ')
    .replace(/[：:]$/, '')
    .trim();

const containsCjk = (value) => CJK_PATTERN.test(String(value || ''));
const containsLatin = (value) => LATIN_PATTERN.test(String(value || ''));

const parseBracketedLabel = (value) => {
    const match = String(value || '').match(/^(.+?)\s*\(([^()]+)\)$/);
    if (!match) return null;
    const left = normalizeRawText(match[1]);
    const right = normalizeRawText(match[2]);
    if (!left || !right) return null;
    if (containsCjk(left) && !containsCjk(right)) return [left, right];
    if (containsCjk(right) && !containsCjk(left)) return [right, left];
    if (containsCjk(left) && containsLatin(right)) return [left, right];
    return null;
};

const resolveBilingualText = (rawText) => {
    const normalized = normalizeRawText(rawText);
    if (!normalized) return null;
    if (BILINGUAL_TEXT_MAP.has(normalized)) return BILINGUAL_TEXT_MAP.get(normalized);
    return parseBracketedLabel(normalized);
};

const classifyLabelSize = (element) => {
    const className = String(element.className || '');
    if (className.includes('stitle')) return 'title';
    if (className.includes('text-sm')) return 'medium';
    if (className.includes('text-xs')) return 'small';
    if (className.includes('text-[10px]')) return 'micro';
    return 'default';
};

const isLeafTextContainer = (element) => {
    if (!element) return false;
    if (element.tagName === 'LABEL' && element.querySelector('input, select, textarea, button')) return false;
    return element.children.length === 0;
};

const decorateLabel = (element) => {
    if (!isLeafTextContainer(element)) return;
    if (element.dataset.uiBilingual === '1') return;
    const rawText = normalizeRawText(element.textContent);
    if (!rawText || rawText.includes('{{')) return;
    const resolved = resolveBilingualText(rawText);
    if (!resolved) return;
    const [zh, en] = resolved;
    if (!zh || !en) return;

    element.dataset.uiBilingual = '1';
    element.dataset.uiBilingualSize = classifyLabelSize(element);
    element.setAttribute('aria-label', `${zh} / ${en}`);
    element.innerHTML = `<span class="ui-bilingual-zh">${zh}</span><span class="ui-bilingual-en">${en}</span>`;
    element.classList.add('ui-bilingual');
};

const decorateRoot = (root) => {
    if (!root) return;
    root.querySelectorAll(LABEL_SELECTORS).forEach((element) => decorateLabel(element));
};

export function installServerBilingualLabels(root) {
    if (!root) return;

    let scheduled = false;
    const scheduleDecorate = () => {
        if (scheduled) return;
        scheduled = true;
        requestAnimationFrame(() => {
            scheduled = false;
            decorateRoot(root);
        });
    };

    const observer = new MutationObserver(() => {
        scheduleDecorate();
    });

    scheduleDecorate();
    observer.observe(root, {
        childList: true,
        subtree: true,
    });
}
