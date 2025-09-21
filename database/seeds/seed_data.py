#!/usr/bin/env python3
"""
数据库种子数据脚本
创建开发和测试环境的初始数据
"""

import os
import sys
import argparse
import logging
import hashlib
import datetime
from typing import List, Dict

import psycopg2
import psycopg2.extras

# 配置日志
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


class DatabaseSeeder:
    """数据库种子数据管理器"""
    
    def __init__(self, database_url: str):
        self.database_url = database_url
        self.connection = None
        
    def connect(self):
        """连接数据库"""
        try:
            self.connection = psycopg2.connect(self.database_url)
            self.connection.autocommit = False
            logger.info("数据库连接成功")
        except psycopg2.Error as e:
            logger.error(f"数据库连接失败: {e}")
            raise
            
    def disconnect(self):
        """断开数据库连接"""
        if self.connection:
            self.connection.close()
            logger.info("数据库连接已断开")
            
    def hash_password(self, password: str) -> str:
        """生成密码哈希"""
        # 简单的密码哈希（生产环境应使用bcrypt）
        return hashlib.sha256(password.encode()).hexdigest()
        
    def seed_users(self):
        """创建用户种子数据"""
        logger.info("创建用户种子数据...")
        
        users = [
            {
                'username': 'admin',
                'email': 'admin@ai-notebook.com',
                'password': 'admin123456',
                'first_name': '管理员',
                'last_name': '用户',
                'is_active': True,
                'is_verified': True
            },
            {
                'username': 'demo_user',
                'email': 'demo@ai-notebook.com',
                'password': 'demo123456',
                'first_name': '演示',
                'last_name': '用户',
                'is_active': True,
                'is_verified': True
            },
            {
                'username': 'test_user',
                'email': 'test@ai-notebook.com',
                'password': 'test123456',
                'first_name': '测试',
                'last_name': '用户',
                'is_active': True,
                'is_verified': False
            }
        ]
        
        try:
            with self.connection.cursor() as cursor:
                for user in users:
                    # 检查用户是否已存在
                    cursor.execute(
                        "SELECT id FROM users WHERE username = %s OR email = %s",
                        (user['username'], user['email'])
                    )
                    
                    if cursor.fetchone():
                        logger.info(f"用户 {user['username']} 已存在，跳过")
                        continue
                    
                    # 插入用户
                    cursor.execute("""
                        INSERT INTO users (username, email, password_hash, first_name, last_name, is_active, is_verified)
                        VALUES (%(username)s, %(email)s, %(password_hash)s, %(first_name)s, %(last_name)s, %(is_active)s, %(is_verified)s)
                        RETURNING id
                    """, {
                        **user,
                        'password_hash': self.hash_password(user['password'])
                    })
                    
                    user_id = cursor.fetchone()[0]
                    logger.info(f"创建用户: {user['username']} (ID: {user_id})")
                    
                    # 创建用户配置
                    cursor.execute("""
                        INSERT INTO user_preferences (user_id, theme, language, timezone)
                        VALUES (%s, %s, %s, %s)
                    """, (user_id, 'light', 'zh-CN', 'Asia/Shanghai'))
                    
            self.connection.commit()
            logger.info("用户种子数据创建完成")
            
        except psycopg2.Error as e:
            logger.error(f"创建用户种子数据失败: {e}")
            self.connection.rollback()
            raise
            
    def seed_categories(self):
        """创建分类种子数据"""
        logger.info("创建分类种子数据...")
        
        try:
            with self.connection.cursor() as cursor:
                # 获取用户ID
                cursor.execute("SELECT id FROM users WHERE username IN ('admin', 'demo_user')")
                user_ids = [row[0] for row in cursor.fetchall()]
                
                categories = [
                    {
                        'name': '工作笔记',
                        'description': '工作相关的笔记和文档',
                        'color': '#007bff',
                        'icon': 'briefcase'
                    },
                    {
                        'name': '学习笔记',
                        'description': '学习资料和知识总结',
                        'color': '#28a745',
                        'icon': 'book'
                    },
                    {
                        'name': '生活记录',
                        'description': '日常生活的记录和感悟',
                        'color': '#ffc107',
                        'icon': 'heart'
                    },
                    {
                        'name': '项目管理',
                        'description': '项目相关的文档和进度',
                        'color': '#dc3545',
                        'icon': 'clipboard'
                    },
                    {
                        'name': '想法灵感',
                        'description': '创意想法和灵感记录',
                        'color': '#6f42c1',
                        'icon': 'lightbulb'
                    }
                ]
                
                for user_id in user_ids:
                    for i, category in enumerate(categories):
                        cursor.execute("""
                            INSERT INTO note_categories (user_id, name, description, color, icon, sort_order)
                            VALUES (%s, %s, %s, %s, %s, %s)
                            ON CONFLICT (user_id, name) DO NOTHING
                        """, (
                            user_id,
                            category['name'],
                            category['description'],
                            category['color'],
                            category['icon'],
                            i
                        ))
                        
            self.connection.commit()
            logger.info("分类种子数据创建完成")
            
        except psycopg2.Error as e:
            logger.error(f"创建分类种子数据失败: {e}")
            self.connection.rollback()
            raise
            
    def seed_tags(self):
        """创建标签种子数据"""
        logger.info("创建标签种子数据...")
        
        try:
            with self.connection.cursor() as cursor:
                # 获取用户ID
                cursor.execute("SELECT id FROM users WHERE username IN ('admin', 'demo_user')")
                user_ids = [row[0] for row in cursor.fetchall()]
                
                tags = [
                    {'name': 'Python', 'color': '#3776ab'},
                    {'name': 'JavaScript', 'color': '#f7df1e'},
                    {'name': 'AI/ML', 'color': '#ff6b6b'},
                    {'name': '数据库', 'color': '#4ecdc4'},
                    {'name': '前端', 'color': '#45b7d1'},
                    {'name': '后端', 'color': '#96ceb4'},
                    {'name': '架构设计', 'color': '#feca57'},
                    {'name': '性能优化', 'color': '#ff9ff3'},
                    {'name': '安全', 'color': '#54a0ff'},
                    {'name': '工具', 'color': '#5f27cd'},
                    {'name': '读书笔记', 'color': '#00d2d3'},
                    {'name': '会议记录', 'color': '#ff9f43'},
                    {'name': '待办事项', 'color': '#ee5a24'},
                    {'name': '重要', 'color': '#e74c3c'},
                    {'name': '想法', 'color': '#9b59b6'}
                ]
                
                for user_id in user_ids:
                    for tag in tags:
                        cursor.execute("""
                            INSERT INTO tags (user_id, name, color)
                            VALUES (%s, %s, %s)
                            ON CONFLICT (user_id, name) DO NOTHING
                        """, (user_id, tag['name'], tag['color']))
                        
            self.connection.commit()
            logger.info("标签种子数据创建完成")
            
        except psycopg2.Error as e:
            logger.error(f"创建标签种子数据失败: {e}")
            self.connection.rollback()
            raise
            
    def seed_notes(self):
        """创建笔记种子数据"""
        logger.info("创建笔记种子数据...")
        
        try:
            with self.connection.cursor() as cursor:
                # 获取demo用户ID
                cursor.execute("SELECT id FROM users WHERE username = 'demo_user'")
                demo_user_id = cursor.fetchone()[0]
                
                # 获取分类ID
                cursor.execute("SELECT id, name FROM note_categories WHERE user_id = %s", (demo_user_id,))
                categories = {name: id for id, name in cursor.fetchall()}
                
                # 获取标签ID
                cursor.execute("SELECT id, name FROM tags WHERE user_id = %s", (demo_user_id,))
                tags = {name: id for id, name in cursor.fetchall()}
                
                notes = [
                    {
                        'title': '欢迎使用AI智能记事本',
                        'content': '''# 欢迎使用AI智能记事本！

这是一个功能强大的智能笔记应用，集成了AI功能来帮助您更好地管理和组织笔记。

## 主要功能

### 📝 笔记管理
- 支持Markdown语法
- 分类和标签管理
- 搜索和过滤
- 版本历史

### 🤖 AI助手
- 智能总结
- 内容扩展
- 语言翻译
- 写作建议

### 🔒 安全可靠
- 数据加密存储
- 用户权限管理
- 备份和恢复

开始您的智能笔记之旅吧！''',
                        'category': '工作笔记',
                        'tags': ['重要'],
                        'status': 'published',
                        'is_favorite': True
                    },
                    {
                        'title': 'Python最佳实践',
                        'content': '''# Python最佳实践

## 代码风格
- 遵循PEP 8规范
- 使用有意义的变量名
- 添加适当的注释

## 项目结构
```
project/
├── src/
├── tests/
├── docs/
├── requirements.txt
└── README.md
```

## 常用库
- **Web框架**: FastAPI, Django, Flask
- **数据处理**: Pandas, NumPy
- **机器学习**: Scikit-learn, TensorFlow, PyTorch
- **测试**: Pytest, Unittest

## 开发工具
- 代码格式化: Black
- 静态分析: Pylint, Flake8
- 类型检查: MyPy''',
                        'category': '学习笔记',
                        'tags': ['Python', '工具'],
                        'status': 'published'
                    },
                    {
                        'title': '项目架构设计思考',
                        'content': '''# 项目架构设计思考

## 微服务架构
- 服务拆分原则
- 数据一致性
- 服务通信
- 监控和日志

## 数据库设计
- 规范化 vs 反规范化
- 索引优化
- 分库分表
- 读写分离

## 性能优化
- 缓存策略
- CDN使用
- 数据库优化
- 代码优化

## 安全考虑
- 身份认证
- 权限控制
- 数据加密
- 输入验证''',
                        'category': '项目管理',
                        'tags': ['架构设计', '性能优化', '安全'],
                        'status': 'draft'
                    },
                    {
                        'title': 'AI应用开发心得',
                        'content': '''# AI应用开发心得

## 模型选择
- GPT系列：文本生成、对话
- BERT系列：文本理解、分类
- 图像模型：CNN、Vision Transformer

## 提示工程
- 清晰的指令
- 提供示例
- 设置约束条件
- 迭代优化

## 部署考虑
- 模型大小和性能
- 成本控制
- 延迟要求
- 可扩展性

## 伦理和安全
- 偏见检测
- 内容过滤
- 隐私保护
- 可解释性''',
                        'category': '学习笔记',
                        'tags': ['AI/ML', '重要'],
                        'status': 'published',
                        'is_favorite': True
                    },
                    {
                        'title': '读书笔记：《设计模式》',
                        'content': '''# 读书笔记：《设计模式》

## 创建型模式
### 单例模式
- 确保一个类只有一个实例
- 提供全局访问点

### 工厂模式
- 封装对象创建过程
- 降低耦合度

## 结构型模式
### 适配器模式
- 使不兼容的类能够合作
- 包装现有类

### 装饰器模式
- 动态添加功能
- 不改变原有结构

## 行为型模式
### 观察者模式
- 定义对象间的依赖关系
- 一对多的依赖关系

### 策略模式
- 定义算法家族
- 运行时选择算法''',
                        'category': '学习笔记',
                        'tags': ['读书笔记', '架构设计'],
                        'status': 'published'
                    }
                ]
                
                for note_data in notes:
                    # 插入笔记
                    cursor.execute("""
                        INSERT INTO notes (user_id, category_id, title, content, status, is_favorite)
                        VALUES (%s, %s, %s, %s, %s, %s)
                        RETURNING id
                    """, (
                        demo_user_id,
                        categories.get(note_data['category']),
                        note_data['title'],
                        note_data['content'],
                        note_data['status'],
                        note_data.get('is_favorite', False)
                    ))
                    
                    note_id = cursor.fetchone()[0]
                    logger.info(f"创建笔记: {note_data['title']} (ID: {note_id})")
                    
                    # 添加标签
                    for tag_name in note_data.get('tags', []):
                        if tag_name in tags:
                            cursor.execute("""
                                INSERT INTO note_tags (note_id, tag_id)
                                VALUES (%s, %s)
                                ON CONFLICT (note_id, tag_id) DO NOTHING
                            """, (note_id, tags[tag_name]))
                            
            self.connection.commit()
            logger.info("笔记种子数据创建完成")
            
        except psycopg2.Error as e:
            logger.error(f"创建笔记种子数据失败: {e}")
            self.connection.rollback()
            raise
            
    def seed_ai_data(self):
        """创建AI相关种子数据"""
        logger.info("创建AI种子数据...")
        
        try:
            with self.connection.cursor() as cursor:
                # 获取demo用户ID
                cursor.execute("SELECT id FROM users WHERE username = 'demo_user'")
                demo_user_id = cursor.fetchone()[0]
                
                # 创建知识库
                cursor.execute("""
                    INSERT INTO ai_knowledge_base (user_id, name, description, embedding_model)
                    VALUES (%s, %s, %s, %s)
                    RETURNING id
                """, (
                    demo_user_id,
                    '我的知识库',
                    '个人笔记和文档的智能检索库',
                    'text-embedding-ada-002'
                ))
                
                kb_id = cursor.fetchone()[0]
                logger.info(f"创建知识库: 我的知识库 (ID: {kb_id})")
                
                # 创建示例对话
                cursor.execute("""
                    SELECT id FROM ai_models WHERE name = 'gpt-3.5-turbo'
                """)
                model_id = cursor.fetchone()[0]
                
                cursor.execute("""
                    INSERT INTO ai_conversations (user_id, title, model_id, system_prompt)
                    VALUES (%s, %s, %s, %s)
                    RETURNING id
                """, (
                    demo_user_id,
                    '笔记写作助手',
                    model_id,
                    '你是一个专业的笔记写作助手，帮助用户改进和完善笔记内容。'
                ))
                
                conv_id = cursor.fetchone()[0]
                logger.info(f"创建对话: 笔记写作助手 (ID: {conv_id})")
                
                # 添加示例消息
                messages = [
                    {
                        'role': 'user',
                        'content': '请帮我总结一下Python编程的核心概念'
                    },
                    {
                        'role': 'assistant',
                        'content': '''Python编程的核心概念包括：

**1. 数据类型和变量**
- 基本类型：int, float, str, bool
- 容器类型：list, tuple, dict, set
- 动态类型系统

**2. 控制结构**
- 条件语句：if/elif/else
- 循环：for, while
- 异常处理：try/except/finally

**3. 函数和模块**
- 函数定义和调用
- 参数传递（位置参数、关键字参数）
- 模块导入和包管理

**4. 面向对象编程**
- 类和对象
- 继承和多态
- 封装和抽象

**5. Python特色功能**
- 列表推导式
- 生成器和迭代器
- 装饰器
- 上下文管理器

这些概念构成了Python编程的基础，掌握它们能让你更好地理解和使用Python。'''
                    }
                ]
                
                for msg in messages:
                    cursor.execute("""
                        INSERT INTO ai_messages (conversation_id, role, content, token_count)
                        VALUES (%s, %s, %s, %s)
                    """, (
                        conv_id,
                        msg['role'],
                        msg['content'],
                        len(msg['content']) // 4  # 粗略估算token数
                    ))
                    
            self.connection.commit()
            logger.info("AI种子数据创建完成")
            
        except psycopg2.Error as e:
            logger.error(f"创建AI种子数据失败: {e}")
            self.connection.rollback()
            raise
            
    def clear_data(self):
        """清空所有数据"""
        logger.warning("清空所有数据...")
        
        try:
            with self.connection.cursor() as cursor:
                # 按依赖顺序删除
                tables = [
                    'ai_feedback',
                    'ai_document_chunks',
                    'ai_knowledge_base',
                    'ai_usage_stats',
                    'ai_messages',
                    'ai_conversations',
                    'ai_tasks',
                    'note_shares',
                    'note_attachments',
                    'note_tags',
                    'note_versions',
                    'notes',
                    'tags',
                    'note_categories',
                    'user_sessions',
                    'user_preferences',
                    'users'
                ]
                
                for table in tables:
                    cursor.execute(f"TRUNCATE TABLE {table} RESTART IDENTITY CASCADE")
                    logger.info(f"清空表: {table}")
                    
            self.connection.commit()
            logger.info("数据清空完成")
            
        except psycopg2.Error as e:
            logger.error(f"清空数据失败: {e}")
            self.connection.rollback()
            raise
            
    def seed_all(self):
        """创建所有种子数据"""
        logger.info("开始创建种子数据...")
        
        self.seed_users()
        self.seed_categories()
        self.seed_tags()
        self.seed_notes()
        self.seed_ai_data()
        
        logger.info("所有种子数据创建完成")


def main():
    """主函数"""
    parser = argparse.ArgumentParser(description='数据库种子数据管理器')
    parser.add_argument('--database-url', required=True, help='数据库连接URL')
    
    subparsers = parser.add_subparsers(dest='command', help='可用命令')
    
    subparsers.add_parser('seed', help='创建种子数据')
    subparsers.add_parser('clear', help='清空所有数据')
    subparsers.add_parser('reset', help='清空并重新创建种子数据')
    
    args = parser.parse_args()
    
    if not args.command:
        parser.print_help()
        return
        
    # 创建种子数据管理器
    seeder = DatabaseSeeder(args.database_url)
    
    try:
        seeder.connect()
        
        if args.command == 'seed':
            seeder.seed_all()
        elif args.command == 'clear':
            confirm = input("确定要清空所有数据吗？这个操作不可恢复！(y/N): ")
            if confirm.lower() == 'y':
                seeder.clear_data()
            else:
                logger.info("操作已取消")
        elif args.command == 'reset':
            confirm = input("确定要重置所有数据吗？这个操作不可恢复！(y/N): ")
            if confirm.lower() == 'y':
                seeder.clear_data()
                seeder.seed_all()
            else:
                logger.info("操作已取消")
                
    except Exception as e:
        logger.error(f"执行失败: {e}")
        sys.exit(1)
    finally:
        seeder.disconnect()


if __name__ == '__main__':
    main()