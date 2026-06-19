export const decodeBase64Text = (source) => {
    try {
        let base64 = source.replace(/[\r\n\s]/g, '').replace(/-/g, '+').replace(/_/g, '/');
        while (base64.length % 4) base64 += '=';
        const binary = atob(base64);
        const bytes = new Uint8Array(binary.length);
        for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
        return new TextDecoder('utf-8').decode(bytes);
    } catch {
        return source;
    }
};

export const getShareName = (url, fallback) => (
    url.hash ? decodeURIComponent(url.hash.slice(1)) : fallback
);
