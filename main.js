import { createServerState } from './core/server-state.js';
import { setupServerConfigCore } from './core/server-config.js';
import { setupServerImportExportCore } from './core/server-import-export.js';
import { setupServerRemoteImportCore } from './core/server-remote-import.js';
import { setupServerShareCore } from './core/server-share.js';
import { setupServerStorageCore } from './core/server-storage.js';
import { registerServerUIComponents } from './ui/server-register-components.js';

const { createApp, provide } = window.Vue;

const app = createApp({
    setup() {
        const ctx = createServerState();

        setupServerConfigCore(ctx);
        setupServerImportExportCore(ctx);
        setupServerRemoteImportCore(ctx);
        setupServerShareCore(ctx);
        setupServerStorageCore(ctx);

        provide('ctx', ctx);

        return {};
    },
});

registerServerUIComponents(app);
app.mount('#app');
