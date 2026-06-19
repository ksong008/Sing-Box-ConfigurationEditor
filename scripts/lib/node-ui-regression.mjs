async function expectOne(locator, label, assert) {
    const count = await locator.count();
    assert(count === 1, `${label} resolved ${count} elements`);
    return locator;
}

async function clickOne(locator, label, assert) {
    await (await expectOne(locator, label, assert)).click();
}

async function fillOne(locator, value, label, assert) {
    await (await expectOne(locator, label, assert)).fill(value);
}

async function selectOne(locator, value, label, assert) {
    await (await expectOne(locator, label, assert)).selectOption(value);
}

async function readNodeState(page, nodeTag) {
    return page.evaluate((targetTag) => {
        const visible = (el) => !!(el.offsetWidth || el.offsetHeight || el.getClientRects().length);
        const normalize = (value) => (value || '').replace(/\s+/g, ' ').trim();
        const card = document.querySelector('#node-card-0');
        const pre = [...document.querySelectorAll('pre')].find((el) => normalize(el.textContent).includes('"outbounds"'));

        let config = null;
        try {
            config = JSON.parse(pre?.textContent || '{}');
        } catch {
            config = null;
        }

        const outbounds = Array.isArray(config?.outbounds) ? config.outbounds : [];
        const nodeOutbound = outbounds.find((outbound) => outbound.tag === targetTag) || null;
        const controls = [...(card?.querySelectorAll('select, input, textarea') || [])]
            .filter(visible)
            .map((el) => {
                const labelText = normalize((el.closest('label') || el.parentElement)?.innerText || '');
                const optionTexts = el.tagName === 'SELECT'
                    ? [...el.options].map((opt) => normalize(opt.textContent))
                    : [];
                return {
                    tag: el.tagName.toLowerCase(),
                    type: el.type || '',
                    value: el.value,
                    checked: !!el.checked,
                    label: labelText,
                    optionTexts,
                    placeholder: el.getAttribute('placeholder') || '',
                };
            });
        const searchable = controls
            .map((item) => `${item.label} ${item.optionTexts.join(' ')} ${item.placeholder}`)
            .join(' ')
            .toLowerCase();
        const exactLabel = (label) => controls.some((item) => item.type === 'checkbox' && item.label.trim() === label);
        const checkedLabel = (label) => controls.some((item) => item.type === 'checkbox' && item.label.trim() === label && item.checked);

        return {
            preCount: document.querySelectorAll('pre').length,
            jsonHasOutbounds: !!pre,
            outboundTags: outbounds.map((outbound) => outbound.tag).filter(Boolean),
            nodeOutbound,
            cardText: normalize(card?.innerText || ''),
            protocolValue: controls.find((item) => item.label.includes('协议'))?.value || '',
            transportValue: controls.find((item) => item.label.includes('传输层'))?.value || '',
            networkValue: controls.find((item) => item.label.includes('NETWORK'))?.value || '',
            networkOptions: controls.find((item) => item.label.includes('NETWORK'))?.optionTexts || [],
            hasCipherSuitesControl: searchable.includes('cipher_suites')
                || searchable.includes('加密套件')
                || searchable.includes('aes-128-gcm'),
            hasPathControl: searchable.includes('路径 (path)') || searchable.includes('service name'),
            hasHostControl: searchable.includes('ws host header') || searchable.includes('http host'),
            hasRealityControl: searchable.includes('reality'),
            hasTlsFragmentControl: searchable.includes('握手分片') || searchable.includes('tls record 分片') || searchable.includes('tcp 层分片'),
            hasPacketEncodingControl: searchable.includes('packet_encoding'),
            hasV2rayTransport: searchable.includes('websocket') || searchable.includes('grpc') || searchable.includes('httpupgrade'),
            hasQuicField: searchable.includes('initial_packet_size') || searchable.includes('初始包大小'),
            hasObfsPasswordField: searchable.includes('obfs 密钥') || searchable.includes('obfs password'),
            hasShadowPasswordField: searchable.includes('密码 (password)'),
            hasShadowPasswordWarning: normalize(card?.innerText || '').includes('需要填写 password'),
            hasShadowV1Note: normalize(card?.innerText || '').includes('v1 没有 password 字段'),
            tlsToggleVisible: exactLabel('TLS'),
            tlsChecked: checkedLabel('TLS'),
        };
    }, nodeTag);
}

async function waitForNodeState(page, nodeTag, predicate, description, assert) {
    const deadline = Date.now() + 10000;
    let state = null;

    while (Date.now() < deadline) {
        state = await readNodeState(page, nodeTag);
        if (predicate(state)) return state;
        await page.waitForTimeout(100);
    }

    throw new Error(`${description} did not become true. Last state: ${JSON.stringify(state, null, 2)}`);
}

export async function runNodeUiCapabilityRegression(page, {
    assert,
    logStep = () => {},
    label = 'node-ui',
} = {}) {
    if (typeof assert !== 'function') throw new Error('runNodeUiCapabilityRegression requires an assert function');

    await clickOne(page.locator('button').filter({ hasText: '订阅/节点' }), `${label}: nodes tab`, assert);
    const newNodeButton = page.locator('button.bg-gray-800').filter({ hasText: '新建节点' });
    await clickOne(newNodeButton, `${label}: create first node`, assert);
    await clickOne(newNodeButton, `${label}: create second node`, assert);

    const nodeTag = 'Node-2';
    const afterCreate = await waitForNodeState(
        page,
        nodeTag,
        (state) => state.jsonHasOutbounds && state.outboundTags.includes('Node-1') && state.outboundTags.includes('Node-2'),
        `${label}: JSON preview after creating the second node`,
        assert,
    );
    assert(afterCreate.preCount === 1, `${label}: expected one JSON preview after creating nodes`);
    logStep(`${label} kept JSON preview after creating a second node`);

    const nodeCard = page.locator('#node-card-0');
    const expandButton = nodeCard.locator('button[title="展开卡片"]');
    if (await expandButton.count() === 1) await expandButton.click();

    await selectOne(nodeCard.locator('select').filter({ hasText: 'WebSocket' }), 'quic', `${label}: select VLESS QUIC`, assert);
    const quicState = await waitForNodeState(
        page,
        nodeTag,
        (state) => state.transportValue === 'quic' && state.nodeOutbound?.transport?.type === 'quic',
        `${label}: VLESS QUIC state`,
        assert,
    );
    assert(quicState.jsonHasOutbounds, `${label}: VLESS QUIC should keep JSON preview`);
    assert(quicState.networkValue === 'udp', `${label}: VLESS QUIC network should be udp`);
    assert(JSON.stringify(quicState.networkOptions) === JSON.stringify(['仅 UDP']), `${label}: VLESS QUIC should expose only UDP network`);
    assert(quicState.tlsChecked, `${label}: VLESS QUIC should keep TLS checked`);
    assert(!quicState.hasPathControl, `${label}: VLESS QUIC should hide path controls`);
    assert(!quicState.hasHostControl, `${label}: VLESS QUIC should hide host controls`);
    assert(!quicState.hasRealityControl, `${label}: VLESS QUIC should hide REALITY`);
    assert(!quicState.hasTlsFragmentControl, `${label}: VLESS QUIC should hide TLS fragment controls`);
    assert(!quicState.hasCipherSuitesControl, `${label}: VLESS QUIC should hide cipher_suites`);
    assert(quicState.hasPacketEncodingControl, `${label}: VLESS QUIC should keep packet_encoding visible`);
    assert(!JSON.stringify(quicState.nodeOutbound || {}).includes('cipher_suites'), `${label}: VLESS QUIC JSON should not contain cipher_suites`);
    logStep(`${label} passed VLESS QUIC visibility and JSON checks`);

    await selectOne(nodeCard.locator('select').filter({ hasText: 'VLESS' }), 'hysteria2', `${label}: select Hysteria2`, assert);
    await fillOne(nodeCard.locator('input[placeholder="1200"]'), '1200', `${label}: Hysteria2 QUIC initial packet size`, assert);
    await selectOne(nodeCard.locator('select').filter({ hasText: 'salamander' }), 'salamander', `${label}: Hysteria2 obfs type`, assert);
    const hy2State = await waitForNodeState(
        page,
        nodeTag,
        (state) => state.protocolValue === 'hysteria2' && state.nodeOutbound?.initial_packet_size === 1200,
        `${label}: Hysteria2 state`,
        assert,
    );
    assert(hy2State.jsonHasOutbounds, `${label}: Hysteria2 should keep JSON preview`);
    assert(!hy2State.hasV2rayTransport, `${label}: Hysteria2 should hide V2Ray transport controls`);
    assert(hy2State.hasQuicField, `${label}: Hysteria2 should expose native QUIC fields`);
    assert(hy2State.nodeOutbound?.tls?.enabled === true, `${label}: Hysteria2 JSON should force TLS enabled`);
    assert(!hy2State.tlsToggleVisible, `${label}: Hysteria2 should not expose a TLS off toggle`);
    assert(hy2State.hasObfsPasswordField, `${label}: Hysteria2 should show OBFS password when obfs is selected`);
    assert(hy2State.cardText.includes('已选择 Hysteria2 混淆类型，但未填写 OBFS 密码'), `${label}: Hysteria2 should warn on missing OBFS password`);
    assert(!hy2State.hasRealityControl, `${label}: Hysteria2 should hide REALITY`);
    assert(!hy2State.hasTlsFragmentControl, `${label}: Hysteria2 should hide TLS fragment controls`);
    assert(!hy2State.hasCipherSuitesControl, `${label}: Hysteria2 should hide cipher_suites`);
    logStep(`${label} passed Hysteria2 visibility and JSON checks`);

    await selectOne(nodeCard.locator('select').filter({ hasText: 'ShadowTLS' }), 'shadowtls', `${label}: select ShadowTLS`, assert);
    await fillOne(
        nodeCard.locator('xpath=.//label[contains(., "密码") and contains(., "Password")]/following-sibling::input[1]'),
        'shadow-pass',
        `${label}: ShadowTLS v3 password`,
        assert,
    );
    const shadowV3State = await waitForNodeState(
        page,
        nodeTag,
        (state) => state.protocolValue === 'shadowtls' && state.nodeOutbound?.version === 3,
        `${label}: ShadowTLS v3 state`,
        assert,
    );
    assert(shadowV3State.jsonHasOutbounds, `${label}: ShadowTLS v3 should keep JSON preview`);
    assert(shadowV3State.hasShadowPasswordField, `${label}: ShadowTLS v3 should show password`);
    assert(!shadowV3State.hasShadowPasswordWarning, `${label}: ShadowTLS v3 should clear password warning after fill`);
    assert(shadowV3State.nodeOutbound?.password === 'shadow-pass', `${label}: ShadowTLS v3 JSON should include password`);
    assert(shadowV3State.nodeOutbound?.tls?.enabled === true, `${label}: ShadowTLS v3 JSON should include TLS`);
    assert(!shadowV3State.tlsToggleVisible, `${label}: ShadowTLS should not expose a TLS off toggle`);
    assert(!shadowV3State.hasV2rayTransport, `${label}: ShadowTLS should hide V2Ray transport controls`);
    assert(!shadowV3State.hasQuicField, `${label}: ShadowTLS should hide QUIC fields`);

    await selectOne(nodeCard.locator('select').filter({ hasText: 'v3 (推荐)' }), '1', `${label}: select ShadowTLS v1`, assert);
    const shadowV1State = await waitForNodeState(
        page,
        nodeTag,
        (state) => state.nodeOutbound?.version === 1,
        `${label}: ShadowTLS v1 state`,
        assert,
    );
    assert(!shadowV1State.hasShadowPasswordField, `${label}: ShadowTLS v1 should hide password`);
    assert(!('password' in (shadowV1State.nodeOutbound || {})), `${label}: ShadowTLS v1 JSON should omit password`);
    assert(shadowV1State.nodeOutbound?.tls?.enabled === true, `${label}: ShadowTLS v1 JSON should keep TLS`);
    assert(shadowV1State.hasShadowV1Note, `${label}: ShadowTLS v1 should show no-password note`);
    logStep(`${label} passed ShadowTLS visibility and JSON checks`);
}
