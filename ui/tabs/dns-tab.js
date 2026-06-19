import { createInjectedComponent } from './create-injected-component.js';
import { dnsBasicSettingsTemplate } from './dns/basic-settings-section.js';
import { dnsExtraInboundsTemplate } from './dns/extra-inbounds-section.js';
import { dnsFakeipTemplate } from './dns/fakeip-section.js';
import { dnsServersTemplate } from './dns/dns-servers-section.js';

export const DnsTab = createInjectedComponent('DnsTab', `                <div v-show="currentTab==='dns'" class="space-y-5">
${dnsBasicSettingsTemplate}

${dnsExtraInboundsTemplate}

${dnsServersTemplate}

${dnsFakeipTemplate}
                </div>
`);
