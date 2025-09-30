-- LinkHub 数据库初始化脚本
-- 注意：必须使用 UTF-8 编码导入此文件

-- 创建数据库（如果不存在）
CREATE DATABASE IF NOT EXISTS linkhub CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

USE linkhub;

-- 用户表
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    email VARCHAR(100) UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_username (username),
    INDEX idx_email (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='用户表';

-- 分类表
CREATE TABLE IF NOT EXISTS categories (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    name VARCHAR(50) NOT NULL,
    icon VARCHAR(10) DEFAULT '📁',
    color VARCHAR(20),
    is_system BOOLEAN DEFAULT FALSE,
    display_order INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user_id (user_id),
    INDEX idx_display_order (display_order)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='分类表';

-- 书签表
CREATE TABLE IF NOT EXISTS bookmarks (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    category_id INT,
    title VARCHAR(200) NOT NULL,
    url TEXT NOT NULL,
    description TEXT,
    icon VARCHAR(500),
    tags VARCHAR(200),
    visit_count INT DEFAULT 0,
    last_visit_at TIMESTAMP NULL,
    is_favorite BOOLEAN DEFAULT FALSE,
    pinned_position INT DEFAULT NULL,
    display_order INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL,
    INDEX idx_user_id (user_id),
    INDEX idx_category_id (category_id),
    INDEX idx_created_at (created_at),
    INDEX idx_visit_count (visit_count),
    INDEX idx_is_favorite (is_favorite),
    INDEX idx_pinned_position (pinned_position),
    INDEX idx_display_order (display_order)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='书签表';

-- 插入测试用户（密码：password123）
INSERT INTO users (username, email, password_hash) VALUES
('demo', 'demo@linkhub.com', '$2b$12$YQDyjClD1PRveUdhmMDpwuICN1OflEtQ8FH/hUTqntztyfNKAsYfS');

-- 插入系统分类（关联到第一个用户，用于未登录访问）
INSERT INTO categories (user_id, name, icon, color, is_system, display_order) VALUES
(1, '全部', '📚', '#667eea', TRUE, 0),
(1, '收藏', '⭐', '#f59e0b', TRUE, 1),
(1, '社交媒体', '👥', '#3b82f6', FALSE, 2),
(1, '新闻资讯', '📰', '#ef4444', FALSE, 3),
(1, '在线工具', '🛠️', '#10b981', FALSE, 4),
(1, '娱乐影音', '🎬', '#8b5cf6', FALSE, 5),
(1, '文档', '📄', '#6366f1', FALSE, 6),
(1, '学习教育', '📖', '#f59e0b', FALSE, 7),
(1, '购物商城', '🛒', '#ec4899', FALSE, 8);

-- 插入示例书签（中文）
INSERT INTO bookmarks (user_id, category_id, title, url, description, icon, display_order) VALUES
(1, 3, '微博', 'https://weibo.com', '中国最大的社交媒体平台', '📱', 1),
(1, 3, '知乎', 'https://zhihu.com', '中文问答社区', '💬', 2);
