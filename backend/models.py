from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime
from enum import Enum

# User roles
class UserRole(str, Enum):
    admin = "admin"
    user = "user"

# User models
class UserCreate(BaseModel):
    email: str
    password: str
    full_name: Optional[str] = None
    role: UserRole = UserRole.user  # 默认为普通用户

class UserLogin(BaseModel):
    email: str
    password: str

class User(BaseModel):
    id: str
    email: str
    full_name: Optional[str] = None
    role: UserRole
    openrouter_api_key: Optional[str] = None
    google_api_key: Optional[str] = None  # 用于Nano Banana/Gemini
    created_at: datetime
    updated_at: datetime

class UserUpdate(BaseModel):
    full_name: Optional[str] = None
    openrouter_api_key: Optional[str] = None
    google_api_key: Optional[str] = None  # 用于Nano Banana/Gemini
    role: Optional[UserRole] = None  # 只有管理员可以修改角色

# Admin models
class UserListResponse(BaseModel):
    """管理员查看用户列表"""
    id: str
    email: str
    full_name: Optional[str] = None
    role: UserRole
    created_at: datetime
    updated_at: datetime
    notes_count: int = 0
    todos_count: int = 0

class AdminUserUpdate(BaseModel):
    """管理员更新用户信息"""
    full_name: Optional[str] = None
    role: Optional[UserRole] = None
    openrouter_api_key: Optional[str] = None

class SystemStats(BaseModel):
    """系统统计信息"""
    total_users: int
    total_notes: int
    total_todos: int
    total_projects: int
    admin_users: int
    regular_users: int

# Folder models
class FolderCreate(BaseModel):
    name: str
    parent_id: Optional[str] = None

class FolderUpdate(BaseModel):
    name: Optional[str] = None
    parent_id: Optional[str] = None

class Folder(BaseModel):
    id: str
    name: str
    parent_id: Optional[str] = None
    user_id: str
    created_at: datetime
    updated_at: datetime

# Note models
class NoteCreate(BaseModel):
    title: str
    content: str
    tags: Optional[List[str]] = []
    folder_id: Optional[str] = None

class NoteUpdate(BaseModel):
    title: Optional[str] = None
    content: Optional[str] = None
    tags: Optional[List[str]] = None
    folder_id: Optional[str] = None

class Note(BaseModel):
    id: str
    title: str
    content: str
    tags: List[str]
    folder_id: Optional[str] = None
    user_id: str
    created_at: datetime
    updated_at: datetime

# AI Request models
class AIRequest(BaseModel):
    action: str  # "continue", "polish", "translate", "summarize", "question", "analyze_project_idea", "extract_todos", "generate_plan"
    text: str
    model: Optional[str] = None  # AI model to use
    question: Optional[str] = None  # For Q&A functionality
    target_language: Optional[str] = None  # For translation
    instruction: Optional[str] = None  # For custom instructions

class AIResponse(BaseModel):
    result: str
    action: str

# Token models
class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    email: Optional[str] = None

# Chat models
class ChatModel(str, Enum):
    claude_sonnet = "anthropic/claude-3-sonnet"
    claude_haiku = "anthropic/claude-3-haiku"
    gpt4_turbo = "openai/gpt-4-turbo"
    gpt35_turbo = "openai/gpt-3.5-turbo"

class MessageRole(str, Enum):
    user = "user"
    assistant = "assistant"
    system = "system"

class ChatSessionCreate(BaseModel):
    title: Optional[str] = "新的对话"
    model: ChatModel = ChatModel.claude_sonnet

class ChatSessionUpdate(BaseModel):
    title: Optional[str] = None
    model: Optional[ChatModel] = None

class ChatSession(BaseModel):
    id: str
    title: str
    model: ChatModel
    user_id: str
    created_at: datetime
    updated_at: datetime

class ChatMessageCreate(BaseModel):
    content: str
    role: MessageRole = MessageRole.user

class ChatMessage(BaseModel):
    id: str
    session_id: str
    content: str
    role: MessageRole
    created_at: datetime

class ChatRequest(BaseModel):
    message: str
    session_id: Optional[str] = None
    model: Optional[str] = None  # 改为字符串类型以支持自定义模型

class ChatResponse(BaseModel):
    message: str
    session_id: str

# Todo models
class TodoPriority(str, Enum):
    low = "low"
    medium = "medium"
    high = "high"

class TodoCategory(str, Enum):
    work = "work"
    personal = "personal"
    study = "study"

class TodoCreate(BaseModel):
    title: str
    description: Optional[str] = None
    priority: TodoPriority = TodoPriority.medium
    due_date: Optional[datetime] = None
    category: TodoCategory = TodoCategory.work
    assignee: Optional[str] = None
    tags: Optional[List[str]] = []

class TodoUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    priority: Optional[TodoPriority] = None
    due_date: Optional[datetime] = None
    category: Optional[TodoCategory] = None
    assignee: Optional[str] = None
    tags: Optional[List[str]] = None
    completed: Optional[bool] = None

class Todo(BaseModel):
    id: str
    title: str
    description: Optional[str] = None
    priority: TodoPriority
    due_date: Optional[datetime] = None
    category: TodoCategory
    assignee: Optional[str] = None
    tags: List[str]
    completed: bool
    user_id: str
    created_at: datetime
    updated_at: datetime

# Version History models
class VersionType(str, Enum):
    manual_save = "manual_save"
    auto_save = "auto_save"
    restore = "restore"

class NoteVersionCreate(BaseModel):
    note_id: str
    title: str
    content: str
    tags: List[str]
    version_type: VersionType = VersionType.auto_save
    comment: Optional[str] = None

class NoteVersion(BaseModel):
    id: str
    note_id: str
    title: str
    content: str
    tags: List[str]
    version_type: VersionType
    comment: Optional[str] = None
    user_id: str
    created_at: datetime

class NoteVersionRestore(BaseModel):
    version_id: str
    comment: Optional[str] = None

# Project Management models
class ProjectPriority(str, Enum):
    low = "low"
    medium = "medium" 
    high = "high"
    urgent = "urgent"

# Board models
class BoardCreate(BaseModel):
    name: str
    description: Optional[str] = None
    color: Optional[str] = "#3b82f6"  # 默认蓝色

class BoardUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    color: Optional[str] = None

class Board(BaseModel):
    id: str
    name: str
    description: Optional[str] = None
    color: str
    user_id: str
    created_at: datetime
    updated_at: datetime

# List models (看板中的列表)
class ListCreate(BaseModel):
    title: str
    position: Optional[int] = 0

class ListUpdate(BaseModel):
    title: Optional[str] = None
    position: Optional[int] = None

class BoardList(BaseModel):
    id: str
    title: str
    position: int
    board_id: str
    created_at: datetime
    updated_at: datetime

# Card models (任务卡片)
class CardCreate(BaseModel):
    title: str
    description: Optional[str] = None
    priority: ProjectPriority = ProjectPriority.medium
    due_date: Optional[datetime] = None
    assignee: Optional[str] = None
    tags: Optional[List[str]] = []
    position: Optional[int] = 0

class CardUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    priority: Optional[ProjectPriority] = None
    due_date: Optional[datetime] = None
    assignee: Optional[str] = None
    tags: Optional[List[str]] = None
    position: Optional[int] = None
    list_id: Optional[str] = None  # 用于移动卡片到不同列表
    completed: Optional[bool] = None

class Card(BaseModel):
    id: str
    title: str
    description: Optional[str] = None
    priority: ProjectPriority
    due_date: Optional[datetime] = None
    assignee: Optional[str] = None
    tags: List[str]
    position: int
    list_id: str
    completed: bool
    created_at: datetime
    updated_at: datetime

# Card comment models
class CardCommentCreate(BaseModel):
    content: str

class CardComment(BaseModel):
    id: str
    card_id: str
    content: str
    user_id: str
    created_at: datetime

# Board with full data (包含列表和卡片)
class BoardWithData(BaseModel):
    id: str
    name: str
    description: Optional[str] = None
    color: str
    user_id: str
    created_at: datetime
    updated_at: datetime
    lists: List["ListWithCards"]

class ListWithCards(BaseModel):
    id: str
    title: str
    position: int
    board_id: str
    created_at: datetime
    updated_at: datetime
    cards: List[Card]

# 更新 forward reference
BoardWithData.model_rebuild()

# Share models (分享功能)
class SharePermission(str, Enum):
    view_only = "view_only"  # 仅查看
    can_comment = "can_comment"  # 可评论

class NoteShareCreate(BaseModel):
    note_id: str
    permission: SharePermission = SharePermission.view_only
    expires_at: Optional[datetime] = None  # 过期时间，None表示永久有效
    password: Optional[str] = None  # 可选的访问密码

class NoteShare(BaseModel):
    id: str
    note_id: str
    user_id: str  # 分享者ID
    share_token: str  # 唯一分享token
    permission: SharePermission
    expires_at: Optional[datetime] = None
    password: Optional[str] = None
    view_count: int = 0  # 查看次数
    created_at: datetime
    updated_at: datetime

class NoteSharePublic(BaseModel):
    """公开分享信息（不包含敏感数据）"""
    id: str
    note_id: str
    permission: SharePermission
    view_count: int
    created_at: datetime

# Comment models (评论功能)
class CommentCreate(BaseModel):
    content: str
    author_name: Optional[str] = "匿名"  # 游客评论时的昵称
    author_email: Optional[str] = None

class CommentUpdate(BaseModel):
    content: Optional[str] = None

class Comment(BaseModel):
    id: str
    note_id: str
    share_token: str  # 关联的分享token
    content: str
    author_name: str
    author_email: Optional[str] = None
    user_id: Optional[str] = None  # 如果是登录用户评论
    created_at: datetime
    updated_at: datetime

class SharedNoteView(BaseModel):
    """分享笔记的公开视图"""
    note: Note
    share_info: NoteSharePublic
    comments: List[Comment]
