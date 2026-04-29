import { useSharedContext } from './shared.js';
import { AdvancedTab } from './tabs/advanced-tab.js';
import { DnsTab } from './tabs/dns-tab.js';
import { GroupsTab } from './tabs/groups-tab.js';
import { NodesTab } from './tabs/nodes-tab.js';
import { RulesTab } from './tabs/rules-tab.js';
import { TproxyTab } from './tabs/tproxy-tab.js';
import { TunTab } from './tabs/tun-tab.js';
export const EditorPanel = {
    name: 'EditorPanel',
    components: {
        DnsTab,
        NodesTab,
        GroupsTab,
        RulesTab,
        TunTab,
        AdvancedTab,
        TproxyTab,
    },
    setup() {
        return useSharedContext();
    },
    template: `
        <div class="xl:col-span-7 bg-white rounded-2xl shadow-lg border border-gray-200 flex flex-col overflow-hidden max-h-full">
            <div class="flex border-b border-gray-200 overflow-x-auto shrink-0 bg-gray-50">
                <button
                    v-for="tab in tabs"
                    :key="tab.id"
                    @click="currentTab=tab.id"
                    class="flex-shrink-0 py-4 px-5 text-sm transition-all text-center border-r border-gray-200/60 last:border-0"
                    :class="currentTab===tab.id?'tab-active':'tab-inactive'"
                >
                    <i :class="tab.icon" class="mr-1.5"></i>{{ tab.name }}
                </button>
            </div>

            <div class="p-5 overflow-y-auto flex-1 bg-[#f8fafc]" ref="tabContentContainer">
                <dns-tab v-show="currentTab==='dns'"></dns-tab>
                <nodes-tab v-show="currentTab==='nodes'"></nodes-tab>
                <groups-tab v-show="currentTab==='groups'"></groups-tab>
                <rules-tab v-show="currentTab==='rules'"></rules-tab>
                <tun-tab v-show="currentTab==='tun'"></tun-tab>
                <advanced-tab v-show="currentTab==='advanced'"></advanced-tab>
                <tproxy-tab v-show="currentTab==='tproxy'"></tproxy-tab>
            </div>
        </div>
    `,
};

