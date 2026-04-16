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

const { createApp } = window.Vue;

createApp({
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

        return ctx;
    },
}).mount('#app');
