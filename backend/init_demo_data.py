"""
初始化 demo 用户和系统预设数据
执行方式: python init_demo_data.py
"""
from sqlalchemy.orm import Session
from database import SessionLocal, engine
from models import User, Category, Bookmark, Base
from auth import get_password_hash
from security import encryption

# 系统预设分类（9个）
SYSTEM_CATEGORIES = [
    {"name": "全部", "icon": "📚", "color": "#667eea", "order": 0},
    {"name": "收藏", "icon": "⭐", "color": "#f59e0b", "order": 1},
    {"name": "社交媒体", "icon": "💬", "color": "#3b82f6", "order": 2},
    {"name": "新闻资讯", "icon": "📰", "color": "#ef4444", "order": 3},
    {"name": "在线工具", "icon": "🔧", "color": "#10b981", "order": 4},
    {"name": "娱乐影音", "icon": "🎬", "color": "#8b5cf6", "order": 5},
    {"name": "文档", "icon": "📄", "color": "#f97316", "order": 6},
    {"name": "学习教育", "icon": "🎓", "color": "#06b6d4", "order": 7},
    {"name": "购物商城", "icon": "🛒", "color": "#ec4899", "order": 8},
]

# demo 用户的示例书签
DEMO_BOOKMARKS = [
    {
        "title": "GitHub",
        "url": "https://github.com",
        "description": "全球最大的代码托管平台",
        "icon": "🐙",
        "category_name": "在线工具",
        "visit_count": 150
    },
    {
        "title": "Stack Overflow",
        "url": "https://stackoverflow.com",
        "description": "程序员问答社区",
        "icon": "💡",
        "category_name": "学习教育",
        "visit_count": 89
    },
    {
        "title": "Twitter",
        "url": "https://twitter.com",
        "description": "实时社交媒体平台",
        "icon": "🐦",
        "category_name": "社交媒体",
        "visit_count": 234
    },
    {
        "title": "YouTube",
        "url": "https://youtube.com",
        "description": "全球最大视频分享网站",
        "icon": "📺",
        "category_name": "娱乐影音",
        "visit_count": 456
    },
    {
        "title": "Reddit",
        "url": "https://reddit.com",
        "description": "互联网首页",
        "icon": "🤖",
        "category_name": "新闻资讯",
        "visit_count": 178
    },
    {
        "title": "Amazon",
        "url": "https://amazon.com",
        "description": "全球最大在线零售商",
        "icon": "📦",
        "category_name": "购物商城",
        "visit_count": 92
    },
    {
        "title": "MDN Web Docs",
        "url": "https://developer.mozilla.org",
        "description": "Web 开发者文档",
        "icon": "📖",
        "category_name": "文档",
        "visit_count": 67,
        "is_favorite": True
    },
    {
        "title": "Notion",
        "url": "https://notion.so",
        "description": "一体化协作工作空间",
        "icon": "✍️",
        "category_name": "在线工具",
        "visit_count": 123,
        "is_favorite": True
    },
]

def init_demo_data():
    """初始化 demo 数据"""
    db: Session = SessionLocal()

    try:
        print("开始初始化 demo 数据...")

        # 1. 检查并创建 demo 用户
        demo_user = db.query(User).filter(User.username == "demo").first()
        if not demo_user:
            print("\n创建 demo 用户...")
            demo_user = User(
                username="demo",
                password_hash=get_password_hash("demo123456"),
                encryption_salt=encryption.generate_salt(),
                is_active=True,
                is_admin=False
            )
            db.add(demo_user)
            db.commit()
            db.refresh(demo_user)
            print("✅ demo 用户创建成功")
        else:
            print("⚠️  demo 用户已存在")

        # 2. 为 demo 用户创建系统预设分类
        print("\n创建系统预设分类...")
        existing_categories = db.query(Category).filter(
            Category.user_id == demo_user.id
        ).all()

        if not existing_categories:
            category_map = {}
            for cat_data in SYSTEM_CATEGORIES:
                category = Category(
                    user_id=demo_user.id,
                    name=cat_data["name"],
                    icon=cat_data["icon"],
                    color=cat_data["color"],
                    is_system=cat_data["name"] in ("全部", "收藏"),
                    display_order=cat_data["order"]
                )
                db.add(category)
                db.flush()  # 获取 ID
                category_map[cat_data["name"]] = category.id
                print(f"  ✅ 创建分类: {cat_data['icon']} {cat_data['name']}")

            db.commit()
        else:
            print("⚠️  系统分类已存在")
            category_map = {cat.name: cat.id for cat in existing_categories}

        # 3. 为 demo 用户创建示例书签
        print("\n创建示例书签...")
        existing_bookmarks = db.query(Bookmark).filter(
            Bookmark.user_id == demo_user.id
        ).count()

        if existing_bookmarks == 0:
            for bm_data in DEMO_BOOKMARKS:
                category_id = category_map.get(bm_data["category_name"])
                if category_id:
                    bookmark = Bookmark(
                        user_id=demo_user.id,
                        category_id=category_id,
                        title=bm_data["title"],
                        url=bm_data["url"],
                        description=bm_data["description"],
                        icon=bm_data["icon"],
                        visit_count=bm_data.get("visit_count", 0),
                        is_favorite=bm_data.get("is_favorite", False)
                    )
                    db.add(bookmark)
                    print(f"  ✅ 创建书签: {bm_data['icon']} {bm_data['title']}")

            db.commit()
        else:
            print(f"⚠️  demo 用户已有 {existing_bookmarks} 个书签")

        print("\n✅ demo 数据初始化完成！")
        print(f"   用户名: demo")
        print(f"   密码: demo123456")
        print(f"   分类数: {len(SYSTEM_CATEGORIES)}")
        print(f"   书签数: {len(DEMO_BOOKMARKS)}")

    except Exception as e:
        db.rollback()
        print(f"\n❌ 初始化失败: {e}")
        raise
    finally:
        db.close()

if __name__ == "__main__":
    init_demo_data()
