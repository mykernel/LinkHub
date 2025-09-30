// 个人设置页面逻辑

let currentUser = null;

// 初始化页面
async function initPage() {
    currentUser = Auth.getCurrentUser();
    if (!currentUser) {
        window.location.href = '/login.html';
        return;
    }

    // 加载用户信息
    loadUserInfo();

    // 加载主题设置
    loadThemePreference();
}

// 加载用户信息
function loadUserInfo() {
    const container = document.getElementById('userInfoCard');
    container.innerHTML = `
        <div class="user-info-row">
            <span class="user-info-label">用户名</span>
            <span class="user-info-value">${currentUser.username}</span>
        </div>
        <div class="user-info-row">
            <span class="user-info-label">邮箱</span>
            <span class="user-info-value">${currentUser.email || '未设置'}</span>
        </div>
        <div class="user-info-row">
            <span class="user-info-label">注册时间</span>
            <span class="user-info-value">${formatDate(currentUser.created_at)}</span>
        </div>
        <div class="user-info-row">
            <span class="user-info-label">账户状态</span>
            <span class="user-info-value">${currentUser.is_active ? '✅ 正常' : '❌ 已禁用'}</span>
        </div>
    `;
}

// 修改密码
async function handlePasswordChange(event) {
    event.preventDefault();
    const form = event.target;
    const submitBtn = form.querySelector('button[type="submit"]');

    const currentPassword = form.querySelector('input[name="currentPassword"]').value;
    const newPassword = form.querySelector('input[name="newPassword"]').value;
    const confirmPassword = form.querySelector('input[name="confirmPassword"]').value;

    // 清除之前的消息
    hideMessage('passwordSuccess');
    hideMessage('passwordError');

    // 验证新密码
    if (newPassword !== confirmPassword) {
        showMessage('passwordError', '两次输入的密码不一致');
        return;
    }

    if (newPassword === currentPassword) {
        showMessage('passwordError', '新密码不能与当前密码相同');
        return;
    }

    const originalText = submitBtn.textContent;
    submitBtn.textContent = '保存中...';
    submitBtn.disabled = true;

    try {
        // TODO: 调用修改密码 API（需要后端实现）
        // await API.changePassword(currentPassword, newPassword);

        // 模拟成功
        await new Promise(resolve => setTimeout(resolve, 1000));

        showMessage('passwordSuccess', '✅ 密码修改成功');
        form.reset();
    } catch (error) {
        showMessage('passwordError', '❌ 密码修改失败: ' + error.message);
    } finally {
        submitBtn.textContent = originalText;
        submitBtn.disabled = false;
    }
}

// 切换主题
function changeTheme(theme) {
    document.querySelectorAll('.theme-option').forEach(opt => {
        opt.classList.toggle('active', opt.dataset.theme === theme);
    });

    // 保存主题偏好
    localStorage.setItem('theme', theme);

    // TODO: 应用主题样式
    applyTheme(theme);
}

// 应用主题
function applyTheme(theme) {
    // 暂时只是一个占位功能，实际需要切换全局 CSS
    console.log('应用主题:', theme);

    if (theme === 'dark') {
        // 应用深色模式
        document.body.style.filter = 'invert(1) hue-rotate(180deg)';
        document.querySelectorAll('img, video').forEach(media => {
            media.style.filter = 'invert(1) hue-rotate(180deg)';
        });
    } else {
        // 取消滤镜
        document.body.style.filter = '';
        document.querySelectorAll('img, video').forEach(media => {
            media.style.filter = '';
        });
    }
}

// 加载主题偏好
function loadThemePreference() {
    const savedTheme = localStorage.getItem('theme') || 'default';
    changeTheme(savedTheme);
}

// 导出数据
async function exportData() {
    if (!confirm('确定要导出您的所有书签数据吗？')) return;

    try {
        // TODO: 调用导出 API（需要后端实现）
        // const data = await API.exportData();

        // 模拟导出
        const bookmarks = [
            { title: '示例书签', url: 'https://example.com', description: '这是一个示例' }
        ];

        const blob = new Blob([JSON.stringify(bookmarks, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `linkhub-export-${Date.now()}.json`;
        a.click();
        URL.revokeObjectURL(url);

        alert('✅ 数据导出成功');
    } catch (error) {
        alert('❌ 导出失败: ' + error.message);
    }
}

// 删除账户
async function deleteAccount() {
    const confirmed = confirm(
        '⚠️ 警告：删除账户将永久删除您的所有数据，此操作不可恢复！\n\n确定要继续吗？'
    );

    if (!confirmed) return;

    const username = prompt('请输入您的用户名以确认删除：');
    if (username !== currentUser.username) {
        alert('❌ 用户名不匹配，操作已取消');
        return;
    }

    try {
        // TODO: 调用删除账户 API（需要后端实现）
        // await API.deleteAccount();

        alert('✅ 账户已删除');
        API.logout();
    } catch (error) {
        alert('❌ 删除失败: ' + error.message);
    }
}

// 显示消息
function showMessage(elementId, message) {
    const element = document.getElementById(elementId);
    element.textContent = message;
    element.style.display = 'block';
}

// 隐藏消息
function hideMessage(elementId) {
    const element = document.getElementById(elementId);
    element.style.display = 'none';
}

// 格式化日期
function formatDate(dateString) {
    if (!dateString) return '未知';
    const date = new Date(dateString);
    return date.toLocaleDateString('zh-CN', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

// 页面加载完成后初始化
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initPage);
} else {
    initPage();
}