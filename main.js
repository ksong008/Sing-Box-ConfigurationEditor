import { createBaseState } from './core/state.js';
import { setupConfigCore } from './core/config.js';
import { setupImportExportCore } from './core/import-export.js';
import { setupStorageCore } from './core/storage.js';
import { setupDnsModule } from './modules/dns.js';
import { setupGroupsModule } from './modules/groups.js';
import { setupNodesModule } from './modules/nodes.js';
import { setupProvidersModule } from './modules/providers.js';
import { setupRulesModule } from './modules/rules.js';
import { setupTproxyModule } from './modules/tproxy.js';
import { setupTunModule } from './modules/tun.js';
import { registerUIComponents } from './ui/register-components.js';

const { createApp, provide } = window.Vue;

const app = createApp({
    setup() {
        const ctx = createBaseState();

        setupDnsModule(ctx);
        setupTunModule(ctx);
        setupNodesModule(ctx);
        setupGroupsModule(ctx);
        setupRulesModule(ctx);
        setupProvidersModule(ctx);
        setupTproxyModule(ctx);
        setupConfigCore(ctx);
        setupImportExportCore(ctx);
        setupStorageCore(ctx);

        provide('ctx', ctx);

        return {};
    },
});

registerUIComponents(app);
app.mount('#app');
