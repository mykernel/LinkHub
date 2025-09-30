from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from typing import Optional
import math

from config import settings
from database import get_db
from models import User, Category, Bookmark
from schemas import (
    UserCreate, UserLogin, UserResponse, Token,
    CategoryCreate, CategoryUpdate, CategoryResponse, CategoryReorder,
    BookmarkCreate, BookmarkUpdate, BookmarkResponse, BookmarkListParams, BookmarkListResponse
)
from auth import get_current_user, get_current_user_optional, verify_password, create_access_token
import crud


def serialize_bookmark(bookmark: Bookmark) -> BookmarkResponse:
    """将数据库书签对象转换为响应模型"""
    return BookmarkResponse(
        id=bookmark.id,
        user_id=bookmark.user_id,
        name=bookmark.title,
        url=bookmark.url,
        description=bookmark.description,
        icon=bookmark.icon or "🔗",
        category_id=bookmark.category_id,
        tags=bookmark.tags,
        is_favorite=bookmark.is_favorite,
        visit_count=bookmark.visit_count,
        last_visit_at=bookmark.last_visit_at,
        created_at=bookmark.created_at,
        updated_at=bookmark.updated_at
    )

# 创建 FastAPI 应用
app = FastAPI(
    title="LinkHub API",
    description="智能书签管理系统",
    version="1.0.0"
)

# CORS 配置
origins = settings.CORS_ORIGINS.split(",") if settings.CORS_ORIGINS != "*" else ["*"]
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ===== 认证接口 =====

@app.post("/api/auth/signup", response_model=Token, tags=["认证"])
def signup(user: UserCreate, db: Session = Depends(get_db)):
    """用户注册"""
    # 检查用户名是否已存在
    db_user = crud.get_user_by_username(db, user.username)
    if db_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="用户名已存在"
        )

    # 创建用户
    new_user = crud.create_user(db, user)

    # 生成 token
    access_token = create_access_token(data={"sub": new_user.username})

    return Token(
        access_token=access_token,
        user=UserResponse.from_orm(new_user)
    )


@app.post("/api/auth/login", response_model=Token, tags=["认证"])
def login(user: UserLogin, db: Session = Depends(get_db)):
    """用户登录"""
    # 查询用户
    db_user = crud.get_user_by_username(db, user.username)

    if not db_user or not verify_password(user.password, db_user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="用户名或密码错误"
        )

    # 生成 token
    access_token = create_access_token(data={"sub": db_user.username})

    return Token(
        access_token=access_token,
        user=UserResponse.from_orm(db_user)
    )


@app.get("/api/auth/me", response_model=UserResponse, tags=["认证"])
def get_me(current_user: User = Depends(get_current_user)):
    """获取当前用户信息"""
    return UserResponse.from_orm(current_user)


# ===== 分类接口 =====

@app.get("/api/categories", response_model=list[CategoryResponse], tags=["分类"])
def get_categories(
    current_user: Optional[User] = Depends(get_current_user_optional),
    db: Session = Depends(get_db)
):
    """获取分类列表（支持访客模式）"""
    if not current_user:
        # 访客模式：显示demo用户的分类和书签统计
        demo_user = db.query(User).filter(User.username == "demo").first()
        if not demo_user:
            return []
        # 使用demo用户的分类数据
        categories = crud.get_categories(db, demo_user.id)
        responses: list[CategoryResponse] = []
        for cat in categories:
            response = CategoryResponse.from_orm(cat).model_copy(
                update={"bookmark_count": getattr(cat, 'bookmark_count', 0)}
            )
            responses.append(response)
        return responses

    # 登录用户：返回用户分类
    categories = crud.get_categories(db, current_user.id)
    responses: list[CategoryResponse] = []
    for cat in categories:
        response = CategoryResponse.from_orm(cat).model_copy(
            update={"bookmark_count": getattr(cat, 'bookmark_count', 0)}
        )
        responses.append(response)
    return responses


@app.post("/api/categories", response_model=CategoryResponse, tags=["分类"])
def create_category(
    category: CategoryCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """创建分类"""
    db_category = crud.create_category(db, current_user.id, category)
    return CategoryResponse.from_orm(db_category).model_copy(update={"bookmark_count": 0})


@app.put("/api/categories/{category_id}", response_model=CategoryResponse, tags=["分类"])
def update_category(
    category_id: int,
    category: CategoryUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """更新分类"""
    db_category = crud.update_category(db, category_id, current_user.id, category)

    if not db_category:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="分类不存在或无权限修改"
        )

    return CategoryResponse.from_orm(db_category).model_copy(
        update={"bookmark_count": getattr(db_category, 'bookmark_count', 0)}
    )


@app.delete("/api/categories/{category_id}", tags=["分类"])
def delete_category(
    category_id: int,
    transfer_to_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """删除分类（需指定书签转移目标）"""
    success = crud.delete_category(db, category_id, current_user.id, transfer_to_id)

    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="分类不存在或无权限删除"
        )

    return {"message": "分类已删除"}


@app.post("/api/categories/reorder", tags=["分类"])
def reorder_categories(
    payload: CategoryReorder,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """调整自定义分类的显示顺序"""
    success = crud.reorder_categories(db, current_user.id, payload.category_ids)

    if not success:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="排序失败，请检查分类列表"
        )

    return {"message": "分类顺序已更新"}


# ===== 书签接口 =====

@app.get("/api/bookmarks", response_model=BookmarkListResponse, tags=["书签"])
def get_bookmarks(
    params: BookmarkListParams = Depends(),
    current_user: Optional[User] = Depends(get_current_user_optional),
    db: Session = Depends(get_db)
):
    """获取书签列表（支持访客模式）"""
    if not current_user:
        # 访客模式：显示demo用户的公开书签
        demo_user = db.query(User).filter(User.username == "demo").first()
        if not demo_user:
            return BookmarkListResponse(
                items=[],
                total=0,
                page=params.page,
                page_size=params.page_size,
                total_pages=0
            )
        # 使用demo用户的ID查询书签
        user_id = demo_user.id
    else:
        user_id = current_user.id

    # 计算分页
    skip = (params.page - 1) * params.page_size

    # 查询书签
    items, total = crud.get_bookmarks(
        db,
        user_id,
        params.category_id,
        params.search,
        params.sort_by,
        params.order,
        skip,
        params.page_size
    )

    # 计算总页数
    total_pages = math.ceil(total / params.page_size) if total > 0 else 0

    return BookmarkListResponse(
        items=[serialize_bookmark(item) for item in items],
        total=total,
        page=params.page,
        page_size=params.page_size,
        total_pages=total_pages
    )


@app.post("/api/bookmarks", response_model=BookmarkResponse, tags=["书签"])
def create_bookmark(
    bookmark: BookmarkCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """创建书签"""
    db_bookmark = crud.create_bookmark(db, current_user.id, bookmark)
    return serialize_bookmark(db_bookmark)


@app.get("/api/bookmarks/{bookmark_id}", response_model=BookmarkResponse, tags=["书签"])
def get_bookmark(
    bookmark_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """获取单个书签"""
    db_bookmark = crud.get_bookmark(db, bookmark_id, current_user.id)

    if not db_bookmark:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="书签不存在"
        )

    return serialize_bookmark(db_bookmark)


@app.put("/api/bookmarks/{bookmark_id}", response_model=BookmarkResponse, tags=["书签"])
def update_bookmark(
    bookmark_id: int,
    bookmark: BookmarkUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """更新书签"""
    db_bookmark = crud.update_bookmark(db, bookmark_id, current_user.id, bookmark)

    if not db_bookmark:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="书签不存在"
        )

    return serialize_bookmark(db_bookmark)


@app.delete("/api/bookmarks/{bookmark_id}", tags=["书签"])
def delete_bookmark(
    bookmark_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """删除书签"""
    success = crud.delete_bookmark(db, bookmark_id, current_user.id)

    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="书签不存在"
        )

    return {"message": "书签已删除"}


@app.post("/api/bookmarks/{bookmark_id}/visit", response_model=BookmarkResponse, tags=["书签"])
def visit_bookmark(
    bookmark_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """访问书签（增加点击数）"""
    db_bookmark = crud.visit_bookmark(db, bookmark_id, current_user.id)

    if not db_bookmark:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="书签不存在"
        )

    return serialize_bookmark(db_bookmark)


@app.put("/api/bookmarks/{bookmark_id}/pin", response_model=BookmarkResponse, tags=["书签"])
def toggle_pin_bookmark(
    bookmark_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """切换书签固定状态"""
    db_bookmark = crud.toggle_pin_bookmark(db, bookmark_id, current_user.id)

    if not db_bookmark:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="书签不存在"
        )

    return serialize_bookmark(db_bookmark)


# ===== 静态文件服务 =====

# 挂载前端静态文件
app.mount("/static", StaticFiles(directory="../frontend"), name="static")


@app.get("/")
def root():
    """根路径重定向到登录页"""
    return FileResponse("../frontend/login.html")


# ===== 健康检查 =====

@app.get("/health", tags=["系统"])
def health_check():
    """健康检查"""
    return {"status": "ok"}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=7001, reload=True)
