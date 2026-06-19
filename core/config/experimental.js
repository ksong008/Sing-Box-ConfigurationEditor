export const buildConfigExperimental = (ctx) => {
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

    return experimental;
};
