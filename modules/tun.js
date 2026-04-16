const { watch, nextTick } = window.Vue;

export function setupTunModule(ctx) {
    watch(() => ctx.tun.value.enabled, (newVal) => {
        if (newVal && ctx.tproxy.value.enabled) {
            nextTick(() => {
                ctx.tun.value.enabled = false;
                ctx.showToast('拦截成功：TProxy 已在运行！为防止网络回环，请先关闭 TProxy 再启用 TUN。', 'err', 4000);
            });
        }
    });
}
