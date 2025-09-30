#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
使用正确的 UTF-8 编码重置数据库
"""

import pymysql
from passlib.context import CryptContext

# 数据库连接配置
DB_CONFIG = {
    'host': '172.16.63.222',
    'port': 3307,
    'user': 'root',
    'password': '1234567',
    'charset': 'utf8mb4'
}

# 密码加密
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def reset_database():
    """重置数据库"""
    # 连接到 MySQL 服务器
    conn = pymysql.connect(**DB_CONFIG)
    cursor = conn.cursor()

    try:
        print("1. 删除旧数据库...")
        cursor.execute("DROP DATABASE IF EXISTS linkhub")

        print("2. 创建新数据库（UTF-8 编码）...")
        cursor.execute("CREATE DATABASE linkhub CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci")

        print("3. 切换到 linkhub 数据库...")
        cursor.execute("USE linkhub")

        print("4. 创建 users 表...")
        cursor.execute("""
        CREATE TABLE users (
            id INT AUTO_INCREMENT PRIMARY KEY,
            username VARCHAR(50) UNIQUE NOT NULL,
            email VARCHAR(100) UNIQUE,
            password_hash VARCHAR(255) NOT NULL,
            is_active BOOLEAN DEFAULT TRUE,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            INDEX idx_username (username),
            INDEX idx_email (email)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        """)

        print("5. 创建 categories 表...")
        cursor.execute("""
        CREATE TABLE categories (
            id INT AUTO_INCREMENT PRIMARY KEY,
            user_id INT NOT NULL,
            name VARCHAR(50) NOT NULL,
            icon VARCHAR(10),
            color VARCHAR(20),
            is_system BOOLEAN DEFAULT FALSE,
            display_order INT DEFAULT 0,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
            INDEX idx_user_id (user_id),
            INDEX idx_display_order (display_order)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        """)

        print("6. 创建 bookmarks 表...")
        cursor.execute("""
        CREATE TABLE bookmarks (
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
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
            FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL,
            INDEX idx_user_id (user_id),
            INDEX idx_category_id (category_id),
            INDEX idx_created_at (created_at),
            INDEX idx_visit_count (visit_count),
            INDEX idx_is_favorite (is_favorite)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        """)

        print("7. 插入测试用户...")
        password_hash = pwd_context.hash("password123")
        cursor.execute(
            "INSERT INTO users (username, email, password_hash) VALUES (%s, %s, %s)",
            ("demo", "demo@linkhub.com", password_hash)
        )
        user_id = cursor.lastrowid

        print("8. 插入系统分类（中文，关联到第一个用户用于未登录访问）...")
        categories = [
            ("全部", "📚", "#667eea", 0),
            ("收藏", "⭐", "#f59e0b", 1),
            ("社交媒体", "👥", "#3b82f6", 2),
            ("新闻资讯", "📰", "#ef4444", 3),
            ("在线工具", "🛠️", "#10b981", 4),
            ("娱乐影音", "🎬", "#8b5cf6", 5),
            ("文档", "📄", "#6366f1", 6),
            ("学习教育", "📖", "#f59e0b", 7),
            ("购物商城", "🛒", "#ec4899", 8),
        ]

        for name, icon, color, order in categories:
            is_system = name in ('全部', '收藏')
            cursor.execute(
                """INSERT INTO categories
                (user_id, name, icon, color, is_system, display_order)
                VALUES (%s, %s, %s, %s, %s, %s)""",
                (user_id, name, icon, color, is_system, order)
            )

        print("9. 插入示例书签（中文）...")
        # 获取"社交媒体"分类的ID
        cursor.execute("SELECT id FROM categories WHERE name = '社交媒体' AND user_id = %s", (user_id,))
        social_category_id = cursor.fetchone()[0]

        bookmarks = [
            ("微博", "https://weibo.com", "中国最大的社交媒体平台", "📱", social_category_id),
            ("知乎", "https://zhihu.com", "中文问答社区", "💬", social_category_id),
        ]

        for title, url, desc, icon, cat_id in bookmarks:
            cursor.execute(
                """INSERT INTO bookmarks
                (user_id, category_id, title, url, description, icon)
                VALUES (%s, %s, %s, %s, %s, %s)""",
                (user_id, cat_id, title, url, desc, icon)
            )

        conn.commit()
        print("\n✓ 数据库重置成功！所有数据已使用 UTF-8 编码插入")

    except Exception as e:
        conn.rollback()
        print(f"\n✗ 错误: {e}")
        raise
    finally:
        cursor.close()
        conn.close()

if __name__ == "__main__":
    reset_database()
