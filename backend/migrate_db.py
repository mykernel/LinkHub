"""
数据库迁移脚本：添加缺失字段
执行方式: python migrate_db.py
"""
import pymysql
from config import settings

def migrate():
    """执行数据库迁移"""
    # 连接数据库
    connection = pymysql.connect(
        host=settings.DB_HOST,
        port=settings.DB_PORT,
        user=settings.DB_USER,
        password=settings.DB_PASSWORD,
        database=settings.DB_NAME,
        charset='utf8mb4'
    )

    try:
        with connection.cursor() as cursor:
            print("开始数据库迁移...")

            # 检查并添加 users 表的字段
            print("\n检查 users 表...")

            # 添加 is_admin 字段
            try:
                cursor.execute("""
                    ALTER TABLE users
                    ADD COLUMN is_admin BOOLEAN DEFAULT FALSE AFTER is_active
                """)
                print("✅ 添加 users.is_admin 字段")
            except pymysql.err.OperationalError as e:
                if "Duplicate column name" in str(e):
                    print("⚠️  users.is_admin 字段已存在")
                else:
                    raise

            # 添加 encryption_salt 字段
            try:
                cursor.execute("""
                    ALTER TABLE users
                    ADD COLUMN encryption_salt VARCHAR(255) NULL AFTER is_admin
                """)
                print("✅ 添加 users.encryption_salt 字段")
            except pymysql.err.OperationalError as e:
                if "Duplicate column name" in str(e):
                    print("⚠️  users.encryption_salt 字段已存在")
                else:
                    raise

            # 检查并添加 bookmarks 表的字段
            print("\n检查 bookmarks 表...")

            # 添加 pinned_position 字段
            try:
                cursor.execute("""
                    ALTER TABLE bookmarks
                    ADD COLUMN pinned_position INT NULL AFTER is_favorite,
                    ADD INDEX idx_pinned_position (pinned_position)
                """)
                print("✅ 添加 bookmarks.pinned_position 字段及索引")
            except pymysql.err.OperationalError as e:
                if "Duplicate column name" in str(e):
                    print("⚠️  bookmarks.pinned_position 字段已存在")
                else:
                    raise

            # 提交更改
            connection.commit()
            print("\n✅ 数据库迁移完成！")

    except Exception as e:
        connection.rollback()
        print(f"\n❌ 迁移失败: {e}")
        raise
    finally:
        connection.close()

if __name__ == "__main__":
    migrate()