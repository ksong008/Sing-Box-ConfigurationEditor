const RESERVED_MARK_TABLE_IDS = new Set([0, 253, 254, 255]);

export const parseTproxyMark = (value) => {
    if (value === null || value === undefined) return NaN;
    const source = String(value).trim();
    if (!source) return NaN;
    const base = source.toLowerCase().startsWith('0x') ? 16 : 10;
    const num = parseInt(source, base);
    return Number.isFinite(num) ? num : NaN;
};

export const getTproxyMarkIssues = (tproxy = {}) => {
    const issues = [];
    const mark = parseTproxyMark(tproxy.mark);
    const routeMark = parseTproxyMark(tproxy.route_mark);

    if (!Number.isInteger(mark) || mark < 1 || mark > 4294967295) {
        issues.push('Mark 必须是 1~4294967295 的整数（支持十进制或 0x 十六进制）');
    } else if (RESERVED_MARK_TABLE_IDS.has(mark)) {
        issues.push(`Mark=${mark} 与系统保留路由表号冲突（0/253/254/255）`);
    }

    if (!Number.isInteger(routeMark) || routeMark < 1 || routeMark > 4294967295) {
        issues.push('Route Mark 必须是 1~4294967295 的整数（支持十进制或 0x 十六进制）');
    } else if (RESERVED_MARK_TABLE_IDS.has(routeMark)) {
        issues.push(`Route Mark=${routeMark} 与系统保留路由表号冲突（0/253/254/255）`);
    }

    if (Number.isInteger(mark) && Number.isInteger(routeMark) && mark === routeMark) {
        issues.push('Mark 与 Route Mark 不能相同（会导致策略路由冲突/回环）');
    }

    return issues;
};

export const sanitizeTproxyMarks = (tproxy = {}) => {
    const fallbackMark = 111;
    const fallbackRoute = 112;

    let mark = parseTproxyMark(tproxy.mark);
    let routeMark = parseTproxyMark(tproxy.route_mark);

    const markBad = !Number.isInteger(mark) || mark < 1 || mark > 4294967295 || RESERVED_MARK_TABLE_IDS.has(mark);
    const routeMarkBad = !Number.isInteger(routeMark) || routeMark < 1 || routeMark > 4294967295 || RESERVED_MARK_TABLE_IDS.has(routeMark);

    if (markBad) mark = fallbackMark;
    if (routeMarkBad) routeMark = fallbackRoute;
    if (mark === routeMark) routeMark = (mark === fallbackMark ? fallbackRoute : fallbackMark);

    const oldMark = String(tproxy.mark ?? '').trim();
    const oldRouteMark = String(tproxy.route_mark ?? '').trim();

    tproxy.mark = String(mark);
    tproxy.route_mark = String(routeMark);

    return oldMark !== String(mark) || oldRouteMark !== String(routeMark);
};

export const resetTproxyMarksSafe = (tproxy = {}) => {
    tproxy.mark = '111';
    tproxy.route_mark = '112';
};
