from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field


# 用户相关
class UserCreate(BaseModel):
    username: str = Field(..., min_length=3, max_length=50)
    password: str = Field(..., min_length=8)


class UserLogin(BaseModel):
    username: str
    password: str


class UserResponse(BaseModel):
    id: int
    username: str
    created_at: datetime

    class Config:
        from_attributes = True


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse


# 分类相关
class CategoryBase(BaseModel):
    name: str = Field(..., max_length=50)
    icon: str = Field(default="📁", max_length=10)
    color: str = Field(default="#667eea", max_length=50)


class CategoryCreate(CategoryBase):
    pass


class CategoryUpdate(CategoryBase):
    pass


class CategoryResponse(CategoryBase):
    id: int
    user_id: int
    is_system: bool
    display_order: int
    bookmark_count: Optional[int] = 0
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class CategoryReorder(BaseModel):
    category_ids: list[int]


# 书签相关
class BookmarkBase(BaseModel):
    model_config = {"populate_by_name": True}

    title: str = Field(
        ...,
        max_length=200,
        validation_alias='name',
        serialization_alias='name'
    )
    url: str
    description: Optional[str] = None
    icon: Optional[str] = Field(None, max_length=500)
    category_id: Optional[int] = None
    tags: Optional[str] = Field(None, max_length=200)


class BookmarkCreate(BookmarkBase):
    pass


class BookmarkUpdate(BaseModel):
    model_config = {"populate_by_name": True}

    title: Optional[str] = Field(
        None,
        max_length=200,
        validation_alias='name',
        serialization_alias='name'
    )
    url: Optional[str] = None
    description: Optional[str] = None
    icon: Optional[str] = Field(None, max_length=500)
    category_id: Optional[int] = None
    tags: Optional[str] = Field(None, max_length=200)


class BookmarkResponse(BookmarkBase):
    id: int
    user_id: int
    is_favorite: bool
    visit_count: int
    last_visit_at: Optional[datetime] = None
    display_order: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class BookmarkListParams(BaseModel):
    category_id: Optional[int] = None
    search: Optional[str] = None
    sort_by: str = Field(default="created_at", pattern="^(created_at|last_visit_at|visit_count|title|display_order)$")
    order: str = Field(default="desc", pattern="^(asc|desc)$")
    page: int = Field(default=1, ge=1)
    page_size: int = Field(default=12, ge=1, le=100)


class BookmarkListResponse(BaseModel):
    items: list[BookmarkResponse]
    total: int
    page: int
    page_size: int
    total_pages: int


class BookmarkReorder(BaseModel):
    bookmark_ids: list[int]
