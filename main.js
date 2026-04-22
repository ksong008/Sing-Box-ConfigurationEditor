import { createServerState } from './core/server-state.js';
import { setupServerConfigCore } from './core/server-config.js';
import { setupServerImportExportCore } from './core/server-import-export.js';
import { setupServerStorageCore } from './core/server-storage.js';
import { registerServerUIComponents } from './ui/server-register-components.js';

const { createApp, provide } = window.Vue;

const app = createApp({
    setup() {
        const ctx = createServerState();

        setupServerConfigCore(ctx);
        setupServerImportExportCore(ctx);
        setupServerStorageCore(ctx);

        provide('ctx', ctx);

        return {};
    },
});

registerServerUIComponents(app);
app.mount('#app');
