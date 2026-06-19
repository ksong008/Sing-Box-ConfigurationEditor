export const isPlainObject = (value) => Object.prototype.toString.call(value) === '[object Object]';

export const toCsv = (value) => {
    if (Array.isArray(value)) return value.map((item) => String(item).trim()).filter(Boolean).join(', ');
    return String(value || '');
};

export const toLines = (value) => {
    if (Array.isArray(value)) return value.map((item) => String(item).trim()).filter(Boolean).join('\n');
    return String(value || '');
};

export const looksLikeRuntimeConfig = (data) => isPlainObject(data) && (
    Array.isArray(data.outbounds)
    || Array.isArray(data.inbounds)
    || isPlainObject(data.route)
    || isPlainObject(data.dns)
);
