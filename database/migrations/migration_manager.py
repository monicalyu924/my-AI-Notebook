#!/usr/bin/env python3
"""
数据库迁移管理器
支持版本化的数据库模式迁移
"""

import os
import sys
import argparse
import logging
import hashlib
import datetime
from typing import List, Dict, Optional
from pathlib import Path

import psycopg2
import psycopg2.extras
from psycopg2 import sql

# 配置日志
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('/var/log/ai-notebook/migrations.log'),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)


class MigrationManager:
    """数据库迁移管理器"""
    
    def __init__(self, database_url: str, migrations_dir: str = "migrations"):
        self.database_url = database_url
        self.migrations_dir = Path(migrations_dir)
        self.connection = None
        self.migrations_table = "schema_migrations"
        
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
            
    def create_migrations_table(self):
        """创建迁移记录表"""
        try:
            with self.connection.cursor() as cursor:
                cursor.execute(f"""
                    CREATE TABLE IF NOT EXISTS {self.migrations_table} (
                        id SERIAL PRIMARY KEY,
                        version VARCHAR(255) NOT NULL UNIQUE,
                        name VARCHAR(255) NOT NULL,
                        checksum VARCHAR(64) NOT NULL,
                        applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                        applied_by VARCHAR(100) DEFAULT CURRENT_USER,
                        execution_time INTEGER,
                        success BOOLEAN DEFAULT TRUE
                    )
                """)
                self.connection.commit()
                logger.info("迁移记录表创建成功")
        except psycopg2.Error as e:
            logger.error(f"创建迁移记录表失败: {e}")
            self.connection.rollback()
            raise
            
    def get_applied_migrations(self) -> List[Dict]:
        """获取已应用的迁移"""
        try:
            with self.connection.cursor(cursor_factory=psycopg2.extras.RealDictCursor) as cursor:
                cursor.execute(f"""
                    SELECT version, name, checksum, applied_at, success
                    FROM {self.migrations_table}
                    ORDER BY version
                """)
                return cursor.fetchall()
        except psycopg2.Error as e:
            logger.error(f"获取已应用迁移失败: {e}")
            return []
            
    def get_pending_migrations(self) -> List[Dict]:
        """获取待应用的迁移"""
        all_migrations = self.scan_migration_files()
        applied_versions = {m['version'] for m in self.get_applied_migrations() if m['success']}
        
        pending = []
        for migration in all_migrations:
            if migration['version'] not in applied_versions:
                pending.append(migration)
                
        return sorted(pending, key=lambda x: x['version'])
        
    def scan_migration_files(self) -> List[Dict]:
        """扫描迁移文件"""
        migrations = []
        
        if not self.migrations_dir.exists():
            logger.warning(f"迁移目录不存在: {self.migrations_dir}")
            return migrations
            
        for file_path in self.migrations_dir.glob("*.sql"):
            # 解析文件名: V001__create_users_table.sql
            filename = file_path.name
            if not filename.startswith('V') or '__' not in filename:
                logger.warning(f"跳过无效的迁移文件: {filename}")
                continue
                
            try:
                version_part, name_part = filename.split('__', 1)
                version = version_part[1:]  # 移除 'V' 前缀
                name = name_part.replace('.sql', '').replace('_', ' ')
                
                # 计算文件校验和
                content = file_path.read_text(encoding='utf-8')
                checksum = hashlib.sha256(content.encode('utf-8')).hexdigest()
                
                migrations.append({
                    'version': version,
                    'name': name,
                    'filename': filename,
                    'filepath': file_path,
                    'checksum': checksum,
                    'content': content
                })
            except Exception as e:
                logger.error(f"解析迁移文件失败 {filename}: {e}")
                
        return sorted(migrations, key=lambda x: x['version'])
        
    def validate_migration_checksum(self, migration: Dict) -> bool:
        """验证迁移文件校验和"""
        applied_migrations = {m['version']: m for m in self.get_applied_migrations()}
        
        if migration['version'] in applied_migrations:
            applied_checksum = applied_migrations[migration['version']]['checksum']
            if applied_checksum != migration['checksum']:
                logger.error(f"迁移 {migration['version']} 校验和不匹配!")
                logger.error(f"期望: {applied_checksum}")
                logger.error(f"实际: {migration['checksum']}")
                return False
                
        return True
        
    def apply_migration(self, migration: Dict) -> bool:
        """应用单个迁移"""
        logger.info(f"应用迁移 {migration['version']}: {migration['name']}")
        
        start_time = datetime.datetime.now()
        
        try:
            with self.connection.cursor() as cursor:
                # 开始事务
                cursor.execute("BEGIN")
                
                # 执行迁移SQL
                cursor.execute(migration['content'])
                
                # 记录迁移
                execution_time = int((datetime.datetime.now() - start_time).total_seconds() * 1000)
                cursor.execute(f"""
                    INSERT INTO {self.migrations_table}
                    (version, name, checksum, execution_time)
                    VALUES (%s, %s, %s, %s)
                """, (
                    migration['version'],
                    migration['name'],
                    migration['checksum'],
                    execution_time
                ))
                
                # 提交事务
                cursor.execute("COMMIT")
                logger.info(f"迁移 {migration['version']} 应用成功 (耗时: {execution_time}ms)")
                return True
                
        except psycopg2.Error as e:
            logger.error(f"迁移 {migration['version']} 应用失败: {e}")
            try:
                with self.connection.cursor() as cursor:
                    cursor.execute("ROLLBACK")
                    # 记录失败的迁移
                    execution_time = int((datetime.datetime.now() - start_time).total_seconds() * 1000)
                    cursor.execute(f"""
                        INSERT INTO {self.migrations_table}
                        (version, name, checksum, execution_time, success)
                        VALUES (%s, %s, %s, %s, %s)
                    """, (
                        migration['version'],
                        migration['name'],
                        migration['checksum'],
                        execution_time,
                        False
                    ))
                    self.connection.commit()
            except:
                pass
            return False
            
    def migrate(self, target_version: Optional[str] = None) -> bool:
        """执行迁移"""
        logger.info("开始数据库迁移...")
        
        # 创建迁移记录表
        self.create_migrations_table()
        
        # 获取待应用的迁移
        pending_migrations = self.get_pending_migrations()
        
        if not pending_migrations:
            logger.info("没有待应用的迁移")
            return True
            
        # 过滤到目标版本
        if target_version:
            pending_migrations = [
                m for m in pending_migrations
                if m['version'] <= target_version
            ]
            
        logger.info(f"发现 {len(pending_migrations)} 个待应用的迁移")
        
        # 验证所有迁移的校验和
        for migration in pending_migrations:
            if not self.validate_migration_checksum(migration):
                return False
                
        # 应用迁移
        success_count = 0
        for migration in pending_migrations:
            if self.apply_migration(migration):
                success_count += 1
            else:
                logger.error("迁移过程中出现错误，停止执行")
                break
                
        logger.info(f"迁移完成: {success_count}/{len(pending_migrations)} 个迁移成功应用")
        return success_count == len(pending_migrations)
        
    def status(self):
        """显示迁移状态"""
        logger.info("=== 数据库迁移状态 ===")
        
        applied_migrations = self.get_applied_migrations()
        pending_migrations = self.get_pending_migrations()
        
        logger.info(f"已应用迁移: {len(applied_migrations)}")
        for migration in applied_migrations:
            status = "✓" if migration['success'] else "✗"
            logger.info(f"  {status} {migration['version']}: {migration['name']} ({migration['applied_at']})")
            
        logger.info(f"待应用迁移: {len(pending_migrations)}")
        for migration in pending_migrations:
            logger.info(f"  ○ {migration['version']}: {migration['name']}")
            
    def rollback(self, target_version: str):
        """回滚到指定版本（如果支持）"""
        logger.warning("回滚功能需要手动实现回滚脚本")
        logger.info(f"要回滚到版本 {target_version}，请手动执行相应的回滚SQL")
        
    def create_migration(self, name: str) -> str:
        """创建新的迁移文件"""
        # 生成版本号
        existing_migrations = self.scan_migration_files()
        if existing_migrations:
            latest_version = max(int(m['version']) for m in existing_migrations)
            new_version = f"{latest_version + 1:03d}"
        else:
            new_version = "001"
            
        # 生成文件名
        clean_name = name.lower().replace(' ', '_').replace('-', '_')
        filename = f"V{new_version}__{clean_name}.sql"
        filepath = self.migrations_dir / filename
        
        # 创建目录
        self.migrations_dir.mkdir(parents=True, exist_ok=True)
        
        # 创建模板文件
        template = f"""-- 迁移版本: {new_version}
-- 迁移名称: {name}
-- 创建时间: {datetime.datetime.now().isoformat()}
-- 描述: {name}

-- 在此处编写您的SQL语句
-- 例如:
-- CREATE TABLE example (
--     id SERIAL PRIMARY KEY,
--     name VARCHAR(255) NOT NULL,
--     created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
-- );

"""
        
        filepath.write_text(template, encoding='utf-8')
        logger.info(f"迁移文件已创建: {filepath}")
        return str(filepath)


def main():
    """主函数"""
    parser = argparse.ArgumentParser(description='数据库迁移管理器')
    parser.add_argument('--database-url', required=True, help='数据库连接URL')
    parser.add_argument('--migrations-dir', default='migrations', help='迁移文件目录')
    
    subparsers = parser.add_subparsers(dest='command', help='可用命令')
    
    # 迁移命令
    migrate_parser = subparsers.add_parser('migrate', help='执行数据库迁移')
    migrate_parser.add_argument('--target', help='目标版本')
    
    # 状态命令
    subparsers.add_parser('status', help='显示迁移状态')
    
    # 回滚命令
    rollback_parser = subparsers.add_parser('rollback', help='回滚到指定版本')
    rollback_parser.add_argument('version', help='目标版本')
    
    # 创建迁移命令
    create_parser = subparsers.add_parser('create', help='创建新的迁移文件')
    create_parser.add_argument('name', help='迁移名称')
    
    args = parser.parse_args()
    
    if not args.command:
        parser.print_help()
        return
        
    # 创建迁移管理器
    manager = MigrationManager(args.database_url, args.migrations_dir)
    
    try:
        if args.command == 'create':
            # 创建迁移不需要数据库连接
            manager.create_migration(args.name)
        else:
            # 连接数据库
            manager.connect()
            
            if args.command == 'migrate':
                success = manager.migrate(args.target)
                sys.exit(0 if success else 1)
            elif args.command == 'status':
                manager.status()
            elif args.command == 'rollback':
                manager.rollback(args.version)
                
    except Exception as e:
        logger.error(f"执行失败: {e}")
        sys.exit(1)
    finally:
        manager.disconnect()


if __name__ == '__main__':
    main()