#!/bin/bash

# 性能测试运行脚本
# 执行各种类型的性能测试和压力测试

set -e

# 颜色输出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

echo_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

echo_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

echo_debug() {
    echo -e "${BLUE}[DEBUG]${NC} $1"
}

# 配置变量
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
TESTS_DIR="$PROJECT_ROOT/tests/performance"
REPORTS_DIR="$PROJECT_ROOT/reports/performance"
ENV_FILE="$PROJECT_ROOT/.env"

# 测试配置
TEST_TARGET_URL="${TEST_TARGET_URL:-http://localhost:8000}"
TEST_DURATION="${TEST_DURATION:-300}"
TEST_USERS="${TEST_USERS:-50}"
SPAWN_RATE="${SPAWN_RATE:-5}"

# 检查环境
check_environment() {
    echo_info "检查性能测试环境..."
    
    # 检查Python和依赖
    if ! command -v python3 &> /dev/null; then
        echo_error "Python3未安装"
        exit 1
    fi
    
    # 检查locust
    if ! python3 -c "import locust" &> /dev/null; then
        echo_warn "Locust未安装，尝试安装..."
        pip3 install locust || {
            echo_error "Locust安装失败"
            exit 1
        }
    fi
    
    # 检查其他依赖
    local deps=("requests" "psutil" "matplotlib" "pandas")
    for dep in "${deps[@]}"; do
        if ! python3 -c "import $dep" &> /dev/null; then
            echo_warn "$dep未安装，尝试安装..."
            pip3 install "$dep" || echo_warn "$dep安装失败，某些功能可能不可用"
        fi
    done
    
    # 检查目标服务
    echo_info "检查目标服务: $TEST_TARGET_URL"
    if ! curl -s -f "$TEST_TARGET_URL/health" > /dev/null; then
        echo_error "目标服务不可访问: $TEST_TARGET_URL"
        echo_info "请确保应用正在运行"
        exit 1
    fi
    
    # 创建报告目录
    mkdir -p "$REPORTS_DIR"
    
    echo_info "环境检查通过"
}

# 准备测试数据
prepare_test_data() {
    echo_info "准备测试数据..."
    
    # 创建测试用户
    python3 << 'EOF'
import requests
import json

base_url = "$TEST_TARGET_URL"

# 创建测试用户
for i in range(1, 101):
    user_data = {
        "username": f"testuser_{i:03d}",
        "email": f"test_{i:03d}@example.com",
        "password": "test123456",
        "first_name": "Test",
        "last_name": f"User{i:03d}"
    }
    
    try:
        response = requests.post(f"{base_url}/api/auth/register", json=user_data)
        if response.status_code in [200, 201]:
            print(f"创建用户: testuser_{i:03d}")
        elif response.status_code == 409:
            print(f"用户已存在: testuser_{i:03d}")
    except Exception as e:
        print(f"创建用户失败: {e}")
        
print("测试数据准备完成")
EOF

    echo_info "测试数据准备完成"
}

# 运行基准测试
run_baseline_test() {
    echo_info "运行基准测试..."
    
    local report_file="$REPORTS_DIR/baseline_$(date +%Y%m%d_%H%M%S).html"
    
    cd "$TESTS_DIR"
    
    locust \
        -f load_test.py \
        --host="$TEST_TARGET_URL" \
        --users=10 \
        --spawn-rate=2 \
        --run-time=60s \
        --html="$report_file" \
        --headless \
        --only-summary
        
    echo_info "基准测试完成，报告: $report_file"
}

# 运行负载测试
run_load_test() {
    local test_type=${1:-"medium"}
    echo_info "运行负载测试: $test_type"
    
    local report_file="$REPORTS_DIR/load_${test_type}_$(date +%Y%m%d_%H%M%S).html"
    local csv_file="$REPORTS_DIR/load_${test_type}_$(date +%Y%m%d_%H%M%S).csv"
    
    # 根据测试类型设置参数
    case "$test_type" in
        "light")
            users=10
            spawn_rate=2
            duration=180
            ;;
        "medium")
            users=50
            spawn_rate=5
            duration=300
            ;;
        "heavy")
            users=100
            spawn_rate=10
            duration=300
            ;;
        "extreme")
            users=200
            spawn_rate=20
            duration=180
            ;;
        *)
            users=$TEST_USERS
            spawn_rate=$SPAWN_RATE
            duration=$TEST_DURATION
            ;;
    esac
    
    echo_info "测试参数: $users用户, ${spawn_rate}/秒, ${duration}秒"
    
    cd "$TESTS_DIR"
    
    locust \
        -f load_test.py \
        --host="$TEST_TARGET_URL" \
        --users="$users" \
        --spawn-rate="$spawn_rate" \
        --run-time="${duration}s" \
        --html="$report_file" \
        --csv="$REPORTS_DIR/load_${test_type}_$(date +%Y%m%d_%H%M%S)" \
        --headless \
        --only-summary
        
    echo_info "负载测试完成，报告: $report_file"
}

# 运行压力测试
run_stress_test() {
    echo_info "运行压力测试..."
    
    local report_file="$REPORTS_DIR/stress_$(date +%Y%m%d_%H%M%S).html"
    
    cd "$TESTS_DIR"
    
    # 渐进式压力测试
    python3 load_test.py stress > "$REPORTS_DIR/stress_$(date +%Y%m%d_%H%M%S).log" 2>&1
    
    echo_info "压力测试完成，日志: $REPORTS_DIR/stress_$(date +%Y%m%d_%H%M%S).log"
}

# 运行数据库性能测试
run_database_test() {
    echo_info "运行数据库性能测试..."
    
    if [ -z "$DATABASE_URL" ]; then
        if [ -f "$ENV_FILE" ]; then
            source "$ENV_FILE"
        fi
    fi
    
    if [ -z "$DATABASE_URL" ]; then
        echo_warn "DATABASE_URL未设置，跳过数据库测试"
        return
    fi
    
    # 创建数据库测试脚本
    cat > "$TESTS_DIR/db_test.py" << 'EOF'
#!/usr/bin/env python3
import psycopg2
import time
import statistics
import concurrent.futures
import os

def test_connection_pool():
    """测试连接池性能"""
    database_url = os.environ.get('DATABASE_URL')
    if not database_url:
        print("DATABASE_URL未设置")
        return
        
    def query_test(query_id):
        try:
            conn = psycopg2.connect(database_url)
            cursor = conn.cursor()
            
            start_time = time.time()
            cursor.execute("SELECT COUNT(*) FROM notes WHERE id > %s", (query_id % 1000,))
            result = cursor.fetchone()
            end_time = time.time()
            
            conn.close()
            return end_time - start_time
        except Exception as e:
            print(f"查询失败: {e}")
            return None
    
    # 并发查询测试
    print("开始数据库并发查询测试...")
    with concurrent.futures.ThreadPoolExecutor(max_workers=20) as executor:
        futures = [executor.submit(query_test, i) for i in range(100)]
        times = [f.result() for f in concurrent.futures.as_completed(futures) if f.result()]
    
    if times:
        print(f"查询次数: {len(times)}")
        print(f"平均查询时间: {statistics.mean(times):.4f}秒")
        print(f"中位数查询时间: {statistics.median(times):.4f}秒")
        print(f"最快查询时间: {min(times):.4f}秒")
        print(f"最慢查询时间: {max(times):.4f}秒")

if __name__ == "__main__":
    test_connection_pool()
EOF
    
    cd "$TESTS_DIR"
    DATABASE_URL="$DATABASE_URL" python3 db_test.py > "$REPORTS_DIR/database_$(date +%Y%m%d_%H%M%S).log"
    
    echo_info "数据库性能测试完成"
}

# 监控系统资源
monitor_resources() {
    echo_info "开始监控系统资源..."
    
    local monitor_file="$REPORTS_DIR/resources_$(date +%Y%m%d_%H%M%S).log"
    local duration=${1:-300}
    
    # 创建资源监控脚本
    cat > "$TESTS_DIR/monitor.py" << 'EOF'
import psutil
import time
import json
import sys

duration = int(sys.argv[1]) if len(sys.argv) > 1 else 300
interval = 5

print(f"开始监控系统资源，持续{duration}秒...")

data = []
start_time = time.time()

while time.time() - start_time < duration:
    timestamp = time.time()
    
    # CPU使用率
    cpu_percent = psutil.cpu_percent(interval=1)
    
    # 内存使用率
    memory = psutil.virtual_memory()
    
    # 磁盘IO
    disk_io = psutil.disk_io_counters()
    
    # 网络IO
    network_io = psutil.net_io_counters()
    
    # 系统负载
    load_avg = psutil.getloadavg()
    
    record = {
        'timestamp': timestamp,
        'cpu_percent': cpu_percent,
        'memory_percent': memory.percent,
        'memory_used': memory.used,
        'memory_available': memory.available,
        'disk_read_bytes': disk_io.read_bytes if disk_io else 0,
        'disk_write_bytes': disk_io.write_bytes if disk_io else 0,
        'network_sent_bytes': network_io.bytes_sent,
        'network_recv_bytes': network_io.bytes_recv,
        'load_1m': load_avg[0],
        'load_5m': load_avg[1],
        'load_15m': load_avg[2]
    }
    
    data.append(record)
    print(f"CPU: {cpu_percent:.1f}%, 内存: {memory.percent:.1f}%, 负载: {load_avg[0]:.2f}")
    
    time.sleep(interval)

# 输出JSON格式的监控数据
print("\n监控数据:")
print(json.dumps(data, indent=2))
EOF
    
    cd "$TESTS_DIR"
    python3 monitor.py "$duration" > "$monitor_file" &
    local monitor_pid=$!
    
    echo_info "资源监控已启动 (PID: $monitor_pid)，日志: $monitor_file"
    echo "$monitor_pid" > "$REPORTS_DIR/.monitor_pid"
}

# 停止资源监控
stop_monitoring() {
    if [ -f "$REPORTS_DIR/.monitor_pid" ]; then
        local monitor_pid=$(cat "$REPORTS_DIR/.monitor_pid")
        if kill -0 "$monitor_pid" 2>/dev/null; then
            kill "$monitor_pid"
            echo_info "资源监控已停止"
        fi
        rm -f "$REPORTS_DIR/.monitor_pid"
    fi
}

# 生成性能报告
generate_report() {
    echo_info "生成性能测试报告..."
    
    local report_file="$REPORTS_DIR/performance_summary_$(date +%Y%m%d_%H%M%S).html"
    
    # 创建报告生成脚本
    cat > "$TESTS_DIR/generate_report.py" << 'EOF'
import os
import json
import glob
from datetime import datetime

reports_dir = os.environ.get('REPORTS_DIR', './reports')

def generate_html_report():
    """生成HTML性能报告"""
    
    # 查找最新的测试报告
    html_files = glob.glob(f"{reports_dir}/*.html")
    log_files = glob.glob(f"{reports_dir}/*.log")
    csv_files = glob.glob(f"{reports_dir}/*.csv")
    
    html_content = f"""
<!DOCTYPE html>
<html>
<head>
    <title>AI智能记事本性能测试报告</title>
    <meta charset="utf-8">
    <style>
        body {{ font-family: Arial, sans-serif; margin: 40px; }}
        h1, h2 {{ color: #333; }}
        .summary {{ background: #f5f5f5; padding: 20px; border-radius: 5px; }}
        .metric {{ margin: 10px 0; }}
        .good {{ color: green; }}
        .warning {{ color: orange; }}
        .error {{ color: red; }}
        table {{ border-collapse: collapse; width: 100%; }}
        th, td {{ border: 1px solid #ddd; padding: 8px; text-align: left; }}
        th {{ background-color: #f2f2f2; }}
    </style>
</head>
<body>
    <h1>AI智能记事本性能测试报告</h1>
    <p>生成时间: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}</p>
    
    <div class="summary">
        <h2>测试摘要</h2>
        <div class="metric">测试环境: {os.environ.get('TEST_TARGET_URL', 'localhost')}</div>
        <div class="metric">测试时间: {datetime.now().strftime('%Y-%m-%d')}</div>
        <div class="metric">报告文件数: {len(html_files + log_files + csv_files)}</div>
    </div>
    
    <h2>测试文件</h2>
    <table>
        <tr><th>文件名</th><th>类型</th><th>修改时间</th></tr>
"""
    
    all_files = [(f, 'HTML报告') for f in html_files] + \
                [(f, 'CSV数据') for f in csv_files] + \
                [(f, '日志文件') for f in log_files]
                
    for file_path, file_type in sorted(all_files, key=lambda x: os.path.getmtime(x[0]), reverse=True):
        filename = os.path.basename(file_path)
        mtime = datetime.fromtimestamp(os.path.getmtime(file_path)).strftime('%Y-%m-%d %H:%M:%S')
        html_content += f"<tr><td>{filename}</td><td>{file_type}</td><td>{mtime}</td></tr>\n"
    
    html_content += """
    </table>
    
    <h2>建议</h2>
    <ul>
        <li>定期运行性能测试，监控系统性能变化</li>
        <li>关注响应时间和错误率指标</li>
        <li>在高负载时监控系统资源使用情况</li>
        <li>优化数据库查询和API响应时间</li>
    </ul>
    
</body>
</html>
"""
    
    with open(f"{reports_dir}/performance_summary_{datetime.now().strftime('%Y%m%d_%H%M%S')}.html", 'w', encoding='utf-8') as f:
        f.write(html_content)
    
    print("性能报告已生成")

if __name__ == "__main__":
    generate_html_report()
EOF
    
    cd "$TESTS_DIR"
    REPORTS_DIR="$REPORTS_DIR" python3 generate_report.py
    
    echo_info "性能测试报告生成完成"
}

# 清理测试数据
cleanup_test_data() {
    echo_info "清理测试数据..."
    
    # 删除临时文件
    rm -f "$TESTS_DIR/db_test.py"
    rm -f "$TESTS_DIR/monitor.py"
    rm -f "$TESTS_DIR/generate_report.py"
    
    # 清理旧的报告（保留最近10个）
    cd "$REPORTS_DIR"
    ls -t *.html 2>/dev/null | tail -n +11 | xargs rm -f 2>/dev/null || true
    ls -t *.log 2>/dev/null | tail -n +11 | xargs rm -f 2>/dev/null || true
    ls -t *.csv 2>/dev/null | tail -n +11 | xargs rm -f 2>/dev/null || true
    
    echo_info "清理完成"
}

# 主函数
main() {
    local test_type=${1:-"all"}
    
    echo_info "开始性能测试: $test_type"
    
    check_environment
    
    case "$test_type" in
        "baseline")
            prepare_test_data
            run_baseline_test
            ;;
        "load")
            prepare_test_data
            monitor_resources 360 &
            run_load_test "${2:-medium}"
            stop_monitoring
            ;;
        "stress")
            prepare_test_data
            monitor_resources 600 &
            run_stress_test
            stop_monitoring
            ;;
        "database"|"db")
            run_database_test
            ;;
        "monitor")
            monitor_resources "${2:-300}"
            ;;
        "report")
            generate_report
            ;;
        "cleanup")
            cleanup_test_data
            ;;
        "all")
            prepare_test_data
            
            echo_info "=== 运行基准测试 ==="
            run_baseline_test
            sleep 10
            
            echo_info "=== 运行负载测试 ==="
            monitor_resources 400 &
            run_load_test "light"
            sleep 30
            run_load_test "medium"
            sleep 30
            run_load_test "heavy"
            stop_monitoring
            sleep 10
            
            echo_info "=== 运行数据库测试 ==="
            run_database_test
            sleep 10
            
            echo_info "=== 生成报告 ==="
            generate_report
            
            echo_info "=== 清理 ==="
            cleanup_test_data
            ;;
        *)
            show_help
            ;;
    esac
    
    echo_info "性能测试完成"
}

# 显示帮助信息
show_help() {
    echo "性能测试运行脚本"
    echo ""
    echo "用法: $0 <测试类型> [参数]"
    echo ""
    echo "测试类型:"
    echo "  baseline          运行基准测试"
    echo "  load [level]      运行负载测试 (light|medium|heavy|extreme)"
    echo "  stress            运行压力测试"
    echo "  database|db       运行数据库性能测试"
    echo "  monitor [时间]    监控系统资源"
    echo "  report            生成性能报告"
    echo "  cleanup           清理测试数据"
    echo "  all               运行所有测试"
    echo ""
    echo "环境变量:"
    echo "  TEST_TARGET_URL   测试目标URL (默认: http://localhost:8000)"
    echo "  TEST_DURATION     测试持续时间秒数 (默认: 300)"
    echo "  TEST_USERS        测试用户数 (默认: 50)"
    echo "  SPAWN_RATE        用户生成速率 (默认: 5)"
    echo ""
    echo "示例:"
    echo "  $0 baseline                    # 运行基准测试"
    echo "  $0 load heavy                  # 运行重负载测试"
    echo "  $0 monitor 600                 # 监控10分钟"
    echo "  TEST_USERS=100 $0 load         # 100用户负载测试"
    echo ""
}

# 处理中断信号
trap 'echo_warn "测试被中断"; stop_monitoring; exit 1' INT TERM

# 运行主函数
main "$@"