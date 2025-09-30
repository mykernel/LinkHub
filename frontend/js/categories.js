const PRESET_ICONS = ['📁', '📚', '⭐', '💬', '📰', '🔧', '🎬', '📄', '🎓', '🛒', '💼', '🎨', '🎵', '🎮', '📱', '💻'];
const PRESET_COLORS = ['#667eea', '#f59e0b', '#3b82f6', '#ef4444', '#10b981', '#8b5cf6', '#f97316', '#06b6d4', '#ec4899', '#84cc16', '#64748b', '#f43f5e'];

const state = {
    categories: [],
    currentCategoryId: null,
    deleteTargetId: null
};

const refs = {};
let draggedCard = null;
let dragStartOrder = [];

function cacheElements() {
    refs.systemList = document.querySelector('[data-role="system-category-list"]');
    refs.customList = document.querySelector('[data-role="custom-category-list"]');
    refs.categoryModal = document.getElementById('categoryModal');
    refs.categoryForm = document.getElementById('categoryForm');
    refs.categoryNameInput = document.getElementById('categoryName');
    refs.categoryIconInput = document.getElementById('categoryIcon');
    refs.categoryColorInput = document.getElementById('categoryColor');
    refs.iconPicker = document.querySelector('[data-role="icon-picker"]');
    refs.colorPicker = document.querySelector('[data-role="color-picker"]');
    refs.deleteModal = document.getElementById('deleteModal');
    refs.deleteBookmarkCount = document.querySelector('[data-role="delete-bookmark-count"]');
    refs.transferSelect = document.getElementById('transferCategory');
    refs.categoryModalTitle = document.getElementById('categoryModalTitle');
}

function renderIconPicker(selectedIcon) {
    if (!refs.iconPicker) return;
    refs.iconPicker.innerHTML = PRESET_ICONS.map(icon => `
        <button type="button" class="icon-option ${icon === selectedIcon ? 'selected' : ''}" data-icon="${icon}">${icon}</button>
    `).join('');
}

function renderColorPicker(selectedColor) {
    if (!refs.colorPicker) return;
    refs.colorPicker.innerHTML = PRESET_COLORS.map(color => `
        <button type="button" class="color-option ${color === selectedColor ? 'selected' : ''}" data-color="${color}" style="background:${color}"></button>
    `).join('');
}

function isSystemCategory(category) {
    return category.name === '全部' || category.name === '收藏';
}

function createCategoryCard(category) {
    const system = isSystemCategory(category);
    const badge = system ? '<span class="category-card__badge">系统</span>' : '';
    const actions = (!system) ? `
        <div class="category-card__actions">
            <button class="action-btn" type="button" data-action="edit-category" data-category-id="${category.id}">✏️ 编辑</button>
            <button class="action-btn delete" type="button" data-action="delete-category" data-category-id="${category.id}">🗑️ 删除</button>
        </div>
    ` : '';
    const draggableAttr = system ? '' : ' draggable="true"';
    const draggableClass = system ? '' : ' category-card--draggable';

    return `
        <article class="category-card ${system ? 'category-card--system' : ''}${draggableClass}" data-category-id="${category.id}"${draggableAttr}>
            ${badge}
            <div class="category-card__header">
                <div class="category-card__icon" style="background:${category.color}20">${category.icon}</div>
                <div>
                    <div class="category-card__name">${category.name}</div>
                    <div class="category-card__count">${category.bookmark_count || 0} 个书签</div>
                </div>
            </div>
            ${actions}
        </article>
    `;
}

function renderCategories() {
    if (!refs.systemList || !refs.customList) return;

    const systemCategories = state.categories.filter(isSystemCategory);
    const customCategories = state.categories.filter(cat => !isSystemCategory(cat));

    refs.systemList.innerHTML = systemCategories.length
        ? systemCategories.map(createCategoryCard).join('')
        : `
            <div class="empty-state">
                <div class="empty-state__icon">📁</div>
                <div>暂无系统分类</div>
            </div>
        `;

    refs.customList.innerHTML = customCategories.length
        ? customCategories.map(createCategoryCard).join('')
        : `
            <div class="empty-state">
                <div class="empty-state__icon">💡</div>
                <div>暂无自定义分类</div>
                <p>点击右上角“新建分类”添加你的个性分类</p>
            </div>
        `;
}

function openCategoryModal(category) {
    if (!refs.categoryModal || !refs.categoryForm) return;

    state.currentCategoryId = category ? category.id : null;
    refs.categoryForm.reset();

    const defaultIcon = category ? category.icon : PRESET_ICONS[0];
    const defaultColor = category ? category.color : PRESET_COLORS[0];

    refs.categoryNameInput.value = category ? category.name : '';
    refs.categoryIconInput.value = defaultIcon;
    refs.categoryColorInput.value = defaultColor;
    refs.categoryModalTitle.textContent = category ? '编辑分类' : '新建分类';

    renderIconPicker(defaultIcon);
    renderColorPicker(defaultColor);

    refs.categoryModal.classList.add('active');
}

function closeCategoryModal() {
    state.currentCategoryId = null;
    refs.categoryModal?.classList.remove('active');
}

function openDeleteModal(category) {
    if (!refs.deleteModal || !refs.deleteBookmarkCount) return;
    state.deleteTargetId = category.id;
    refs.deleteBookmarkCount.textContent = category.bookmark_count || 0;

    const options = state.categories
        .filter(cat => cat.id !== category.id && !isSystemCategory(cat))
        .map(cat => `<option value="${cat.id}">${cat.icon} ${cat.name}</option>`)
        .join('');

    if (!options) {
        Auth.showError('没有可用于转移的分类，请先创建其他分类');
        return;
    }

    refs.transferSelect.innerHTML = options;
    refs.deleteModal.classList.add('active');
}

function closeDeleteModal() {
    state.deleteTargetId = null;
    refs.deleteModal?.classList.remove('active');
}

async function loadCategories() {
    try {
        const categories = await API.getCategories();
        state.categories = categories;
        renderCategories();
    } catch (error) {
        Auth.showError('加载分类失败: ' + error.message);
    }
}

async function handleCategorySubmit(event) {
    event.preventDefault();
    if (!refs.categoryForm) return;

    const submitBtn = refs.categoryForm.querySelector('.btn-submit');
    Auth.showLoading(submitBtn, '保存中...');

    const payload = {
        name: refs.categoryNameInput.value.trim(),
        icon: refs.categoryIconInput.value,
        color: refs.categoryColorInput.value
    };

    if (!payload.name) {
        Auth.hideLoading(submitBtn);
        Auth.showError('请输入分类名称');
        return;
    }

    try {
        if (state.currentCategoryId) {
            await API.updateCategory(state.currentCategoryId, payload.name, payload.icon, payload.color);
            Auth.showSuccess('分类更新成功');
        } else {
            await API.createCategory(payload.name, payload.icon, payload.color);
            Auth.showSuccess('分类创建成功');
        }
        closeCategoryModal();
        await loadCategories();
    } catch (error) {
        Auth.showError('保存失败: ' + error.message);
    } finally {
        Auth.hideLoading(submitBtn);
    }
}

async function handleConfirmDelete() {
    if (!state.deleteTargetId) return;
    const transferToId = parseInt(refs.transferSelect.value, 10);
    if (Number.isNaN(transferToId)) {
        Auth.showError('请选择转移目标分类');
        return;
    }

    try {
        await API.deleteCategory(state.deleteTargetId, transferToId);
        Auth.showSuccess('分类已删除');
        closeDeleteModal();
        await loadCategories();
    } catch (error) {
        Auth.showError('删除失败: ' + error.message);
    }
}

function handleIconClick(event) {
    const button = event.target.closest('[data-icon]');
    if (!button) return;
    const icon = button.dataset.icon;
    refs.categoryIconInput.value = icon;
    refs.iconPicker.querySelectorAll('.icon-option').forEach(el => el.classList.toggle('selected', el.dataset.icon === icon));
}

function handleColorClick(event) {
    const button = event.target.closest('[data-color]');
    if (!button) return;
    const color = button.dataset.color;
    refs.categoryColorInput.value = color;
    refs.colorPicker.querySelectorAll('.color-option').forEach(el => el.classList.toggle('selected', el.dataset.color === color));
}

function handleCategoryCardClick(event) {
    const actionBtn = event.target.closest('[data-action]');
    if (!actionBtn) return;
    const id = parseInt(actionBtn.dataset.categoryId, 10);
    const category = state.categories.find(cat => cat.id === id);
    if (!category) return;

    switch (actionBtn.dataset.action) {
        case 'edit-category':
            openCategoryModal(category);
            break;
        case 'delete-category':
            openDeleteModal(category);
            break;
        default:
            break;
    }
}

function getCustomOrderIds() {
    if (!refs.customList) return [];
    return Array.from(refs.customList.querySelectorAll('[data-category-id]'))
        .map(el => parseInt(el.dataset.categoryId, 10))
        .filter(id => !Number.isNaN(id));
}

function arraysEqual(a, b) {
    if (a.length !== b.length) return false;
    return a.every((value, index) => value === b[index]);
}

function applyLocalCustomOrder(orderIds) {
    const systemCategories = state.categories.filter(isSystemCategory);
    const customMap = new Map(state.categories.filter(cat => !isSystemCategory(cat)).map(cat => [cat.id, cat]));
    const orderedCustom = orderIds
        .map((id, index) => {
            const category = customMap.get(id);
            if (!category) return null;
            return { ...category, display_order: index + 2 };
        })
        .filter(Boolean);

    state.categories = [...systemCategories, ...orderedCustom];
}

async function persistCustomOrder(orderIds) {
    try {
        await API.reorderCategories(orderIds);
        Auth.showSuccess('分类顺序已更新');
        await loadCategories();
    } catch (error) {
        Auth.showError('更新分类顺序失败: ' + error.message);
        await loadCategories();
    }
}

function handleDragStart(event) {
    const card = event.target.closest('[data-category-id]');
    if (!card || card.getAttribute('draggable') !== 'true') return;
    draggedCard = card;
    dragStartOrder = getCustomOrderIds();
    card.classList.add('is-dragging');
    if (event.dataTransfer) {
        event.dataTransfer.effectAllowed = 'move';
        event.dataTransfer.setData('text/plain', card.dataset.categoryId);
    }
}

function handleDragOver(event) {
    if (!draggedCard) return;
    event.preventDefault();
    const target = event.target.closest('[data-category-id]');
    if (!refs.customList) return;
    if (!target || target === draggedCard) {
        if (target === draggedCard) return;
        refs.customList.appendChild(draggedCard);
        return;
    }

    const targetRect = target.getBoundingClientRect();
    const shouldInsertBefore = (event.clientY - targetRect.top) < targetRect.height / 2;
    if (shouldInsertBefore) {
        refs.customList.insertBefore(draggedCard, target);
    } else {
        refs.customList.insertBefore(draggedCard, target.nextSibling);
    }
}

async function handleDrop(event) {
    if (!draggedCard) return;
    event.preventDefault();
    draggedCard.classList.remove('is-dragging');
    const newOrder = getCustomOrderIds();
    const previousOrder = dragStartOrder.slice();
    draggedCard = null;
    dragStartOrder = [];

    if (!newOrder.length || arraysEqual(newOrder, previousOrder)) {
        return;
    }

    applyLocalCustomOrder(newOrder);
    await persistCustomOrder(newOrder);
}

function handleDragEnd() {
    if (draggedCard) {
        draggedCard.classList.remove('is-dragging');
    }
    draggedCard = null;
    dragStartOrder = [];
}

function handleGlobalAction(event) {
    const actionBtn = event.target.closest('[data-action]');
    if (!actionBtn) return;

    switch (actionBtn.dataset.action) {
        case 'open-category-modal':
            openCategoryModal();
            break;
        case 'close-category-modal':
            closeCategoryModal();
            break;
        case 'close-delete-modal':
            closeDeleteModal();
            break;
        case 'confirm-delete':
            handleConfirmDelete();
            break;
        default:
            break;
    }
}

function bindEvents() {
    document.addEventListener('click', handleGlobalAction);

    if (refs.categoryModal) {
        refs.categoryModal.addEventListener('click', (event) => {
            if (event.target === refs.categoryModal) {
                closeCategoryModal();
            }
        });
    }

    if (refs.deleteModal) {
        refs.deleteModal.addEventListener('click', (event) => {
            if (event.target === refs.deleteModal) {
                closeDeleteModal();
            }
        });
    }

    if (refs.categoryForm) {
        refs.categoryForm.addEventListener('submit', handleCategorySubmit);
    }

    refs.iconPicker?.addEventListener('click', handleIconClick);
    refs.colorPicker?.addEventListener('click', handleColorClick);

    refs.systemList?.addEventListener('click', handleCategoryCardClick);
    refs.customList?.addEventListener('click', handleCategoryCardClick);

    refs.customList?.addEventListener('dragstart', handleDragStart);
    refs.customList?.addEventListener('dragover', handleDragOver);
    refs.customList?.addEventListener('drop', handleDrop);
    refs.customList?.addEventListener('dragend', handleDragEnd);
}

async function initPage() {
    const user = Auth.getCurrentUser();
    if (!user) {
        window.location.href = '/login.html';
        return;
    }

    cacheElements();
    bindEvents();
    renderIconPicker(PRESET_ICONS[0]);
    renderColorPicker(PRESET_COLORS[0]);
    await loadCategories();
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initPage);
} else {
    initPage();
}
