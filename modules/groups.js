const { ref, computed, nextTick } = window.Vue;

export function setupGroupsModule(ctx) {
    let highlightTimer = null;

    const normalizeGroup = (group = {}) => {
        const tolerance = Number(group.tolerance);
        return {
            id: group.id || ctx.generateId('g'),
            tag: typeof group.tag === 'string' && group.tag.trim() ? group.tag.trim() : 'Group',
            type: group.type === 'urltest' ? 'urltest' : 'selector',
            members: Array.isArray(group.members) ? [...group.members] : [],
            regex: typeof group.regex === 'string' ? group.regex : '',
            url: typeof group.url === 'string' && group.url ? group.url : 'https://www.gstatic.com/generate_204',
            interval: typeof group.interval === 'string' && group.interval ? group.interval : '3m',
            tolerance: Number.isFinite(tolerance) ? tolerance : 50,
            collapsed: group.collapsed === undefined ? true : !!group.collapsed,
        };
    };

    const groups = ref([
        normalizeGroup({ tag: '节点选择', type: 'selector', members: ['自动选择', 'direct'], regex: '' }),
        normalizeGroup({ tag: '自动选择', type: 'urltest', members: [], regex: '' }),
    ]);
    const highlightedGroupId = ref('');

    const focusGroupCard = async (groupId) => {
        await nextTick();
        const card = ctx.tabContentContainer.value?.querySelector(`[data-group-card-id="${groupId}"]`);
        if (card) {
            card.scrollIntoView({ behavior: 'smooth', block: 'center' });
            const nameInput = card.querySelector('[data-group-name-input="true"]');
            if (nameInput && typeof nameInput.focus === 'function') {
                nameInput.focus({ preventScroll: true });
                if (typeof nameInput.select === 'function') nameInput.select();
            }
        }
        highlightedGroupId.value = groupId;
        clearTimeout(highlightTimer);
        highlightTimer = setTimeout(() => {
            if (highlightedGroupId.value === groupId) highlightedGroupId.value = '';
        }, 2200);
    };

    const addGroup = async () => {
        const newTag = `Group-${groups.value.length + 1}`;
        const newGroup = normalizeGroup({
            tag: newTag,
            type: 'selector',
            members: [],
            regex: '',
            url: 'https://www.gstatic.com/generate_204',
            interval: '3m',
            tolerance: 50,
            collapsed: false,
        });
        groups.value.push(newGroup);
        await focusGroupCard(newGroup.id);
        if (typeof ctx.scrollJsonTo === 'function') {
            ctx.scrollJsonTo(`"tag": "${newTag}"`, { fallbackToEnd: true });
        }
    };

    const toggleGroupCollapsed = (index) => {
        groups.value[index].collapsed = !groups.value[index].collapsed;
    };

    const collapseAllGroups = () => {
        groups.value.forEach((group) => {
            group.collapsed = true;
        });
    };

    const expandAllGroups = () => {
        groups.value.forEach((group) => {
            group.collapsed = false;
        });
    };

    const removeGroup = (index) => {
        ctx.showConfirm('确定要删除此策略组吗？相关路由将被重置。', () => {
            const tagToRemove = groups.value[index].tag;
            groups.value.splice(index, 1);
            groups.value.forEach((group) => {
                const memberIndex = group.members.indexOf(tagToRemove);
                if (memberIndex !== -1) group.members.splice(memberIndex, 1);
            });
            ctx.dnsList.value.forEach((dns) => {
                if (dns.detour === tagToRemove) dns.detour = '';
            });
            if (ctx.ntp.value.detour === tagToRemove) ctx.ntp.value.detour = 'direct';
            ctx.routeRules.value.forEach((rule) => {
                if (rule.outbound === tagToRemove) rule.outbound = 'direct';
            });
            if (ctx.settings.value.final_outbound === tagToRemove) ctx.settings.value.final_outbound = 'direct';
        }, { title: '删除策略组', okText: '删除' });
    };

    const updateGroupTag = (groupIndex, newTag) => {
        const oldTag = groups.value[groupIndex].tag;
        if (!newTag || newTag === oldTag) return;
        groups.value[groupIndex].tag = newTag;
        groups.value.forEach((group) => {
            const memberIndex = group.members.indexOf(oldTag);
            if (memberIndex !== -1) group.members.splice(memberIndex, 1, newTag);
        });
        ctx.dnsList.value.forEach((dns) => {
            if (dns.detour === oldTag) dns.detour = newTag;
        });
        if (ctx.ntp.value.detour === oldTag) ctx.ntp.value.detour = newTag;
        ctx.routeRules.value.forEach((rule) => {
            if (rule.outbound === oldTag) rule.outbound = newTag;
        });
        if (ctx.settings.value.final_outbound === oldTag) ctx.settings.value.final_outbound = newTag;
    };

    const generateCountryGroups = () => {
        if (ctx.nodes.value.length === 0) return ctx.showToast('当前没有节点，无法生成地区组！', 'warn');
        let generatedCount = 0;
        const targetRegions = [
            { name: '香港节点', reg: '(港|HK|Hong)' },
            { name: '台湾节点', reg: '(台|TW|Taiwan)' },
            { name: '日本节点', reg: '(日|JP|Japan)' },
            { name: '新加坡节点', reg: '(新加坡|SG|Singapore)' },
            { name: '美国节点', reg: '(美|US|United)' },
            { name: '韩国节点', reg: '(韩|KR|Korea)' },
        ];
        targetRegions.forEach((country) => {
            const pattern = new RegExp(country.reg, 'i');
            const matchingNodes = ctx.nodes.value.filter((node) => pattern.test(node.tag)).map((node) => node.tag);
            if (matchingNodes.length > 0) {
                let group = groups.value.find((item) => item.tag === country.name);
                if (!group) {
                    groups.value.push(normalizeGroup({
                        tag: country.name,
                        type: 'urltest',
                        members: [...matchingNodes],
                        regex: country.reg,
                        url: 'https://www.gstatic.com/generate_204',
                        interval: '3m',
                        tolerance: 50,
                    }));
                    generatedCount++;
                } else {
                    matchingNodes.forEach((tag) => {
                        if (!group.members.includes(tag)) group.members.push(tag);
                    });
                }
                const mainGroup = groups.value.find((item) => item.tag === '节点选择');
                if (mainGroup && !mainGroup.members.includes(country.name)) {
                    const directIndex = mainGroup.members.indexOf('direct');
                    if (directIndex !== -1) mainGroup.members.splice(directIndex, 0, country.name);
                    else mainGroup.members.push(country.name);
                }
            }
        });
        if (generatedCount > 0) ctx.showToast('地区组生成完毕！', 'ok');
        else ctx.showToast('已存在相关地区组，或未匹配到符合地区规则的节点。', 'info');
    };

    const draggedGroupIndex = ref(null);
    const dragOverGroupIndex = ref(null);

    const onGroupDragStart = (index, event) => {
        draggedGroupIndex.value = index;
        event.dataTransfer.effectAllowed = 'move';
    };
    const onGroupDragEnter = (index) => {
        if (draggedGroupIndex.value !== null) {
            dragOverGroupIndex.value = index;
        }
    };
    const onGroupDragEnd = () => {
        draggedGroupIndex.value = null;
        dragOverGroupIndex.value = null;
        groups.value.forEach((group) => {
            group.draggable = false;
        });
    };
    const onGroupDrop = (index) => {
        const from = draggedGroupIndex.value;
        if (from !== null && from !== index) {
            const item = groups.value.splice(from, 1)[0];
            groups.value.splice(index, 0, item);
        }
        onGroupDragEnd();
    };

    const availableOutboundTags = computed(() => [...groups.value.map((group) => group.tag), ...ctx.nodes.value.map((node) => node.tag), 'direct']);
    const duplicateOutboundTags = computed(() => {
        const allTags = [...groups.value.map((group) => group.tag), ...ctx.nodes.value.map((node) => node.tag)];
        const counter = {};
        allTags.forEach((tag) => {
            counter[tag] = (counter[tag] || 0) + 1;
        });
        return Object.keys(counter).filter((tag) => counter[tag] > 1);
    });
    const getAllPossibleMembers = (current) => availableOutboundTags.value.filter((tag) => tag !== current);

    Object.assign(ctx, {
        groups,
        normalizeGroup,
        highlightedGroupId,
        addGroup,
        toggleGroupCollapsed,
        collapseAllGroups,
        expandAllGroups,
        removeGroup,
        updateGroupTag,
        generateCountryGroups,
        draggedGroupIndex,
        dragOverGroupIndex,
        onGroupDragStart,
        onGroupDragEnter,
        onGroupDrop,
        onGroupDragEnd,
        availableOutboundTags,
        duplicateOutboundTags,
        getAllPossibleMembers,
    });
}
