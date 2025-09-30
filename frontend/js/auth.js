// 认证工具类
class Auth {
    // 检查是否已登录
    static isLoggedIn() {
        return !!API.getToken();
    }

    // 获取当前用户
    static getCurrentUser() {
        return API.getUser();
    }

    // 要求登录
    static requireAuth() {
        if (!this.isLoggedIn()) {
            window.location.href = '/login.html';
            return false;
        }
        return true;
    }

    // 如果已登录则跳转到书签页
    static redirectIfLoggedIn() {
        if (this.isLoggedIn()) {
            window.location.href = '/bookmarks.html';
        }
    }

    // 格式化时间
    static formatTime(dateStr) {
        if (!dateStr) return '从未';

        const date = new Date(dateStr);
        const now = new Date();
        const diff = Math.floor((now - date) / 1000); // 秒

        if (diff < 60) return '刚刚';
        if (diff < 3600) return `${Math.floor(diff / 60)} 分钟前`;
        if (diff < 86400) return `${Math.floor(diff / 3600)} 小时前`;
        if (diff < 604800) return `${Math.floor(diff / 86400)} 天前`;
        if (diff < 2592000) return `${Math.floor(diff / 604800)} 周前`;

        return date.toLocaleDateString('zh-CN');
    }

    // 显示加载状态
    static showLoading(element, text = '加载中...') {
        if (element) {
            element.disabled = true;
            element.dataset.originalText = element.textContent;
            element.textContent = text;
        }
    }

    // 隐藏加载状态
    static hideLoading(element) {
        if (element && element.dataset.originalText) {
            element.disabled = false;
            element.textContent = element.dataset.originalText;
        }
    }

    // 显示错误提示
    static showError(message, duration = 3000) {
        // 创建提示元素
        const alert = document.createElement('div');
        alert.className = 'toast-alert error';
        alert.textContent = message;
        alert.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: #fee2e2;
            color: #991b1b;
            padding: 12px 20px;
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            z-index: 10000;
            animation: slideIn 0.3s ease-out;
        `;

        document.body.appendChild(alert);

        // 自动移除
        setTimeout(() => {
            alert.style.animation = 'slideOut 0.3s ease-out';
            setTimeout(() => alert.remove(), 300);
        }, duration);
    }

    // 显示成功提示
    static showSuccess(message, duration = 3000) {
        const alert = document.createElement('div');
        alert.className = 'toast-alert success';
        alert.textContent = message;
        alert.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: #d1fae5;
            color: #065f46;
            padding: 12px 20px;
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            z-index: 10000;
            animation: slideIn 0.3s ease-out;
        `;

        document.body.appendChild(alert);

        setTimeout(() => {
            alert.style.animation = 'slideOut 0.3s ease-out';
            setTimeout(() => alert.remove(), 300);
        }, duration);
    }

    // 确认对话框
    static confirm(message) {
        return window.confirm(message);
    }

    // 要求登录才能执行操作
    static requireLoginForAction(actionName = '此操作') {
        if (!this.isLoggedIn()) {
            const shouldLogin = confirm(`${actionName}需要登录，是否现在登录？`);
            if (shouldLogin) {
                window.location.href = '/login.html';
            }
            return false;
        }
        return true;
    }

    // 检查是否为访客模式
    static isGuestMode() {
        return !this.isLoggedIn();
    }
}

// 添加动画样式
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from {
            opacity: 0;
            transform: translateX(100px);
        }
        to {
            opacity: 1;
            transform: translateX(0);
        }
    }

    @keyframes slideOut {
        from {
            opacity: 1;
            transform: translateX(0);
        }
        to {
            opacity: 0;
            transform: translateX(100px);
        }
    }
`;
document.head.appendChild(style);

// 导出 Auth
window.Auth = Auth;