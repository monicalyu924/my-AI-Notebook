#!/usr/bin/env python3
"""
API性能基准测试
测试各个API端点的性能指标
"""

import asyncio
import aiohttp
import time
import statistics
import json
import argparse
from typing import List, Dict, Tuple
from concurrent.futures import ThreadPoolExecutor
import logging

# 配置日志
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class APIBenchmark:
    """API性能基准测试类"""
    
    def __init__(self, base_url: str, concurrent_users: int = 10):
        self.base_url = base_url.rstrip('/')
        self.concurrent_users = concurrent_users
        self.session = None
        self.auth_token = None
        
    async def setup(self):
        """初始化测试环境"""
        self.session = aiohttp.ClientSession(
            timeout=aiohttp.ClientTimeout(total=30),
            connector=aiohttp.TCPConnector(limit=100)
        )
        
        # 登录获取token
        await self.authenticate()
        
    async def teardown(self):
        """清理测试环境"""
        if self.session:
            await self.session.close()
            
    async def authenticate(self):
        """用户认证"""
        login_data = {
            "username": "demo_user",
            "password": "demo123456"
        }
        
        try:
            async with self.session.post(
                f"{self.base_url}/api/auth/login",
                json=login_data
            ) as response:
                if response.status == 200:
                    data = await response.json()
                    self.auth_token = data.get('access_token')
                    self.session.headers.update({
                        'Authorization': f'Bearer {self.auth_token}'
                    })
                    logger.info("认证成功")
                else:
                    logger.error(f"认证失败: {response.status}")
        except Exception as e:
            logger.error(f"认证异常: {e}")
            
    async def measure_endpoint(self, method: str, endpoint: str, 
                             data: dict = None, 
                             requests_count: int = 100) -> Dict:
        """测量单个端点的性能"""
        url = f"{self.base_url}{endpoint}"
        response_times = []
        status_codes = []
        errors = []
        
        logger.info(f"测试端点: {method} {endpoint} ({requests_count}次请求)")
        
        async def single_request():
            start_time = time.time()
            try:
                if method.upper() == 'GET':
                    async with self.session.get(url) as response:
                        status_codes.append(response.status)
                        await response.text()  # 读取响应内容
                elif method.upper() == 'POST':
                    async with self.session.post(url, json=data) as response:
                        status_codes.append(response.status)
                        await response.text()
                elif method.upper() == 'PUT':
                    async with self.session.put(url, json=data) as response:
                        status_codes.append(response.status)
                        await response.text()
                elif method.upper() == 'DELETE':
                    async with self.session.delete(url) as response:
                        status_codes.append(response.status)
                        await response.text()
                        
            except Exception as e:
                errors.append(str(e))
                status_codes.append(0)
            finally:
                response_times.append((time.time() - start_time) * 1000)
                
        # 并发执行请求
        semaphore = asyncio.Semaphore(self.concurrent_users)
        
        async def limited_request():
            async with semaphore:
                await single_request()
                
        tasks = [limited_request() for _ in range(requests_count)]
        await asyncio.gather(*tasks)
        
        # 计算统计信息
        success_times = [t for t, s in zip(response_times, status_codes) 
                        if 200 <= s < 400]
        
        result = {
            'endpoint': endpoint,
            'method': method,
            'total_requests': requests_count,
            'successful_requests': len(success_times),
            'failed_requests': len(errors),
            'error_rate': len(errors) / requests_count,
            'avg_response_time': statistics.mean(response_times) if response_times else 0,
            'median_response_time': statistics.median(response_times) if response_times else 0,
            'min_response_time': min(response_times) if response_times else 0,
            'max_response_time': max(response_times) if response_times else 0,
            'p95_response_time': self.percentile(response_times, 0.95) if response_times else 0,
            'p99_response_time': self.percentile(response_times, 0.99) if response_times else 0,
            'throughput': len(success_times) / (sum(response_times) / 1000) if response_times else 0,
            'status_codes': dict(zip(*map(list, zip(*[(s, status_codes.count(s)) 
                                                    for s in set(status_codes)]))))
        }
        
        return result
        
    @staticmethod
    def percentile(data: List[float], percentile: float) -> float:
        """计算百分位数"""
        if not data:
            return 0
        sorted_data = sorted(data)
        index = int(len(sorted_data) * percentile)
        return sorted_data[min(index, len(sorted_data) - 1)]
        
    async def benchmark_auth_endpoints(self) -> List[Dict]:
        """基准测试认证相关端点"""
        results = []
        
        # 注册端点
        register_data = {
            "username": f"benchtest_{int(time.time())}",
            "email": f"benchmark_{int(time.time())}@test.com",
            "password": "test123456"
        }
        
        result = await self.measure_endpoint(
            'POST', '/api/auth/register', 
            data=register_data, 
            requests_count=50
        )
        results.append(result)
        
        # 登录端点
        login_data = {
            "username": "demo_user",
            "password": "demo123456"
        }
        
        result = await self.measure_endpoint(
            'POST', '/api/auth/login', 
            data=login_data, 
            requests_count=100
        )
        results.append(result)
        
        return results
        
    async def benchmark_notes_endpoints(self) -> List[Dict]:
        """基准测试笔记相关端点"""
        results = []
        
        # 获取笔记列表
        result = await self.measure_endpoint('GET', '/api/notes', requests_count=200)
        results.append(result)
        
        # 获取单个笔记
        result = await self.measure_endpoint('GET', '/api/notes/1', requests_count=150)
        results.append(result)
        
        # 搜索笔记
        result = await self.measure_endpoint('GET', '/api/notes/search?q=test', requests_count=100)
        results.append(result)
        
        # 创建笔记
        note_data = {
            "title": "基准测试笔记",
            "content": "这是一个用于基准测试的笔记内容。" * 10,
            "status": "draft"
        }
        
        result = await self.measure_endpoint(
            'POST', '/api/notes', 
            data=note_data, 
            requests_count=50
        )
        results.append(result)
        
        return results
        
    async def benchmark_ai_endpoints(self) -> List[Dict]:
        """基准测试AI相关端点"""
        results = []
        
        # AI对话
        chat_data = {
            "message": "请简单介绍一下Python编程语言",
            "model": "gpt-3.5-turbo"
        }
        
        result = await self.measure_endpoint(
            'POST', '/api/ai/chat', 
            data=chat_data, 
            requests_count=20  # AI请求较慢，减少请求数
        )
        results.append(result)
        
        # AI任务
        task_data = {
            "task_type": "summarize",
            "note_id": 1,
            "model": "gpt-3.5-turbo"
        }
        
        result = await self.measure_endpoint(
            'POST', '/api/ai/tasks', 
            data=task_data, 
            requests_count=10
        )
        results.append(result)
        
        return results
        
    async def benchmark_system_endpoints(self) -> List[Dict]:
        """基准测试系统相关端点"""
        results = []
        
        # 健康检查
        result = await self.measure_endpoint('GET', '/health', requests_count=500)
        results.append(result)
        
        # 统计信息
        result = await self.measure_endpoint('GET', '/api/statistics', requests_count=100)
        results.append(result)
        
        # 用户资料
        result = await self.measure_endpoint('GET', '/api/users/profile', requests_count=100)
        results.append(result)
        
        return results
        
    async def run_full_benchmark(self) -> Dict:
        """运行完整的基准测试"""
        logger.info("开始API基准测试...")
        start_time = time.time()
        
        await self.setup()
        
        try:
            all_results = []
            
            # 系统端点测试
            logger.info("测试系统端点...")
            system_results = await self.benchmark_system_endpoints()
            all_results.extend(system_results)
            
            # 认证端点测试
            logger.info("测试认证端点...")
            auth_results = await self.benchmark_auth_endpoints()
            all_results.extend(auth_results)
            
            # 笔记端点测试
            logger.info("测试笔记端点...")
            notes_results = await self.benchmark_notes_endpoints()
            all_results.extend(notes_results)
            
            # AI端点测试
            logger.info("测试AI端点...")
            ai_results = await self.benchmark_ai_endpoints()
            all_results.extend(ai_results)
            
        finally:
            await self.teardown()
            
        total_time = time.time() - start_time
        
        # 生成汇总报告
        summary = self.generate_summary(all_results, total_time)
        
        return {
            'summary': summary,
            'detailed_results': all_results,
            'test_duration': total_time
        }
        
    def generate_summary(self, results: List[Dict], total_time: float) -> Dict:
        """生成测试摘要"""
        total_requests = sum(r['total_requests'] for r in results)
        total_successful = sum(r['successful_requests'] for r in results)
        total_failed = sum(r['failed_requests'] for r in results)
        
        avg_response_times = [r['avg_response_time'] for r in results if r['avg_response_time'] > 0]
        p95_response_times = [r['p95_response_time'] for r in results if r['p95_response_time'] > 0]
        
        summary = {
            'test_duration_seconds': total_time,
            'total_requests': total_requests,
            'successful_requests': total_successful,
            'failed_requests': total_failed,
            'overall_success_rate': total_successful / total_requests if total_requests > 0 else 0,
            'overall_throughput': total_requests / total_time if total_time > 0 else 0,
            'avg_response_time': statistics.mean(avg_response_times) if avg_response_times else 0,
            'avg_p95_response_time': statistics.mean(p95_response_times) if p95_response_times else 0,
            'fastest_endpoint': min(results, key=lambda x: x['avg_response_time'])['endpoint'],
            'slowest_endpoint': max(results, key=lambda x: x['avg_response_time'])['endpoint'],
            'most_reliable_endpoint': max(results, key=lambda x: x['successful_requests'] / x['total_requests'])['endpoint'],
            'least_reliable_endpoint': min(results, key=lambda x: x['successful_requests'] / x['total_requests'])['endpoint']
        }
        
        return summary
        
    def save_results(self, results: Dict, filename: str = None):
        """保存测试结果到文件"""
        if not filename:
            timestamp = int(time.time())
            filename = f"api_benchmark_results_{timestamp}.json"
            
        with open(filename, 'w', encoding='utf-8') as f:
            json.dump(results, f, indent=2, ensure_ascii=False)
            
        logger.info(f"测试结果已保存到: {filename}")
        
    def print_results(self, results: Dict):
        """打印测试结果"""
        summary = results['summary']
        
        print("\n" + "="*60)
        print("API基准测试结果汇总")
        print("="*60)
        print(f"测试时长: {summary['test_duration_seconds']:.2f} 秒")
        print(f"总请求数: {summary['total_requests']}")
        print(f"成功请求: {summary['successful_requests']}")
        print(f"失败请求: {summary['failed_requests']}")
        print(f"成功率: {summary['overall_success_rate']:.2%}")
        print(f"总吞吐量: {summary['overall_throughput']:.2f} 请求/秒")
        print(f"平均响应时间: {summary['avg_response_time']:.2f} ms")
        print(f"95%响应时间: {summary['avg_p95_response_time']:.2f} ms")
        print(f"最快端点: {summary['fastest_endpoint']}")
        print(f"最慢端点: {summary['slowest_endpoint']}")
        print(f"最可靠端点: {summary['most_reliable_endpoint']}")
        print(f"最不可靠端点: {summary['least_reliable_endpoint']}")
        
        print("\n详细结果:")
        print("-"*60)
        for result in results['detailed_results']:
            print(f"{result['method']} {result['endpoint']}")
            print(f"  请求数: {result['total_requests']}, 成功: {result['successful_requests']}")
            print(f"  平均响应时间: {result['avg_response_time']:.2f} ms")
            print(f"  95%响应时间: {result['p95_response_time']:.2f} ms")
            print(f"  错误率: {result['error_rate']:.2%}")
            print(f"  吞吐量: {result['throughput']:.2f} 请求/秒")
            print()


async def main():
    """主函数"""
    parser = argparse.ArgumentParser(description='API性能基准测试')
    parser.add_argument('--base-url', default='http://localhost:8000', 
                       help='API基础URL')
    parser.add_argument('--concurrent-users', type=int, default=10,
                       help='并发用户数')
    parser.add_argument('--output', help='输出文件名')
    
    args = parser.parse_args()
    
    # 创建基准测试实例
    benchmark = APIBenchmark(args.base_url, args.concurrent_users)
    
    # 运行测试
    results = await benchmark.run_full_benchmark()
    
    # 输出结果
    benchmark.print_results(results)
    
    # 保存结果
    if args.output:
        benchmark.save_results(results, args.output)
    else:
        benchmark.save_results(results)


if __name__ == "__main__":
    asyncio.run(main())