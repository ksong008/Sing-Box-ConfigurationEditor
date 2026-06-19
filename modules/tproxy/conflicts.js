export const createTproxyConflicts = ({
    tproxy = {},
    tun = {},
    markIssues = [],
    resetTproxyMarksSafe = () => {},
} = {}) => {
    if (!tproxy.enabled) return [];
    const conflicts = [];
    if (markIssues.length > 0) {
        conflicts.push({
            key: 'mark_guard',
            label: 'Mark / Route Mark 配置异常',
            desc: markIssues[0],
            fix: resetTproxyMarksSafe,
            fixLabel: '恢复默认 111/112',
        });
    }
    if (tun.enabled) {
        conflicts.push({
            key: 'tun',
            label: 'TUN 模式已启用',
            desc: 'TProxy 和 TUN 模式会同时接管系统路由，导致流量重复处理或回环。建议只选择其中一种透明代理方式。',
            fix: () => {
                tun.enabled = false;
            },
            fixLabel: '自动关闭 TUN',
        });
    }
    if (tun.enabled && tun.auto_route) {
        conflicts.push({
            key: 'tun_auto_route',
            label: 'TUN auto_route 已启用',
            desc: 'auto_route 自动接管系统路由表，与 TProxy 的 fwmark 策略路由冲突，会导致出站流量循环。',
            fix: () => {
                tun.auto_route = false;
            },
            fixLabel: '关闭 auto_route',
        });
    }
    if (tun.enabled && tun.strict_route) {
        conflicts.push({
            key: 'tun_strict_route',
            label: 'TUN strict_route 已启用',
            desc: 'strict_route 会拦截未匹配路由的流量并丢弃，干扰 TProxy 的 fwmark 标记流量正常转发。',
            fix: () => {
                tun.strict_route = false;
            },
            fixLabel: '关闭 strict_route',
        });
    }
    if (tun.enabled && tun.auto_redirect) {
        conflicts.push({
            key: 'tun_auto_redirect',
            label: 'TUN auto_redirect 已启用',
            desc: 'auto_redirect 通过 iptables/nftables REDIRECT 接管 TCP 流量，与 TProxy 的 TPROXY target 双重处理同一流量，造成冲突。',
            fix: () => {
                tun.auto_redirect = false;
            },
            fixLabel: '关闭 auto_redirect',
        });
    }
    return conflicts;
};

export const showTproxyConflictModal = (conflicts, { onCancel = () => {} } = {}) => {
    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay';
    overlay.style.zIndex = '2000';

    let fixedCount = 0;
    const total = conflicts.length;

    const renderConflicts = () => conflicts.map((conflict, index) => `
        <div id="conflict-item-${index}" style="margin-bottom:12px;padding:12px;background:#fef2f2;border:1px solid #fca5a5;border-radius:10px;">
            <div style="display:flex;align-items:center;gap:8px;margin-bottom:6px;">
                <i class="fas fa-exclamation-triangle" style="color:#ef4444;font-size:13px;"></i>
                <span style="font-weight:800;color:#991b1b;font-size:13px;">${conflict.label}</span>
            </div>
            <p style="font-size:12px;color:#b91c1c;line-height:1.6;margin:0 0 8px;">${conflict.desc}</p>
            <button data-fix="${index}" class="fix-btn" style="font-size:12px;font-weight:700;background:#ef4444;color:#fff;border:none;padding:6px 14px;border-radius:8px;cursor:pointer;transition:background .2s;">${conflict.fixLabel}</button>
        </div>
    `).join('');

    const getFooterHtml = (allFixed) => allFixed
        ? '<button id="tproxy-conflict-done" style="padding:9px 24px;border-radius:8px;border:none;background:#10b981;color:#fff;font-size:13px;font-weight:700;cursor:pointer;"><i class="fas fa-check" style="margin-right:6px;"></i>全部已修复，关闭</button>'
        : '<button id="tproxy-conflict-cancel" style="padding:9px 20px;border-radius:8px;border:1px solid #d1d5db;background:#f9fafb;color:#374151;font-size:13px;font-weight:700;cursor:pointer;">取消（关闭 TProxy）</button><button id="tproxy-conflict-ignore" style="padding:9px 20px;border-radius:8px;border:none;background:#4f46e5;color:#fff;font-size:13px;font-weight:700;cursor:pointer;">忽略，继续启用</button>';

    overlay.innerHTML = `
        <div id="conflict-box" style="background:#fff;border-radius:16px;padding:28px;width:95%;max-width:520px;box-shadow:0 20px 60px rgba(0,0,0,.25);max-height:88vh;overflow-y:auto;">
            <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:6px;">
                <div style="display:flex;align-items:center;gap:10px;">
                    <i class="fas fa-exclamation-circle" style="color:#ef4444;font-size:20px;"></i>
                    <h3 style="font-size:16px;font-weight:800;color:#1f2937;margin:0;">TProxy 冲突检测</h3>
                </div>
                <span id="conflict-counter" style="font-size:12px;font-weight:700;color:#ef4444;background:#fef2f2;padding:3px 10px;border-radius:20px;border:1px solid #fca5a5;">待修复 ${total} 项</span>
            </div>
            <p style="font-size:13px;color:#6b7280;margin-bottom:18px;line-height:1.6;">开启 TProxy 后检测到以下冲突，建议逐项修复。也可忽略直接启用（可能导致功能异常）。</p>
            <div id="conflict-list">${renderConflicts()}</div>
            <div id="conflict-footer" style="display:flex;gap:10px;justify-content:flex-end;margin-top:20px;padding-top:16px;border-top:1px solid #e5e7eb;">
                ${getFooterHtml(false)}
            </div>
        </div>`;

    document.body.appendChild(overlay);

    const updateFooter = () => {
        const allFixed = fixedCount >= total;
        document.getElementById('conflict-footer').innerHTML = getFooterHtml(allFixed);
        const counter = document.getElementById('conflict-counter');
        const remaining = total - fixedCount;
        if (allFixed) {
            counter.textContent = '✓ 全部已修复';
            counter.style.color = '#065f46';
            counter.style.background = '#ecfdf5';
            counter.style.borderColor = '#6ee7b7';
        } else {
            counter.textContent = `待修复 ${remaining} 项`;
        }
        bindFooterButtons();
    };

    const bindFooterButtons = () => {
        const cancelBtn = document.getElementById('tproxy-conflict-cancel');
        const ignoreBtn = document.getElementById('tproxy-conflict-ignore');
        const doneBtn = document.getElementById('tproxy-conflict-done');
        if (cancelBtn) cancelBtn.onclick = () => {
            overlay.remove();
            onCancel();
        };
        if (ignoreBtn) ignoreBtn.onclick = () => overlay.remove();
        if (doneBtn) doneBtn.onclick = () => overlay.remove();
    };

    overlay.querySelectorAll('.fix-btn').forEach((btn) => {
        btn.addEventListener('click', () => {
            const index = parseInt(btn.dataset.fix, 10);
            conflicts[index].fix();
            fixedCount++;
            const item = document.getElementById(`conflict-item-${index}`);
            if (item) {
                item.style.background = '#f0fdf4';
                item.style.borderColor = '#86efac';
                btn.textContent = '✓ 已修复';
                btn.style.background = '#10b981';
                btn.style.cursor = 'default';
                btn.disabled = true;
            }
            updateFooter();
        });
    });

    bindFooterButtons();
};
