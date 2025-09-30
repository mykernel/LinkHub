"""Seed demo user with 20 common bookmarks.

Usage:
    python seed_demo_bookmarks.py
"""

from sqlalchemy.orm import Session

from database import SessionLocal
from models import User, Category, Bookmark
from init_demo_data import init_demo_data


BOOKMARKS = [
    {
        "title": "Google 搜索",
        "url": "https://www.google.com",
        "description": "全球最常用的搜索引擎，快速找到需要的信息",
        "icon": "🔍",
        "category_name": "在线工具",
        "visit_count": 320,
        "is_favorite": True,
        "tags": "搜索,工具"
    },
    {
        "title": "Gmail",
        "url": "https://mail.google.com",
        "description": "谷歌邮箱服务，支持强大的搜索与过滤功能",
        "icon": "✉️",
        "category_name": "在线工具",
        "visit_count": 210,
        "is_favorite": True,
        "tags": "邮箱,通信"
    },
    {
        "title": "Google Drive",
        "url": "https://drive.google.com",
        "description": "云端硬盘，随时随地存储和共享文件",
        "icon": "☁️",
        "category_name": "文档",
        "visit_count": 185,
        "is_favorite": True,
        "tags": "云盘,存储"
    },
    {
        "title": "Google 日历",
        "url": "https://calendar.google.com",
        "description": "智能日程管理工具，支持多终端同步",
        "icon": "📆",
        "category_name": "在线工具",
        "visit_count": 132,
        "tags": "日程,效率"
    },
    {
        "title": "Slack",
        "url": "https://slack.com",
        "description": "团队协作与即时通信平台，支持丰富集成",
        "icon": "💼",
        "category_name": "社交媒体",
        "visit_count": 176,
        "tags": "协作,工作"
    },
    {
        "title": "LinkedIn",
        "url": "https://www.linkedin.com",
        "description": "全球职业社交平台，拓展人脉与招聘机会",
        "icon": "👔",
        "category_name": "社交媒体",
        "visit_count": 144,
        "tags": "职业,社交"
    },
    {
        "title": "Facebook",
        "url": "https://www.facebook.com",
        "description": "全球领先的社交网络，与亲友保持联系",
        "icon": "👥",
        "category_name": "社交媒体",
        "visit_count": 198,
        "tags": "社交,社区"
    },
    {
        "title": "Instagram",
        "url": "https://www.instagram.com",
        "description": "分享照片与短视频的社交平台",
        "icon": "📸",
        "category_name": "社交媒体",
        "visit_count": 220,
        "tags": "图片,社交"
    },
    {
        "title": "YouTube",
        "url": "https://www.youtube.com",
        "description": "全球最大的视频分享平台，覆盖各类内容",
        "icon": "📺",
        "category_name": "娱乐影音",
        "visit_count": 412,
        "is_favorite": True,
        "tags": "视频,娱乐"
    },
    {
        "title": "哔哩哔哩",
        "url": "https://www.bilibili.com",
        "description": "年轻人喜爱的弹幕视频社区",
        "icon": "🎮",
        "category_name": "娱乐影音",
        "visit_count": 265,
        "tags": "二次元,娱乐"
    },
    {
        "title": "Netflix",
        "url": "https://www.netflix.com",
        "description": "流媒体观影服务，提供海量影视作品",
        "icon": "🎬",
        "category_name": "娱乐影音",
        "visit_count": 190,
        "tags": "电影,剧集"
    },
    {
        "title": "Spotify",
        "url": "https://www.spotify.com",
        "description": "全球领先的音乐流媒体服务",
        "icon": "🎧",
        "category_name": "娱乐影音",
        "visit_count": 204,
        "tags": "音乐,流媒体"
    },
    {
        "title": "Reddit",
        "url": "https://www.reddit.com",
        "description": "社区驱动的新闻与讨论平台",
        "icon": "🤖",
        "category_name": "新闻资讯",
        "visit_count": 168,
        "tags": "社区,资讯"
    },
    {
        "title": "BBC 新闻",
        "url": "https://www.bbc.com/news",
        "description": "英国广播公司新闻，提供全球时事报道",
        "icon": "📰",
        "category_name": "新闻资讯",
        "visit_count": 156,
        "tags": "国际,新闻"
    },
    {
        "title": "纽约时报",
        "url": "https://www.nytimes.com",
        "description": "美国主流新闻媒体，深度报道与评论",
        "icon": "🗽",
        "category_name": "新闻资讯",
        "visit_count": 141,
        "tags": "新闻,深度"
    },
    {
        "title": "知乎",
        "url": "https://www.zhihu.com",
        "description": "中文互联网高质量问答社区",
        "icon": "❓",
        "category_name": "学习教育",
        "visit_count": 230,
        "is_favorite": True,
        "tags": "问答,知识"
    },
    {
        "title": "Coursera",
        "url": "https://www.coursera.org",
        "description": "知名在线课程平台，与多所大学合作",
        "icon": "🎓",
        "category_name": "学习教育",
        "visit_count": 118,
        "tags": "在线课程,教育"
    },
    {
        "title": "Udemy",
        "url": "https://www.udemy.com",
        "description": "覆盖广泛技能的在线学习平台",
        "icon": "📚",
        "category_name": "学习教育",
        "visit_count": 102,
        "tags": "技能,课程"
    },
    {
        "title": "Amazon",
        "url": "https://www.amazon.com",
        "description": "全球最大的综合电商平台",
        "icon": "🛒",
        "category_name": "购物商城",
        "visit_count": 240,
        "tags": "购物,电商"
    },
    {
        "title": "淘宝",
        "url": "https://www.taobao.com",
        "description": "中国最大的在线购物网站之一",
        "icon": "🧧",
        "category_name": "购物商城",
        "visit_count": 275,
        "tags": "购物,国内"
    }
]


def seed_bookmarks():
    """Replace demo user's bookmarks with the predefined list."""
    init_demo_data()

    db: Session = SessionLocal()
    try:
        demo_user = db.query(User).filter(User.username == "demo").first()
        if not demo_user:
            raise RuntimeError("demo 用户不存在，请先运行 init_demo_data.py")

        categories = db.query(Category).filter(Category.user_id == demo_user.id).all()
        for category in categories:
            category.is_system = category.name in ('全部', '收藏')
        db.commit()

        category_map = {cat.name: cat.id for cat in categories}

        if not category_map:
            raise RuntimeError("未找到 demo 用户的分类，请检查初始化数据")

        print("清空 demo 用户现有书签...")
        db.query(Bookmark).filter(Bookmark.user_id == demo_user.id).delete(synchronize_session=False)
        db.commit()

        print("写入 20 条示例书签...")
        for position, data in enumerate(BOOKMARKS, start=1):
            category_id = category_map.get(data["category_name"])
            if not category_id:
                print(f"⚠️ 分类 {data['category_name']} 不存在，跳过 {data['title']}")
                continue

            bookmark = Bookmark(
                user_id=demo_user.id,
                category_id=category_id,
                title=data["title"],
                url=data["url"],
                description=data.get("description"),
                icon=data.get("icon"),
                tags=data.get("tags"),
                visit_count=data.get("visit_count", 0),
                is_favorite=data.get("is_favorite", False),
                display_order=position
            )
            db.add(bookmark)

        db.commit()
        print("✅ 已为 demo 用户生成 20 个常用书签！")

    except Exception:
        db.rollback()
        raise
    finally:
        db.close()


if __name__ == "__main__":
    seed_bookmarks()
