#!/usr/bin/env python3
"""
项目管理功能测试脚本
用于验证新添加的项目管理功能是否正常工作
"""
import requests
import json
import sys

# API基础URL
BASE_URL = "http://localhost:8001"

def test_auth():
    """测试认证功能"""
    print("🔐 测试用户认证...")
    
    # 尝试注册测试用户
    register_data = {
        "email": "test@example.com",
        "password": "testpassword123",
        "full_name": "测试用户"
    }
    
    try:
        response = requests.post(f"{BASE_URL}/api/auth/register", json=register_data)
        if response.status_code in [200, 201]:
            print("✓ 用户注册成功")
        elif response.status_code == 400 and "already exists" in response.text:
            print("✓ 用户已存在，继续测试")
        else:
            print(f"✗ 用户注册失败: {response.text}")
            return None
    except Exception as e:
        print(f"✗ 注册请求失败: {e}")
        return None
    
    # 登录获取token
    login_data = {
        "email": "test@example.com", 
        "password": "testpassword123"
    }
    
    try:
        response = requests.post(f"{BASE_URL}/api/auth/login", json=login_data)
        if response.status_code == 200:
            token = response.json().get("access_token")
            print("✓ 用户登录成功")
            return token
        else:
            print(f"✗ 用户登录失败: {response.text}")
            return None
    except Exception as e:
        print(f"✗ 登录请求失败: {e}")
        return None

def test_project_management(token):
    """测试项目管理功能"""
    headers = {"Authorization": f"Bearer {token}"}
    
    print("\n📋 测试项目管理功能...")
    
    # 1. 创建看板
    print("1. 创建测试看板...")
    board_data = {
        "name": "测试项目",
        "description": "这是一个测试项目看板",
        "color": "#3b82f6"
    }
    
    try:
        response = requests.post(f"{BASE_URL}/api/boards", json=board_data, headers=headers)
        if response.status_code == 200:
            board = response.json()
            board_id = board["id"]
            print(f"✓ 看板创建成功: {board['name']}")
        else:
            print(f"✗ 看板创建失败: {response.text}")
            return False
    except Exception as e:
        print(f"✗ 创建看板请求失败: {e}")
        return False
    
    # 2. 创建列表
    print("2. 创建测试列表...")
    lists_data = [
        {"title": "待办事项"},
        {"title": "进行中"},
        {"title": "已完成"}
    ]
    
    list_ids = []
    for list_data in lists_data:
        try:
            response = requests.post(f"{BASE_URL}/api/boards/{board_id}/lists", json=list_data, headers=headers)
            if response.status_code == 200:
                list_obj = response.json()
                list_ids.append(list_obj["id"])
                print(f"✓ 列表创建成功: {list_obj['title']}")
            else:
                print(f"✗ 列表创建失败: {response.text}")
                return False
        except Exception as e:
            print(f"✗ 创建列表请求失败: {e}")
            return False
    
    # 3. 创建卡片
    print("3. 创建测试卡片...")
    cards_data = [
        {
            "title": "设计用户界面",
            "description": "创建用户友好的界面设计",
            "priority": "high",
            "assignee": "张三",
            "tags": ["设计", "UI"]
        },
        {
            "title": "开发后端API",
            "description": "实现RESTful API接口",
            "priority": "medium",
            "assignee": "李四",
            "tags": ["后端", "API"]
        }
    ]
    
    card_ids = []
    for i, card_data in enumerate(cards_data):
        try:
            list_id = list_ids[i % len(list_ids)]  # 分配到不同列表
            response = requests.post(f"{BASE_URL}/api/lists/{list_id}/cards", json=card_data, headers=headers)
            if response.status_code == 200:
                card = response.json()
                card_ids.append(card["id"])
                print(f"✓ 卡片创建成功: {card['title']}")
            else:
                print(f"✗ 卡片创建失败: {response.text}")
                return False
        except Exception as e:
            print(f"✗ 创建卡片请求失败: {e}")
            return False
    
    # 4. 获取看板完整数据
    print("4. 获取看板完整数据...")
    try:
        response = requests.get(f"{BASE_URL}/api/boards/{board_id}", headers=headers)
        if response.status_code == 200:
            board_data = response.json()
            print(f"✓ 看板数据获取成功")
            print(f"  - 看板名称: {board_data['name']}")
            print(f"  - 列表数量: {len(board_data['lists'])}")
            total_cards = sum(len(list_obj['cards']) for list_obj in board_data['lists'])
            print(f"  - 卡片总数: {total_cards}")
        else:
            print(f"✗ 获取看板数据失败: {response.text}")
            return False
    except Exception as e:
        print(f"✗ 获取看板数据请求失败: {e}")
        return False
    
    # 5. 更新卡片状态
    print("5. 更新卡片状态...")
    if card_ids:
        try:
            update_data = {"completed": True}
            response = requests.put(f"{BASE_URL}/api/cards/{card_ids[0]}", json=update_data, headers=headers)
            if response.status_code == 200:
                print("✓ 卡片状态更新成功")
            else:
                print(f"✗ 卡片状态更新失败: {response.text}")
                return False
        except Exception as e:
            print(f"✗ 更新卡片状态请求失败: {e}")
            return False
    
    print("✓ 项目管理功能测试完成")
    return True

def main():
    print("🚀 开始测试项目管理功能")
    print("="*50)
    
    # 测试认证
    token = test_auth()
    if not token:
        print("\n❌ 认证测试失败，无法继续")
        sys.exit(1)
    
    # 测试项目管理功能
    success = test_project_management(token)
    
    print("\n" + "="*50)
    if success:
        print("🎉 所有测试通过！项目管理功能工作正常")
    else:
        print("❌ 测试失败，请检查实现")
        sys.exit(1)

if __name__ == "__main__":
    main()