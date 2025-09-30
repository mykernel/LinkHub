let state = {
    categories: [],
    bookmarks: [],
    currentCategoryId: null,
    searchQuery: '',
    sortBy: 'created_at',
    order: 'desc',
    page: 1,
    pageSize: 12,
    total: 0,
    totalPages: 0,
    viewMode: 'grid',
    isGuest: true,
    isLoading: false,
    hasLoaded: false,
    isSwitching: false
};

let refs = {};
let searchTimeout;

function cacheElements() {
    refs = {
        guestMenu: document.querySelector('[data-role="guest-menu"]'),
        authMenu: document.querySelector('[data-role="auth-menu"]'),
        authOnly: Array.from(document.querySelectorAll('.auth-only')),
        avatar: document.querySelector('[data-role="avatar"]'),
        username: document.querySelector('[data-role="username"]'),
        searchInput: document.querySelector('.search-input'),
        sortSelect: document.querySelector('.sort-select'),
        pageSizeSelect: document.querySelector('.page-size-select'),
        viewToggle: document.querySelector('.view-toggle'),
        categoryTags: document.querySelector('.category-tags'),
        bookmarksContainer: document.querySelector('[data-role="bookmarks-container"]'),
        paginationInfo: document.querySelector('[data-role="pagination-info"]'),
        paginationControls: document.querySelector('[data-role="pagination-controls"]'),
        modal: document.getElementById('addBookmarkModal'),
        addForm: document.querySelector('#addBookmarkModal form')
    };
}

function toggleVisibility(element, shouldShow) {
    if (!element) return;
    element.classList.toggle('is-hidden', !shouldShow);
}

function toggleAuthUI() {
    toggleVisibility(refs.guestMenu, state.isGuest);
    toggleVisibility(refs.authMenu, !state.isGuest);
    refs.authOnly.forEach(el => el.classList.toggle('is-hidden', state.isGuest));

    if (!state.isGuest) {
        const user = Auth.getCurrentUser();
        if (user) {
            if (refs.username) refs.username.textContent = user.username;
            if (refs.avatar) refs.avatar.textContent = user.username.charAt(0).toUpperCase();
        }
    }
}

function renderLoading() {
    const container = refs.bookmarksContainer;
    if (!container) return;
    container.className = state.viewMode === 'list' ? 'bookmarks-list' : 'bookmarks-grid';
    container.innerHTML = '<div class="loading-state">⏳ 正在加载...</div>';
}

function renderEmptyState() {
    const loginAction = state.isGuest
        ? '<button class="btn btn-primary" type="button" data-action="go-login">登录后管理您的书签</button>'
        : '<button class="btn btn-primary" type="button" data-action="open-add-modal">立即添加书签</button>';

    return `
        <div class="empty-state">
            <div class="empty-state__icon">📭</div>
            <div class="empty-state__title">暂无书签</div>
            <div class="empty-state__desc">${state.isGuest ? '登录以同步和管理您的书签' : '点击“添加书签”创建第一个书签'}</div>
            ${loginAction}
        </div>
    `;
}

function createBookmarkCard(bookmark) {
    const icon = bookmark.icon || '🔗';
    const favorite = bookmark.is_favorite;
    const visitCount = bookmark.visit_count ?? 0;
    const lastVisit = bookmark.last_visit_at ? Auth.formatTime(bookmark.last_visit_at) : '未访问';
    const createdAt = bookmark.created_at ? Auth.formatTime(bookmark.created_at) : '';
    const description = escapeHtml(bookmark.description || '暂无描述');
    const url = escapeHtml(bookmark.url);
    const name = escapeHtml(bookmark.name || bookmark.title || bookmark.url);

    const favoriteBadge = favorite ? '<span class="bookmark-favorite" aria-label="收藏书签">⭐</span>' : '';

    return `
        <article class="bookmark-card ${favorite ? 'bookmark-card--favorite' : ''}" data-bookmark-id="${bookmark.id}" tabindex="0">
            <div class="bookmark-header">
                ${favoriteBadge}
                <div class="bookmark-icon">${icon}</div>
                <div class="bookmark-info">
                    <div class="bookmark-title">${name}</div>
                    <div class="bookmark-url">${url}</div>
                </div>
            </div>
            <div class="bookmark-description">${description}</div>
            <div class="bookmark-stats">
                <div class="stat-item"><span>👆</span><span>${visitCount} 次访问</span></div>
                <div class="stat-item"><span>🕐</span><span>${lastVisit}</span></div>
                ${createdAt ? `<div class="stat-item"><span>📅</span><span>${createdAt}</span></div>` : ''}
            </div>
            <div class="bookmark-actions">
                <button class="action-btn" type="button" data-action="visit-bookmark" data-bookmark-id="${bookmark.id}">🔗 访问</button>
                <button class="action-btn" type="button" data-action="copy-url" data-url="${encodeURIComponent(bookmark.url)}">📋 复制</button>
                ${state.isGuest ? '' : `
                    <button class="action-btn favorite" type="button" data-action="toggle-favorite" data-bookmark-id="${bookmark.id}">
                        ${favorite ? '⭐ 已收藏' : '☆ 收藏'}
                    </button>
                    <button class="action-btn" type="button" data-action="edit-bookmark" data-bookmark-id="${bookmark.id}">✏️ 编辑</button>
                    <button class="action-btn delete" type="button" data-action="delete-bookmark" data-bookmark-id="${bookmark.id}">🗑️ 删除</button>
                `}
            </div>
        </article>
    `;
}

function renderBookmarks() {
    const container = refs.bookmarksContainer;
    if (!container) return;

    container.classList.remove('bookmarks-grid', 'bookmarks-list');
    container.classList.add(state.viewMode === 'list' ? 'bookmarks-list' : 'bookmarks-grid');
    container.classList.toggle('is-switching', state.isSwitching);

    if (state.isLoading && state.hasLoaded) {
        container.classList.add('is-loading');
        return;
    }

    container.classList.remove('is-loading');

    if (state.isLoading && !state.hasLoaded) {
        container.innerHTML = '<div class="loading-state">⏳ 正在加载...</div>';
        return;
    }

    if (!state.bookmarks.length) {
        container.innerHTML = renderEmptyState();
        return;
    }

    container.innerHTML = state.bookmarks.map(createBookmarkCard).join('');
}

function renderPagination(data) {
    if (!refs.paginationInfo || !refs.paginationControls) return;

    if (!data.total) {
        refs.paginationInfo.textContent = '暂无数据';
        refs.paginationControls.innerHTML = '';
        return;
    }

    const start = (data.page - 1) * data.page_size + 1;
    const end = Math.min(data.page * data.page_size, data.total);
    refs.paginationInfo.textContent = `显示 ${start}-${end} 条，共 ${data.total} 条`;

    const controls = [];
    const prevPage = data.page - 1;
    controls.push(`
        <button class="page-btn" type="button" data-page="${prevPage}" ${data.page === 1 ? 'disabled' : ''}>上一页</button>
    `);

    const maxButtons = 5;
    let startPage = Math.max(1, data.page - 2);
    let endPage = Math.min(data.total_pages, startPage + maxButtons - 1);
    if (endPage - startPage < maxButtons - 1) {
        startPage = Math.max(1, endPage - maxButtons + 1);
    }

    for (let i = startPage; i <= endPage; i += 1) {
        controls.push(`
            <button class="page-btn ${i === data.page ? 'active' : ''}" type="button" data-page="${i}">${i}</button>
        `);
    }

    const nextPage = data.page + 1;
    controls.push(`
        <button class="page-btn" type="button" data-page="${nextPage}" ${data.page === data.total_pages ? 'disabled' : ''}>下一页</button>
    `);

    refs.paginationControls.innerHTML = controls.join('');
}

function renderCategories() {
    if (!refs.categoryTags) return;
    refs.categoryTags.innerHTML = state.categories.map(cat => `
        <button class="category-tag ${state.currentCategoryId === cat.id ? 'active' : ''}" type="button" data-category-id="${cat.id}">
            <span class="category-icon">${cat.icon}</span>
            <span>${cat.name}</span>
        </button>
    `).join('');
}

function populateCategoryOptions(selectedId) {
    const select = document.getElementById('categorySelect');
    if (!select) return;
    const options = state.categories
        .filter(cat => !cat.is_system || (cat.name !== '全部' && cat.name !== '收藏'))
        .map(cat => `<option value="${cat.id}" ${cat.id === selectedId ? 'selected' : ''}>${cat.icon} ${cat.name}</option>`)
        .join('');
    select.innerHTML = `<option value="">请选择分类</option>${options}`;
}

function resetBookmarkForm() {
    if (!refs.addForm) return;
    refs.addForm.reset();
    refs.addForm.dataset.mode = 'create';
    refs.addForm.dataset.bookmarkId = '';
    const submitBtn = refs.addForm.querySelector('.btn-submit');
    if (submitBtn) submitBtn.textContent = '添加';
    const header = refs.modal?.querySelector('.modal-header');
    if (header) header.textContent = '添加书签';
    populateCategoryOptions();
    const protocolSelect = document.getElementById('urlProtocol');
    if (protocolSelect) protocolSelect.value = 'https://';
}

function openAddModal() {
    if (!Auth.requireLoginForAction('添加书签')) return;
    resetBookmarkForm();
    if (refs.modal) refs.modal.classList.add('active');
}

function closeAddModal() {
    if (refs.modal) refs.modal.classList.remove('active');
    resetBookmarkForm();
}

function splitUrl(url) {
    if (url.startsWith('http://')) {
        return { protocol: 'http://', path: url.slice(7) };
    }
    if (url.startsWith('https://')) {
        return { protocol: 'https://', path: url.slice(8) };
    }
    return { protocol: 'https://', path: url };
}

function openEditModal(id) {
    if (!Auth.requireLoginForAction('编辑书签')) return;
    const bookmark = state.bookmarks.find(b => b.id === id);
    if (!bookmark || !refs.modal || !refs.addForm) return;

    resetBookmarkForm();
    refs.addForm.dataset.mode = 'edit';
    refs.addForm.dataset.bookmarkId = String(id);

    const header = refs.modal.querySelector('.modal-header');
    if (header) header.textContent = '编辑书签';

    const submitBtn = refs.addForm.querySelector('.btn-submit');
    if (submitBtn) submitBtn.textContent = '保存';

    const nameInput = document.getElementById('bookmarkName');
    if (nameInput) nameInput.value = bookmark.name || bookmark.title || '';

    const { protocol, path } = splitUrl(bookmark.url);
    const protocolSelect = document.getElementById('urlProtocol');
    const urlInput = document.getElementById('urlInput');
    if (protocolSelect) protocolSelect.value = protocol;
    if (urlInput) urlInput.value = path;

    const iconInput = document.getElementById('bookmarkIcon');
    if (iconInput) iconInput.value = bookmark.icon || '🔗';

    const descriptionInput = document.getElementById('bookmarkDescription');
    if (descriptionInput) descriptionInput.value = bookmark.description || '';

    populateCategoryOptions(bookmark.category_id);

    refs.modal.classList.add('active');
}

async function handleBookmarkSubmit(event) {
    event.preventDefault();
    if (!refs.addForm) return;

    const form = event.target;
    const mode = form.dataset.mode || 'create';
    const bookmarkId = parseInt(form.dataset.bookmarkId || '0', 10);
    const submitBtn = form.querySelector('.btn-submit');

    const protocol = document.getElementById('urlProtocol')?.value || 'https://';
    const urlInput = document.getElementById('urlInput');
    const urlPath = urlInput ? urlInput.value : '';
    const fullUrl = protocol + urlPath.replace(/^(https?:\/\/)/, '');

    try {
        new URL(fullUrl);
    } catch (error) {
        Auth.showError('URL格式不正确，请检查输入');
        return;
    }

    const nameInput = document.getElementById('bookmarkName');
    const iconInput = document.getElementById('bookmarkIcon');
    const categorySelect = document.getElementById('categorySelect');
    const descriptionInput = document.getElementById('bookmarkDescription');

    const categoryId = categorySelect ? parseInt(categorySelect.value, 10) : NaN;
    const nameValue = nameInput ? nameInput.value.trim() : '';
    if (!nameValue || Number.isNaN(categoryId)) {
        Auth.showError('请填写完整信息');
        return;
    }

    const payload = {
        name: nameValue,
        url: fullUrl,
        category_id: categoryId,
        icon: iconInput && iconInput.value.trim() ? iconInput.value.trim() : '🔗',
        description: descriptionInput ? descriptionInput.value.trim() : ''
    };

    Auth.showLoading(submitBtn, mode === 'edit' ? '保存中...' : '添加中...');

    try {
        if (mode === 'edit' && bookmarkId) {
            await API.updateBookmark(bookmarkId, payload);
            Auth.showSuccess('书签更新成功');
        } else {
            await API.createBookmark(payload);
            Auth.showSuccess('书签添加成功');
        }
        closeAddModal();
        await loadBookmarks();
    } catch (error) {
        Auth.showError((mode === 'edit' ? '保存失败: ' : '添加失败: ') + error.message);
    } finally {
        Auth.hideLoading(submitBtn);
    }
}

function runSearch() {
    if (!refs.searchInput) return;
    const query = refs.searchInput.value.trim();
    state.searchQuery = query;
    state.page = 1;
    loadBookmarks();
}

function handleSearchInput(event) {
    const query = event.target.value.trim();
    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(() => {
        state.searchQuery = query;
        state.page = 1;
        loadBookmarks();
    }, 300);
}

function handleSortChange(event) {
    state.sortBy = event.target.value;
    state.page = 1;
    loadBookmarks();
}

function handlePageSizeChange(event) {
    state.pageSize = parseInt(event.target.value, 10) || 12;
    state.page = 1;
    loadBookmarks();
}

function handleViewToggle(event) {
    const button = event.target.closest('[data-view]');
    if (!button) return;
    const mode = button.dataset.view;
    if (mode === state.viewMode) return;
    state.viewMode = mode;
    document.querySelectorAll('.view-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.view === mode);
    });
    renderBookmarks();
}

function handlePaginationClick(event) {
    const button = event.target.closest('[data-page]');
    if (!button || button.disabled) return;
    const targetPage = parseInt(button.dataset.page, 10);
    if (Number.isNaN(targetPage)) return;
    if (targetPage < 1 || targetPage > state.totalPages || targetPage === state.page) return;
    state.page = targetPage;
    loadBookmarks();
}

function handleCategoryClick(event) {
    const tag = event.target.closest('[data-category-id]');
    if (!tag) return;
    const categoryId = parseInt(tag.dataset.categoryId, 10);
    state.currentCategoryId = Number.isNaN(categoryId) ? null : categoryId;
    state.page = 1;
    renderCategories();
    loadBookmarks();
}

function handleActionClick(event) {
    const target = event.target.closest('[data-action]');
    if (!target) return;
    const action = target.dataset.action;

    switch (action) {
        case 'go-login':
            window.location.href = '/login.html';
            break;
        case 'go-signup':
            window.location.href = '/signup.html';
            break;
        case 'go-categories':
            window.location.href = '/categories.html';
            break;
        case 'go-settings':
            window.location.href = '/settings.html';
            break;
        case 'logout':
            handleLogout();
            break;
        case 'open-add-modal':
            openAddModal();
            break;
        case 'close-modal':
            closeAddModal();
            break;
        case 'run-search':
            runSearch();
            break;
        case 'visit-bookmark': {
            const id = parseInt(target.dataset.bookmarkId, 10);
            if (!Number.isNaN(id)) visitBookmark(id);
            break;
        }
        case 'copy-url': {
            const encodedUrl = target.dataset.url || '';
            let decodedUrl = encodedUrl;
            try {
                decodedUrl = decodeURIComponent(encodedUrl);
            } catch (error) {
                decodedUrl = encodedUrl;
            }
            copyBookmarkUrl(decodedUrl);
            break;
        }
        case 'toggle-favorite': {
            const id = parseInt(target.dataset.bookmarkId, 10);
            if (!Number.isNaN(id)) togglePin(id);
            break;
        }
        case 'edit-bookmark': {
            const id = parseInt(target.dataset.bookmarkId, 10);
            if (!Number.isNaN(id)) openEditModal(id);
            break;
        }
        case 'delete-bookmark': {
            const id = parseInt(target.dataset.bookmarkId, 10);
            if (!Number.isNaN(id)) deleteBookmark(id);
            break;
        }
        default:
            break;
    }
}

async function visitBookmark(id) {
    const bookmark = state.bookmarks.find(b => b.id === id);
    if (!bookmark) return;
    window.open(bookmark.url, '_blank');
    if (state.isGuest) return;
    try {
        await API.visitBookmark(id);
        await loadBookmarks();
    } catch (error) {
        Auth.showError('访问书签失败: ' + error.message);
    }
}

function copyBookmarkUrl(url) {
    if (!url) return;
    navigator.clipboard.writeText(url).then(() => {
        Auth.showSuccess('链接已复制到剪贴板');
    }).catch(() => {
        Auth.showError('复制失败');
    });
}

async function togglePin(id) {
    if (!Auth.requireLoginForAction('收藏书签')) return;
    try {
        await API.togglePinBookmark(id);
        Auth.showSuccess('操作成功');
        await loadBookmarks();
    } catch (error) {
        Auth.showError('操作失败: ' + error.message);
    }
}

async function deleteBookmark(id) {
    if (!Auth.requireLoginForAction('删除书签')) return;
    if (!Auth.confirm('确定要删除这个书签吗？')) return;
    try {
        await API.deleteBookmark(id);
        Auth.showSuccess('书签已删除');
        await loadBookmarks();
    } catch (error) {
        Auth.showError('删除失败: ' + error.message);
    }
}

function handleLogout() {
    if (Auth.confirm('确定要退出登录吗？')) {
        API.logout();
    }
}

function bindEvents() {
    if (refs.searchInput) {
        refs.searchInput.addEventListener('input', handleSearchInput);
    }
    if (refs.sortSelect) {
        refs.sortSelect.addEventListener('change', handleSortChange);
    }
    if (refs.pageSizeSelect) {
        refs.pageSizeSelect.addEventListener('change', handlePageSizeChange);
    }
    if (refs.viewToggle) {
        refs.viewToggle.addEventListener('click', handleViewToggle);
    }
    if (refs.categoryTags) {
        refs.categoryTags.addEventListener('click', handleCategoryClick);
    }
    if (refs.paginationControls) {
        refs.paginationControls.addEventListener('click', handlePaginationClick);
    }
    if (refs.addForm) {
        refs.addForm.addEventListener('submit', handleBookmarkSubmit);
    }
    if (refs.modal) {
        refs.modal.addEventListener('click', (event) => {
            if (event.target === refs.modal) {
                closeAddModal();
            }
        });
    }
    if (refs.bookmarksContainer) {
        refs.bookmarksContainer.addEventListener('click', handleBookmarkCardClick);
        refs.bookmarksContainer.addEventListener('keydown', handleBookmarkCardKeydown);
    }
    document.addEventListener('click', handleActionClick);
    document.addEventListener('keydown', (event) => {
        if (event.key === 'Escape' && refs.modal?.classList.contains('active')) {
            closeAddModal();
        }
    });
}

function handleBookmarkCardClick(event) {
    const button = event.target.closest('button');
    if (button) return;
    const card = event.target.closest('.bookmark-card');
    if (!card) return;
    const bookmarkId = parseInt(card.dataset.bookmarkId, 10);
    if (Number.isNaN(bookmarkId)) return;
    visitBookmark(bookmarkId);
}

function handleBookmarkCardKeydown(event) {
    if (event.key !== 'Enter') return;
    const button = event.target.closest('button');
    if (button) return;
    const card = event.target.closest('.bookmark-card');
    if (!card) return;
    const bookmarkId = parseInt(card.dataset.bookmarkId, 10);
    if (Number.isNaN(bookmarkId)) return;
    visitBookmark(bookmarkId);
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

async function loadBookmarks() {
    state.isLoading = true;
    state.isSwitching = state.hasLoaded;
    renderBookmarks();

    try {
        const params = {
            category_id: state.currentCategoryId,
            search: state.searchQuery,
            sort_by: state.sortBy,
            order: state.order,
            page: state.page,
            page_size: state.pageSize
        };

        const response = await API.getBookmarks(params);
        state.bookmarks = response.items;
        state.total = response.total;
        state.totalPages = response.total_pages;
        state.page = response.page;
        state.pageSize = response.page_size;
        state.hasLoaded = true;

        renderPagination(response);
    } catch (error) {
        Auth.showError('加载书签失败: ' + error.message);
    } finally {
        state.isLoading = false;
        renderBookmarks();
        window.requestAnimationFrame(() => {
            state.isSwitching = false;
            renderBookmarks();
        });
    }
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text ?? '';
    return div.innerHTML;
}

async function initPage() {
    cacheElements();
    bindEvents();
    state.isGuest = Auth.isGuestMode();
    toggleAuthUI();
    await loadCategories();
    await loadBookmarks();
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initPage);
} else {
    initPage();
}
