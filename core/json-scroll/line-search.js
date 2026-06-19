export const findLineIndex = (lines, matcher, startIndex = 0) => {
    if (!matcher) return -1;
    for (let index = Math.max(0, startIndex); index < lines.length; index += 1) {
        const line = lines[index];
        if (typeof matcher === 'function') {
            if (matcher(line, index, lines)) return index;
            continue;
        }
        if (line.includes(matcher)) return index;
    }
    return -1;
};

export const findFirstMatchingLineIndex = (lines, matchers = [], startIndex = 0) => {
    for (const matcher of matchers) {
        const lineIndex = findLineIndex(lines, matcher, startIndex);
        if (lineIndex !== -1) return lineIndex;
    }
    return -1;
};

export const findFirstMatchingLineIndexInRange = (lines, matchers = [], startIndex = 0, endIndex = lines.length) => {
    const safeStart = Math.max(0, startIndex);
    const safeEnd = Math.max(safeStart, Math.min(lines.length, endIndex));
    for (let index = safeStart; index < safeEnd; index += 1) {
        const line = lines[index];
        for (const matcher of matchers) {
            if (!matcher) continue;
            if (typeof matcher === 'function') {
                if (matcher(line, index, lines)) return index;
                continue;
            }
            if (line.includes(matcher)) return index;
        }
    }
    return -1;
};
