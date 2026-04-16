const { inject } = window.Vue;

export function useSharedContext() {
    const ctx = inject('ctx');
    if (!ctx) throw new Error('Missing shared app context');
    return ctx;
}
