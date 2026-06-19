import { createInjectedComponent } from './create-injected-component.js';
import { nodeCardTemplate } from './nodes/node-card.js';
import { nodesFooterTemplate } from './nodes/nodes-footer.js';
import { nodesManualImportTemplate } from './nodes/manual-import-section.js';
import { nodesProvidersTemplate } from './nodes/providers-section.js';
import { nodesToolbarTemplate } from './nodes/nodes-toolbar.js';

export const NodesTab = createInjectedComponent('NodesTab', `                <div v-show="currentTab==='nodes'" class="space-y-5">
${nodesManualImportTemplate}
${nodesProvidersTemplate}
${nodesToolbarTemplate}
${nodeCardTemplate}
${nodesFooterTemplate}
                </div>
`);
