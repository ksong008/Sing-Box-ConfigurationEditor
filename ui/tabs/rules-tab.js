import { createInjectedComponent } from './create-injected-component.js';
import { ruleSetsSectionTemplate } from './rules/rule-sets-section.js';
import { routeRuleCardTemplate } from './rules/route-rule-card.js';
import { routeRulesToolbarTemplate } from './rules/route-rules-toolbar.js';
import { rulesFooterTemplate } from './rules/rules-footer.js';

export const RulesTab = createInjectedComponent('RulesTab', `                <div v-show="currentTab==='rules'" class="space-y-5">
                    
${ruleSetsSectionTemplate}

                    <div class="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
${routeRulesToolbarTemplate}

${routeRuleCardTemplate}
${rulesFooterTemplate}
                    </div>
                </div>
`);
