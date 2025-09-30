// API 基础配置
const API_BASE_URL = 'http://localhost:7001/api';

// API 调用封装
class API {
    // 获取 token
    static getToken() {
        return localStorage.getItem('access_token');
    }

    // 设置 token
    static setToken(token) {
        localStorage.setItem('access_token', token);
    }

    // 移除 token
    static removeToken() {
        localStorage.removeItem('access_token');
    }

    // 获取用户信息
    static getUser() {
        const userStr = localStorage.getItem('user');
        return userStr ? JSON.parse(userStr) : null;
    }

    // 设置用户信息
    static setUser(user) {
        localStorage.setItem('user', JSON.stringify(user));
    }

    // 移除用户信息
    static removeUser() {
        localStorage.removeItem('user');
    }

    // 通用请求方法
    static async request(url, options = {}) {
        const token = this.getToken();
        const headers = {
            'Content-Type': 'application/json',
            ...options.headers
        };

        // 添加认证 token
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }

        try {
            const response = await fetch(`${API_BASE_URL}${url}`, {
                ...options,
                headers
            });

            // 处理未授权
            if (response.status === 401) {
                this.removeToken();
                this.removeUser();
                if (window.location.pathname !== '/login.html' && window.location.pathname !== '/signup.html') {
                    window.location.href = '/login.html';
                }
                throw new Error('未授权，请重新登录');
            }

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.detail || '请求失败');
            }

            return data;
        } catch (error) {
            console.error('API 请求错误:', error);
            throw error;
        }
    }

    // ===== 认证相关 =====

    // 注册
    static async signup(username, password) {
        const data = await this.request('/auth/signup', {
            method: 'POST',
            body: JSON.stringify({ username, password })
        });

        this.setToken(data.access_token);
        this.setUser(data.user);
        return data;
    }

    // 登录
    static async login(username, password) {
        const data = await this.request('/auth/login', {
            method: 'POST',
            body: JSON.stringify({ username, password })
        });

        this.setToken(data.access_token);
        this.setUser(data.user);
        return data;
    }

    // 登出
    static logout() {
        this.removeToken();
        this.removeUser();
        window.location.href = '/login.html';
    }

    // 获取当前用户
    static async getMe() {
        return await this.request('/auth/me');
    }

    // ===== 分类相关 =====

    // 获取分类列表
    static async getCategories() {
        return await this.request('/categories');
    }

    // 创建分类
    static async createCategory(name, icon, color) {
        return await this.request('/categories', {
            method: 'POST',
            body: JSON.stringify({ name, icon, color })
        });
    }

    // 更新分类
    static async updateCategory(id, name, icon, color) {
        return await this.request(`/categories/${id}`, {
            method: 'PUT',
            body: JSON.stringify({ name, icon, color })
        });
    }

    // 删除分类
    static async deleteCategory(id, transferToId) {
        return await this.request(`/categories/${id}?transfer_to_id=${transferToId}`, {
            method: 'DELETE'
        });
    }

    // 分类排序
    static async reorderCategories(categoryIds) {
        return await this.request('/categories/reorder', {
            method: 'POST',
            body: JSON.stringify({ category_ids: categoryIds })
        });
    }

    // ===== 书签相关 =====

    // 获取书签列表
    static async getBookmarks(params = {}) {
        const queryParams = new URLSearchParams();

        if (params.category_id) queryParams.append('category_id', params.category_id);
        if (params.search) queryParams.append('search', params.search);
        if (params.sort_by) queryParams.append('sort_by', params.sort_by);
        if (params.order) queryParams.append('order', params.order);
        if (params.page) queryParams.append('page', params.page);
        if (params.page_size) queryParams.append('page_size', params.page_size);

        const queryString = queryParams.toString();
        const url = queryString ? `/bookmarks?${queryString}` : '/bookmarks';

        return await this.request(url);
    }

    // 创建书签
    static async createBookmark(bookmark) {
        return await this.request('/bookmarks', {
            method: 'POST',
            body: JSON.stringify(bookmark)
        });
    }

    // 获取单个书签
    static async getBookmark(id) {
        return await this.request(`/bookmarks/${id}`);
    }

    // 更新书签
    static async updateBookmark(id, bookmark) {
        return await this.request(`/bookmarks/${id}`, {
            method: 'PUT',
            body: JSON.stringify(bookmark)
        });
    }

    // 删除书签
    static async deleteBookmark(id) {
        return await this.request(`/bookmarks/${id}`, {
            method: 'DELETE'
        });
    }

    // 访问书签（增加点击数）
    static async visitBookmark(id) {
        return await this.request(`/bookmarks/${id}/visit`, {
            method: 'POST'
        });
    }

    // 切换固定状态
    static async togglePinBookmark(id) {
        return await this.request(`/bookmarks/${id}/pin`, {
            method: 'PUT'
        });
    }
}

// 导出 API
window.API = API;
