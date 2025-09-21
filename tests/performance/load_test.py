#!/usr/bin/env python3
"""
AI智能记事本性能测试脚本
使用Locust进行负载测试和压力测试
"""

import os
import json
import random
import hashlib
from locust import HttpUser, task, between
from locust.env import Environment
from locust.stats import stats_printer
from locust.log import setup_logging

# 测试配置
BASE_URL = os.getenv('TEST_BASE_URL', 'http://localhost:8000')
TEST_USER_COUNT = int(os.getenv('TEST_USERS', '10'))
SPAWN_RATE = float(os.getenv('SPAWN_RATE', '2'))
TEST_DURATION = int(os.getenv('TEST_DURATION', '300'))  # 5分钟


class AINotebookUser(HttpUser):
    """AI智能记事本用户行为模拟"""
    
    wait_time = between(1, 3)  # 用户操作间隔1-3秒
    
    def on_start(self):
        """用户开始时的初始化操作"""
        self.token = None
        self.user_id = None
        self.notes = []
        self.categories = []
        self.tags = []
        
        # 登录或注册
        self.login()
        
    def login(self):
        """用户登录"""
        # 生成随机用户
        user_id = random.randint(1000, 9999)
        username = f"testuser_{user_id}"
        email = f"test_{user_id}@example.com"
        password = "test123456"
        
        # 尝试注册
        register_data = {
            "username": username,
            "email": email,
            "password": password,
            "first_name": "Test",
            "last_name": "User"
        }
        
        response = self.client.post("/api/auth/register", json=register_data)
        if response.status_code in [200, 201]:
            print(f"用户注册成功: {username}")
        
        # 登录
        login_data = {
            "username": username,
            "password": password
        }
        
        with self.client.post("/api/auth/login", json=login_data, catch_response=True) as response:
            if response.status_code == 200:
                data = response.json()
                self.token = data.get('access_token')
                self.user_id = data.get('user_id')
                self.client.headers.update({'Authorization': f'Bearer {self.token}'})
                response.success()
            else:
                response.failure(f"登录失败: {response.text}")
                
    @task(10)
    def view_notes_list(self):
        """查看笔记列表"""
        params = {
            'page': random.randint(1, 3),
            'limit': random.choice([10, 20, 50]),
            'status': random.choice(['all', 'published', 'draft'])
        }
        
        with self.client.get("/api/notes", params=params, catch_response=True) as response:
            if response.status_code == 200:
                data = response.json()
                self.notes = data.get('items', [])
                response.success()
            else:
                response.failure(f"获取笔记列表失败: {response.text}")
                
    @task(8)
    def view_note_detail(self):
        """查看笔记详情"""
        if not self.notes:
            return
            
        note = random.choice(self.notes)
        note_id = note.get('id')
        
        with self.client.get(f"/api/notes/{note_id}", catch_response=True) as response:
            if response.status_code == 200:
                response.success()
            else:
                response.failure(f"获取笔记详情失败: {response.text}")
                
    @task(5)
    def create_note(self):
        """创建新笔记"""
        note_data = {
            "title": f"测试笔记 {random.randint(1000, 9999)}",
            "content": self.generate_note_content(),
            "category_id": random.choice(self.categories).get('id') if self.categories else None,
            "status": random.choice(['draft', 'published']),
            "tags": random.sample([tag['name'] for tag in self.tags], k=min(3, len(self.tags))) if self.tags else []
        }
        
        with self.client.post("/api/notes", json=note_data, catch_response=True) as response:
            if response.status_code in [200, 201]:
                note = response.json()
                self.notes.append(note)
                response.success()
            else:
                response.failure(f"创建笔记失败: {response.text}")
                
    @task(3)
    def update_note(self):
        """更新笔记"""
        if not self.notes:
            return
            
        note = random.choice(self.notes)
        note_id = note.get('id')
        
        update_data = {
            "title": f"更新的笔记 {random.randint(1000, 9999)}",
            "content": self.generate_note_content(),
            "status": random.choice(['draft', 'published'])
        }
        
        with self.client.put(f"/api/notes/{note_id}", json=update_data, catch_response=True) as response:
            if response.status_code == 200:
                response.success()
            else:
                response.failure(f"更新笔记失败: {response.text}")
                
    @task(6)
    def search_notes(self):
        """搜索笔记"""
        search_terms = ['Python', '测试', '项目', '学习', '工作', 'AI', '开发', '笔记']
        search_query = random.choice(search_terms)
        
        params = {
            'q': search_query,
            'limit': 10
        }
        
        with self.client.get("/api/notes/search", params=params, catch_response=True) as response:
            if response.status_code == 200:
                response.success()
            else:
                response.failure(f"搜索笔记失败: {response.text}")
                
    @task(4)
    def get_categories(self):
        """获取分类列表"""
        with self.client.get("/api/categories", catch_response=True) as response:
            if response.status_code == 200:
                self.categories = response.json()
                response.success()
            else:
                response.failure(f"获取分类失败: {response.text}")
                
    @task(4)
    def get_tags(self):
        """获取标签列表"""
        with self.client.get("/api/tags", catch_response=True) as response:
            if response.status_code == 200:
                self.tags = response.json()
                response.success()
            else:
                response.failure(f"获取标签失败: {response.text}")
                
    @task(2)
    def ai_summarize(self):
        """AI总结功能"""
        if not self.notes:
            return
            
        note = random.choice(self.notes)
        note_id = note.get('id')
        
        task_data = {
            "task_type": "summarize",
            "note_id": note_id,
            "model": "gpt-3.5-turbo"
        }
        
        with self.client.post("/api/ai/tasks", json=task_data, catch_response=True) as response:
            if response.status_code in [200, 201]:
                response.success()
            else:
                response.failure(f"AI总结失败: {response.text}")
                
    @task(2)
    def ai_chat(self):
        """AI对话功能"""
        messages = [
            "请帮我分析一下Python的优缺点",
            "如何提高工作效率？",
            "给我一些学习建议",
            "项目管理的最佳实践是什么？",
            "如何写好技术文档？"
        ]
        
        chat_data = {
            "message": random.choice(messages),
            "model": "gpt-3.5-turbo"
        }
        
        with self.client.post("/api/ai/chat", json=chat_data, catch_response=True) as response:
            if response.status_code == 200:
                response.success()
            else:
                response.failure(f"AI对话失败: {response.text}")
                
    @task(1)
    def user_profile(self):
        """获取用户资料"""
        with self.client.get("/api/users/profile", catch_response=True) as response:
            if response.status_code == 200:
                response.success()
            else:
                response.failure(f"获取用户资料失败: {response.text}")
                
    @task(1)
    def statistics(self):
        """获取统计信息"""
        with self.client.get("/api/statistics", catch_response=True) as response:
            if response.status_code == 200:
                response.success()
            else:
                response.failure(f"获取统计信息失败: {response.text}")
                
    def generate_note_content(self):
        """生成随机笔记内容"""
        templates = [
            """# {title}

## 概述
这是一个关于{topic}的笔记，包含了重要的概念和实践经验。

## 主要内容
1. 基础概念
2. 实践方法
3. 最佳实践
4. 常见问题

## 详细说明
{details}

## 总结
通过学习{topic}，我们可以更好地理解相关概念并应用到实际工作中。

## 标签
#{tag1} #{tag2} #{tag3}
""",
            """# {title}

{content}

## 要点
- 重点一
- 重点二
- 重点三

## 参考资料
- 资料1
- 资料2

#{tag1} #{tag2}
""",
            """# {title}

## 背景
{background}

## 解决方案
{solution}

## 结果
{result}
"""
        ]
        
        topics = ['Python编程', '项目管理', '数据分析', '机器学习', '系统设计', 'Web开发']
        tags = ['python', 'project', 'data', 'ml', 'system', 'web']
        
        template = random.choice(templates)
        topic = random.choice(topics)
        
        return template.format(
            title=f"{topic}学习笔记",
            topic=topic,
            details="这里是详细的学习内容和经验总结...",
            content="这是笔记的主要内容部分...",
            background="项目背景和需求分析...",
            solution="具体的解决方案和实施步骤...",
            result="项目结果和经验总结...",
            tag1=random.choice(tags),
            tag2=random.choice(tags),
            tag3=random.choice(tags)
        )


class DatabaseStressUser(HttpUser):
    """数据库压力测试用户"""
    
    wait_time = between(0.1, 0.5)  # 高频操作
    
    def on_start(self):
        self.login()
        
    def login(self):
        """快速登录"""
        # 使用固定的测试用户
        login_data = {
            "username": "demo_user",
            "password": "demo123456"
        }
        
        response = self.client.post("/api/auth/login", json=login_data)
        if response.status_code == 200:
            data = response.json()
            self.token = data.get('access_token')
            self.client.headers.update({'Authorization': f'Bearer {self.token}'})
            
    @task(20)
    def rapid_notes_access(self):
        """快速访问笔记"""
        note_id = random.randint(1, 100)  # 假设有100个笔记
        self.client.get(f"/api/notes/{note_id}")
        
    @task(15)
    def rapid_search(self):
        """快速搜索"""
        search_terms = ['test', 'python', 'ai', 'note']
        query = random.choice(search_terms)
        self.client.get(f"/api/notes/search?q={query}")
        
    @task(10)
    def rapid_list_access(self):
        """快速列表访问"""
        page = random.randint(1, 10)
        self.client.get(f"/api/notes?page={page}&limit=20")
        
    @task(5)
    def rapid_create(self):
        """快速创建"""
        note_data = {
            "title": f"Stress Test {random.randint(1, 10000)}",
            "content": "Stress test content...",
            "status": "draft"
        }
        self.client.post("/api/notes", json=note_data)


def run_performance_test():
    """运行性能测试"""
    print("开始运行性能测试...")
    
    # 设置日志
    setup_logging("INFO", None)
    
    # 创建环境
    env = Environment(user_classes=[AINotebookUser])
    
    # 启动测试
    env.create_local_runner()
    
    # 开始生成用户
    env.runner.start(TEST_USER_COUNT, spawn_rate=SPAWN_RATE)
    
    # 运行指定时间
    import time
    import gevent
    
    def stop_test():
        time.sleep(TEST_DURATION)
        env.runner.quit()
        
    gevent.spawn(stop_test)
    
    # 打印统计信息
    gevent.spawn(stats_printer(env.stats))
    
    # 等待测试完成
    env.runner.greenlet.join()
    
    # 输出结果
    print("\n=== 性能测试结果 ===")
    print(f"总请求数: {env.stats.total.num_requests}")
    print(f"失败请求数: {env.stats.total.num_failures}")
    print(f"平均响应时间: {env.stats.total.avg_response_time:.2f}ms")
    print(f"95%响应时间: {env.stats.total.get_response_time_percentile(0.95):.2f}ms")
    print(f"99%响应时间: {env.stats.total.get_response_time_percentile(0.99):.2f}ms")
    print(f"RPS: {env.stats.total.current_rps:.2f}")
    
    return env.stats


def run_stress_test():
    """运行压力测试"""
    print("开始运行压力测试...")
    
    # 设置日志
    setup_logging("INFO", None)
    
    # 创建环境
    env = Environment(user_classes=[DatabaseStressUser])
    
    # 启动测试
    env.create_local_runner()
    
    # 逐步增加负载
    stress_phases = [
        (10, 2, 60),   # 10用户，2/秒，持续60秒
        (25, 5, 60),   # 25用户，5/秒，持续60秒
        (50, 10, 60),  # 50用户，10/秒，持续60秒
        (100, 20, 60), # 100用户，20/秒，持续60秒
    ]
    
    for users, spawn_rate, duration in stress_phases:
        print(f"压力测试阶段: {users}用户, {spawn_rate}/秒, {duration}秒")
        
        env.runner.start(users, spawn_rate=spawn_rate)
        
        # 等待阶段完成
        import time
        time.sleep(duration)
        
        # 打印阶段结果
        print(f"  RPS: {env.stats.total.current_rps:.2f}")
        print(f"  平均响应时间: {env.stats.total.avg_response_time:.2f}ms")
        print(f"  失败率: {env.stats.total.fail_ratio:.2%}")
        
        # 重置统计
        env.stats.reset_all()
        
    # 停止测试
    env.runner.quit()
    
    return env.stats


if __name__ == "__main__":
    import sys
    
    if len(sys.argv) > 1 and sys.argv[1] == "stress":
        run_stress_test()
    else:
        run_performance_test()