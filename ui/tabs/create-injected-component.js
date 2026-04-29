import { useSharedContext } from '../shared.js';

export const createInjectedComponent = (name, template) => ({
    name,
    setup() {
        return useSharedContext();
    },
    template,
});
