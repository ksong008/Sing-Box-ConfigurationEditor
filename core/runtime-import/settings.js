import { isPlainObject } from './utils.js';

export const applyRuntimeLogImport = (ctx, log) => {
    if (log && typeof log.level === 'string') {
        ctx.settings.value.log_level = log.level;
    }
};

export const applyRuntimeExperimentalImport = (ctx, experimental) => {
    if (!isPlainObject(experimental)) return;

    if (experimental.cache_file) {
        const cacheFile = experimental.cache_file;
        ctx.settings.value.cache_file_path = cacheFile.path || ctx.settings.value.cache_file_path;
        ctx.clashApi.value.store_fakeip = !!cacheFile.store_fakeip;
        ctx.settings.value.store_rdrc = !!cacheFile.store_rdrc;
    }
    if (experimental.clash_api) {
        const clashApi = experimental.clash_api;
        ctx.clashApi.value.enabled = true;
        ctx.clashApi.value.external_controller = clashApi.external_controller || ctx.clashApi.value.external_controller;
        ctx.clashApi.value.default_mode = clashApi.default_mode || ctx.clashApi.value.default_mode;
        ctx.clashApi.value.secret = clashApi.secret || '';
        ctx.clashApi.value.external_ui = clashApi.external_ui || '';
        ctx.clashApi.value.download_url = clashApi.external_ui_download_url || '';
        ctx.clashApi.value.allow_lan = !!clashApi.access_control_allow_private_network;
    }
};

export const applyRuntimeNtpImport = (ctx, ntp) => {
    if (isPlainObject(ntp)) {
        ctx.ntp.value = typeof ctx.normalizeNtp === 'function' ? ctx.normalizeNtp(ntp) : ntp;
    }
};
