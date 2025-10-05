#!/usr/bin/env python3
"""
后端API性能测试脚本
测试各个API端点的响应时间和吞吐量
"""

import time
import asyncio
import aiohttp
import statistics
from datetime import datetime
from typing import List, Dict
import json

# 配置
BASE_URL = "http://localhost:8000"
TEST_USER = {
    "email": "test@example.com",
    "password": "testpass123"
}

class PerformanceTest:
    def __init__(self):
        self.results = []
        self.token = None
    
    async def login(self, session: aiohttp.ClientSession):
        """登录获取token"""
        url = f"{BASE_URL}/api/auth/login"
        async with session.post(url, json=TEST_USER) as response:
            if response.status == 200:
                data = await response.json()
                self.token = data.get('access_token')
                return True
            return False
    
    async def test_endpoint(
        self, 
        session: aiohttp.ClientSession,
        method: str,
        endpoint: str,
        data: dict = None,
        name: str = None
    ) -> Dict:
        """测试单个端点"""
        url = f"{BASE_URL}{endpoint}"
        headers = {}
        if self.token:
            headers['Authorization'] = f"Bearer {self.token}"
        
        start_time = time.time()
        
        try:
            if method.upper() == 'GET':
                async with session.get(url, headers=headers) as response:
                    status = response.status
                    _ = await response.text()
            elif method.upper() == 'POST':
                async with session.post(url, json=data, headers=headers) as response:
                    status = response.status
                    _ = await response.text()
            
            elapsed = (time.time() - start_time) * 1000  # 转换为毫秒
            
            return {
                'name': name or endpoint,
                'method': method,
                'status': status,
                'time': elapsed,
                'success': 200 <= status < 300
            }
        except Exception as e:
            return {
                'name': name or endpoint,
                'method': method,
                'status': 0,
                'time': 0,
                'success': False,
                'error': str(e)
            }
    
    async def concurrent_test(
        self, 
        endpoint: str, 
        method: str = 'GET',
        concurrent_users: int = 10,
        requests_per_user: int = 10,
        data: dict = None
    ):
        """并发测试"""
        print(f"\n🔥 并发测试: {endpoint}")
        print(f"   并发用户: {concurrent_users}")
        print(f"   每用户请求数: {requests_per_user}")
        
        async with aiohttp.ClientSession() as session:
            # 先登录
            if not await self.login(session):
                print("❌ 登录失败")
                return
            
            # 创建并发任务
            tasks = []
            for _ in range(concurrent_users * requests_per_user):
                task = self.test_endpoint(session, method, endpoint, data)
                tasks.append(task)
            
            # 执行并发请求
            start_time = time.time()
            results = await asyncio.gather(*tasks)
            total_time = time.time() - start_time
            
            # 分析结果
            times = [r['time'] for r in results if r['success']]
            success_count = sum(1 for r in results if r['success'])
            
            if times:
                print(f"\n📊 测试结果:")
                print(f"   总请求数: {len(results)}")
                print(f"   成功数: {success_count}")
                print(f"   失败数: {len(results) - success_count}")
                print(f"   成功率: {success_count/len(results)*100:.1f}%")
                print(f"   总耗时: {total_time:.2f}秒")
                print(f"   吞吐量: {len(results)/total_time:.1f} req/s")
                print(f"\n   响应时间统计:")
                print(f"   - 最小值: {min(times):.2f}ms")
                print(f"   - 最大值: {max(times):.2f}ms")
                print(f"   - 平均值: {statistics.mean(times):.2f}ms")
                print(f"   - 中位数: {statistics.median(times):.2f}ms")
                if len(times) > 1:
                    print(f"   - 标准差: {statistics.stdev(times):.2f}ms")
                
                # 计算百分位数
                sorted_times = sorted(times)
                p50 = sorted_times[int(len(sorted_times) * 0.5)]
                p90 = sorted_times[int(len(sorted_times) * 0.9)]
                p95 = sorted_times[int(len(sorted_times) * 0.95)]
                p99 = sorted_times[int(len(sorted_times) * 0.99)] if len(sorted_times) > 100 else sorted_times[-1]
                
                print(f"\n   百分位数:")
                print(f"   - P50: {p50:.2f}ms")
                print(f"   - P90: {p90:.2f}ms")
                print(f"   - P95: {p95:.2f}ms")
                print(f"   - P99: {p99:.2f}ms")
                
                # 保存结果
                self.results.append({
                    'endpoint': endpoint,
                    'timestamp': datetime.now().isoformat(),
                    'total_requests': len(results),
                    'success_count': success_count,
                    'total_time': total_time,
                    'throughput': len(results)/total_time,
                    'min_time': min(times),
                    'max_time': max(times),
                    'avg_time': statistics.mean(times),
                    'median_time': statistics.median(times),
                    'p90': p90,
                    'p95': p95,
                    'p99': p99
                })
    
    def save_results(self, filename: str = 'performance_results.json'):
        """保存测试结果"""
        with open(filename, 'w', encoding='utf-8') as f:
            json.dump(self.results, f, indent=2, ensure_ascii=False)
        print(f"\n💾 结果已保存到: {filename}")

async def main():
    """主测试流程"""
    print("=" * 60)
    print("🚀 AI记事本 - 后端性能测试")
    print("=" * 60)
    
    tester = PerformanceTest()
    
    # 测试各个端点
    test_cases = [
        {
            'endpoint': '/api/notes',
            'method': 'GET',
            'concurrent_users': 10,
            'requests_per_user': 10
        },
        {
            'endpoint': '/api/auth/login',
            'method': 'POST',
            'concurrent_users': 5,
            'requests_per_user': 5,
            'data': TEST_USER
        },
        {
            'endpoint': '/health',
            'method': 'GET',
            'concurrent_users': 20,
            'requests_per_user': 10
        }
    ]
    
    for test in test_cases:
        await tester.concurrent_test(**test)
        await asyncio.sleep(1)  # 短暂休息避免过载
    
    # 保存结果
    tester.save_results('tests/performance/backend_results.json')
    
    print("\n" + "=" * 60)
    print("✅ 性能测试完成!")
    print("=" * 60)

if __name__ == "__main__":
    asyncio.run(main())
