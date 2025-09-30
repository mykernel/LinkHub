from datetime import datetime
from typing import Optional, List
from sqlalchemy.orm import Session
from sqlalchemy import func, or_, case

from models import User, Bookmark, Category
from schemas import UserCreate, BookmarkCreate, BookmarkUpdate, CategoryCreate, CategoryUpdate
from auth import get_password_hash
from security import encryption


# API 排序字段与数据库列的映射
BOOKMARK_SORT_FIELD_MAP = {
    "created_at": Bookmark.created_at,
    "last_visit_at": Bookmark.last_visit_at,
    "visit_count": Bookmark.visit_count,
    "title": Bookmark.title,
    "display_order": Bookmark.display_order,
}


# ===== 用户相关 =====

def get_user_by_username(db: Session, username: str) -> Optional[User]:
    """根据用户名查询用户"""
    return db.query(User).filter(User.username == username).first()


def create_user(db: Session, user: UserCreate) -> User:
    """创建新用户"""
    # 生成密码哈希
    password_hash = get_password_hash(user.password)

    # 生成加密盐值
    salt = encryption.generate_salt()

    # 创建用户
    db_user = User(
        username=user.username,
        password_hash=password_hash,
        encryption_salt=salt
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)

    # 为新用户创建系统预设分类的副本
    system_categories = db.query(Category).filter(Category.user_id == 0).all()
    for cat in system_categories:
        if cat.name in ['全部', '收藏']:
            user_category = Category(
                user_id=db_user.id,
                name=cat.name,
                icon=cat.icon,
                color=cat.color,
                is_system=True,
                display_order=cat.display_order
            )
            db.add(user_category)
        else:
            user_category = Category(
                user_id=db_user.id,
                name=cat.name,
                icon=cat.icon,
                color=cat.color,
                is_system=False,
                display_order=cat.display_order
            )
            db.add(user_category)

    db.commit()
    return db_user


# ===== 分类相关 =====

def get_categories(db: Session, user_id: int) -> List[Category]:
    """获取用户的所有分类"""
    categories = db.query(Category).filter(
        Category.user_id == user_id
    ).order_by(Category.display_order).all()

    # 添加书签计数
    for category in categories:
        if category.name == '全部':
            category.bookmark_count = db.query(Bookmark).filter(Bookmark.user_id == user_id).count()
        elif category.name == '收藏':
            category.bookmark_count = db.query(Bookmark).filter(
                Bookmark.user_id == user_id,
                Bookmark.is_favorite == True
            ).count()
        else:
            category.bookmark_count = db.query(Bookmark).filter(
                Bookmark.category_id == category.id
            ).count()

    return categories


def create_category(db: Session, user_id: int, category: CategoryCreate) -> Category:
    """创建自定义分类"""
    # 获取当前最大 display_order
    max_order = db.query(func.max(Category.display_order)).filter(
        Category.user_id == user_id
    ).scalar() or 0

    db_category = Category(
        user_id=user_id,
        name=category.name,
        icon=category.icon,
        color=category.color,
        is_system=False,
        display_order=max_order + 1
    )
    db.add(db_category)
    db.commit()
    db.refresh(db_category)
    return db_category


def update_category(db: Session, category_id: int, user_id: int, category: CategoryUpdate) -> Optional[Category]:
    """更新分类"""
    db_category = db.query(Category).filter(
        Category.id == category_id,
        Category.user_id == user_id,
        Category.is_system == False  # 只能更新自定义分类
    ).first()

    if db_category:
        db_category.name = category.name
        db_category.icon = category.icon
        db_category.color = category.color
        db.commit()
        db.refresh(db_category)

    return db_category


def delete_category(db: Session, category_id: int, user_id: int, transfer_to_id: int) -> bool:
    """删除分类（需转移书签）"""
    db_category = db.query(Category).filter(
        Category.id == category_id,
        Category.user_id == user_id,
        Category.is_system == False
    ).first()

    if not db_category:
        return False

    # 转移该分类下的所有书签
    db.query(Bookmark).filter(Bookmark.category_id == category_id).update(
        {Bookmark.category_id: transfer_to_id}
    )

    # 删除分类
    db.delete(db_category)
    db.commit()
    return True


# ===== 书签相关 =====

def get_bookmarks(
    db: Session,
    user_id: int,
    category_id: Optional[int] = None,
    search: Optional[str] = None,
    sort_by: str = "created_at",
    order: str = "desc",
    skip: int = 0,
    limit: int = 12
):
    """获取书签列表（支持筛选、搜索、排序、分页，固定书签优先）"""
    query = db.query(Bookmark).filter(Bookmark.user_id == user_id)

    # 分类筛选
    if category_id:
        category = db.query(Category).filter(Category.id == category_id).first()
        if category:
            if category.name == '收藏':
                query = query.filter(Bookmark.is_favorite == True)
            elif category.name != '全部':
                query = query.filter(Bookmark.category_id == category_id)

    # 搜索（包含标签）
    if search:
        search_pattern = f"%{search}%"
        query = query.filter(
            or_(
                Bookmark.title.like(search_pattern),
                Bookmark.description.like(search_pattern),
                Bookmark.tags.like(search_pattern)
            )
        )

    # 排序字段映射
    sort_column = BOOKMARK_SORT_FIELD_MAP.get(sort_by, Bookmark.created_at)

    # 固定书签排序逻辑（MySQL 兼容版本）：
    # 使用 CASE 表达式将 NULL 排在后面，兼容 MySQL
    pinned_sort = case(
        (Bookmark.pinned_position.is_(None), 1),  # NULL 排后面
        else_=0  # 有值排前面
    )

    if order == "desc":
        query = query.order_by(
            pinned_sort.asc(),
            Bookmark.pinned_position.asc(),
            sort_column.desc()
        )
    else:
        query = query.order_by(
            pinned_sort.asc(),
            Bookmark.pinned_position.asc(),
            sort_column.asc()
        )

    # 总数
    total = query.count()

    # 分页
    items = query.offset(skip).limit(limit).all()

    return items, total


def reorder_categories(db: Session, user_id: int, category_ids: list[int]) -> bool:
    """根据提供的顺序更新分类 display_order"""
    if not category_ids:
        return True

    categories = db.query(Category).filter(
        Category.user_id == user_id,
        Category.id.in_(category_ids)
    ).all()

    category_map = {category.id: category for category in categories}

    order_base = 0
    # 预留 "全部" 和 "收藏" 的顺序，使其继续排在最前
    for reserved_name in ["全部", "收藏"]:
        reserved_category = db.query(Category).filter(
            Category.user_id == user_id,
            Category.name == reserved_name
        ).first()
        if reserved_category:
            order_base = max(order_base, (reserved_category.display_order or 0) + 1)

    updated = False
    for index, category_id in enumerate(category_ids):
        category = category_map.get(category_id)
        if not category:
            continue
        if category.name in ("全部", "收藏"):
            continue
        category.display_order = order_base + index
        updated = True

    if updated:
        db.commit()

    return updated


def reorder_bookmarks(db: Session, user_id: int, bookmark_ids: list[int]) -> bool:
    """更新书签的显示顺序"""
    if not bookmark_ids:
        return False

    seen: set[int] = set()
    unique_ids: list[int] = []
    for bookmark_id in bookmark_ids:
        if bookmark_id not in seen:
            seen.add(bookmark_id)
            unique_ids.append(bookmark_id)

    bookmarks = db.query(Bookmark).filter(
        Bookmark.user_id == user_id,
        Bookmark.id.in_(unique_ids)
    ).all()

    bookmark_map = {bookmark.id: bookmark for bookmark in bookmarks}

    orders = [bookmark.display_order or 0 for bookmark in bookmarks]
    base_order = min(orders) if orders else 1
    if base_order < 1:
        base_order = 1

    updated = False
    for index, bookmark_id in enumerate(unique_ids):
        bookmark = bookmark_map.get(bookmark_id)
        if not bookmark:
            continue
        target_order = base_order + index
        if bookmark.display_order != target_order:
            bookmark.display_order = target_order
            updated = True

    if updated:
        db.commit()

    return updated


def create_bookmark(db: Session, user_id: int, bookmark: BookmarkCreate) -> Bookmark:
    """创建书签"""
    max_order = db.query(func.max(Bookmark.display_order)).filter(
        Bookmark.user_id == user_id
    ).scalar() or 0

    db_bookmark = Bookmark(
        user_id=user_id,
        title=bookmark.title,
        url=bookmark.url,
        description=bookmark.description,
        icon=bookmark.icon,
        category_id=bookmark.category_id,
        display_order=max_order + 1
    )
    db.add(db_bookmark)
    db.commit()
    db.refresh(db_bookmark)
    return db_bookmark


def get_bookmark(db: Session, bookmark_id: int, user_id: int) -> Optional[Bookmark]:
    """获取单个书签"""
    return db.query(Bookmark).filter(
        Bookmark.id == bookmark_id,
        Bookmark.user_id == user_id
    ).first()


def update_bookmark(db: Session, bookmark_id: int, user_id: int, bookmark: BookmarkUpdate) -> Optional[Bookmark]:
    """更新书签"""
    db_bookmark = get_bookmark(db, bookmark_id, user_id)

    if db_bookmark:
        update_data = bookmark.model_dump(exclude_unset=True)
        if 'title' in update_data:
            db_bookmark.title = update_data.pop('title')

        for key, value in update_data.items():
            setattr(db_bookmark, key, value)

        db.commit()
        db.refresh(db_bookmark)

    return db_bookmark


def delete_bookmark(db: Session, bookmark_id: int, user_id: int) -> bool:
    """删除书签"""
    db_bookmark = get_bookmark(db, bookmark_id, user_id)

    if db_bookmark:
        db.delete(db_bookmark)
        db.commit()
        return True

    return False


def visit_bookmark(db: Session, bookmark_id: int, user_id: int) -> Optional[Bookmark]:
    """访问书签（增加点击数）"""
    db_bookmark = get_bookmark(db, bookmark_id, user_id)

    if db_bookmark:
        db_bookmark.visit_count += 1
        db_bookmark.last_visit_at = datetime.utcnow()
        db.commit()
        db.refresh(db_bookmark)

    return db_bookmark


def toggle_pin_bookmark(db: Session, bookmark_id: int, user_id: int) -> Optional[Bookmark]:
    """切换书签固定状态"""
    db_bookmark = get_bookmark(db, bookmark_id, user_id)

    if db_bookmark:
        db_bookmark.is_favorite = not db_bookmark.is_favorite

        if hasattr(Bookmark, 'pinned_position'):
            if db_bookmark.is_favorite:
                # 固定时，设置位置
                max_position = db.query(func.max(Bookmark.pinned_position)).filter(
                    Bookmark.user_id == user_id,
                    Bookmark.is_favorite == True
                ).scalar() or 0
                db_bookmark.pinned_position = max_position + 1
            else:
                # 取消固定时，清除位置
                db_bookmark.pinned_position = None

        db.commit()
        db.refresh(db_bookmark)

    return db_bookmark
