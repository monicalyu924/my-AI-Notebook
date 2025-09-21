import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
  Search,
  FileText,
  FolderPlus,
  Settings,
  MessageCircle,
  Clock,
  ListTodo,
  Plus,
  Hash,
  ArrowRight,
  Trash2,
  Edit,
  Kanban,
  Brain
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const CommandPalette = ({ isOpen, onClose, onViewChange }) => {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef(null);
  const navigate = useNavigate();

  // 重置状态当面板开启/关闭时
  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setSelectedIndex(0);
      inputRef.current?.focus();
    }
  }, [isOpen]);

  // 生成所有可用的命令
  const commands = useMemo(() => {
    const allCommands = [];

    // 导航命令
    const navigationCommands = [
      {
        id: 'nav-workspace',
        title: '切换到AI工作台',
        subtitle: '智能工作台和AI工作流',
        icon: Brain,
        action: () => onViewChange('workspace'),
        category: '导航'
      },
      {
        id: 'nav-notes',
        title: '切换到笔记',
        subtitle: '查看和编辑笔记',
        icon: FileText,
        action: () => onViewChange('notes'),
        category: '导航'
      },
      {
        id: 'nav-todos',
        title: '切换到待办',
        subtitle: '管理待办事项',
        icon: ListTodo,
        action: () => onViewChange('todos'),
        category: '导航'
      },
      {
        id: 'nav-projects',
        title: '切换到项目管理',
        subtitle: '管理项目看板和任务',
        icon: Kanban,
        action: () => onViewChange('projects'),
        category: '导航'
      },
      {
        id: 'nav-chat',
        title: '切换到AI聊天',
        subtitle: '与AI助手对话',
        icon: MessageCircle,
        action: () => onViewChange('chat'),
        category: '导航'
      },
      {
        id: 'nav-pomodoro',
        title: '切换到番茄钟',
        subtitle: '专注时间管理',
        icon: Clock,
        action: () => onViewChange('pomodoro'),
        category: '导航'
      },
      {
        id: 'nav-settings',
        title: '打开设置',
        subtitle: '配置应用设置',
        icon: Settings,
        action: () => navigate('/settings'),
        category: '导航'
      }
    ];

    // 创建命令
    const createCommands = [
      {
        id: 'create-note',
        title: '新建笔记',
        subtitle: '创建一篇新笔记',
        icon: Plus,
        action: () => {
          onViewChange('notes');
          // 这里可以触发创建新笔记的逻辑
        },
        category: '创建'
      },
      {
        id: 'create-folder',
        title: '新建文件夹',
        subtitle: '创建新的文件夹',
        icon: FolderPlus,
        action: () => {
          onViewChange('notes');
          // 这里可以触发创建新文件夹的逻辑
        },
        category: '创建'
      },
      {
        id: 'create-todo',
        title: '新建待办',
        subtitle: '添加新的待办事项',
        icon: Plus,
        action: () => {
          onViewChange('todos');
          // 这里可以触发创建新待办的逻辑
        },
        category: '创建'
      }
    ];

    allCommands.push(...navigationCommands, ...createCommands);

    return allCommands;
  }, [onViewChange, navigate]);

  // 过滤命令
  const filteredCommands = useMemo(() => {
    if (!query.trim()) {
      return commands;
    }

    const searchQuery = query.toLowerCase();
    return commands.filter(command => 
      command.title.toLowerCase().includes(searchQuery) ||
      command.subtitle.toLowerCase().includes(searchQuery) ||
      command.category.toLowerCase().includes(searchQuery)
    );
  }, [commands, query]);

  // 按类别分组
  const groupedCommands = useMemo(() => {
    const groups = {};
    filteredCommands.forEach(command => {
      const category = command.category;
      if (!groups[category]) {
        groups[category] = [];
      }
      groups[category].push(command);
    });
    return groups;
  }, [filteredCommands]);

  // 键盘导航
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!isOpen) return;

      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          setSelectedIndex(prev => 
            prev < filteredCommands.length - 1 ? prev + 1 : 0
          );
          break;
        case 'ArrowUp':
          e.preventDefault();
          setSelectedIndex(prev => 
            prev > 0 ? prev - 1 : filteredCommands.length - 1
          );
          break;
        case 'Enter':
          e.preventDefault();
          const selectedCommand = filteredCommands[selectedIndex];
          if (selectedCommand) {
            selectedCommand.action();
            onClose();
          }
          break;
        case 'Escape':
          e.preventDefault();
          onClose();
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, filteredCommands, selectedIndex, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh] px-4">
      {/* 背景遮罩 */}
      <div 
        className="absolute inset-0 bg-black bg-opacity-50 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* 命令面板 */}
      <div className="relative w-full max-w-2xl bg-white rounded-xl shadow-2xl border border-gray-200 overflow-hidden">
        {/* 搜索输入 */}
        <div className="flex items-center px-4 py-3 border-b border-gray-200">
          <Search className="h-5 w-5 text-gray-400 mr-3" />
          <input
            ref={inputRef}
            type="text"
            placeholder="输入命令或搜索内容..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="flex-1 text-lg outline-none placeholder-gray-500"
          />
          <div className="text-xs text-gray-400 ml-2">
            <kbd className="px-2 py-1 bg-gray-100 rounded text-xs">ESC</kbd>
          </div>
        </div>

        {/* 命令列表 */}
        <div className="max-h-96 overflow-y-auto">
          {Object.keys(groupedCommands).length === 0 ? (
            <div className="px-4 py-8 text-center text-gray-500">
              <Search className="h-8 w-8 mx-auto mb-2 text-gray-300" />
              <p>没有找到匹配的命令</p>
            </div>
          ) : (
            <div className="py-2">
              {Object.entries(groupedCommands).map(([category, categoryCommands]) => (
                <div key={category}>
                  {/* 类别标题 */}
                  <div className="px-4 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                    {category}
                  </div>
                  
                  {/* 该类别的命令 */}
                  {categoryCommands.map((command, index) => {
                    const globalIndex = filteredCommands.indexOf(command);
                    const isSelected = globalIndex === selectedIndex;
                    
                    return (
                      <button
                        key={command.id}
                        onClick={() => {
                          command.action();
                          onClose();
                        }}
                        className={`w-full flex items-center px-4 py-2 text-left hover:bg-gray-50 transition-colors ${
                          isSelected ? 'bg-blue-50 border-r-2 border-blue-500' : ''
                        }`}
                      >
                        <div className="flex items-center justify-center w-8 h-8 mr-3">
                          <command.icon className={`h-4 w-4 ${isSelected ? 'text-blue-600' : 'text-gray-400'}`} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className={`font-medium truncate ${isSelected ? 'text-blue-900' : 'text-gray-900'}`}>
                            {command.title}
                          </div>
                          <div className={`text-sm truncate ${isSelected ? 'text-blue-600' : 'text-gray-500'}`}>
                            {command.subtitle}
                          </div>
                        </div>
                        {isSelected && (
                          <ArrowRight className="h-4 w-4 text-blue-600 ml-2" />
                        )}
                      </button>
                    );
                  })}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 底部提示 */}
        <div className="px-4 py-2 bg-gray-50 border-t border-gray-200 flex items-center justify-between text-xs text-gray-500">
          <div className="flex space-x-4">
            <span>
              <kbd className="px-2 py-1 bg-white rounded border text-xs">↑↓</kbd> 导航
            </span>
            <span>
              <kbd className="px-2 py-1 bg-white rounded border text-xs">Enter</kbd> 选择
            </span>
            <span>
              <kbd className="px-2 py-1 bg-white rounded border text-xs">ESC</kbd> 关闭
            </span>
          </div>
          <div>
            {filteredCommands.length} 个结果
          </div>
        </div>
      </div>
    </div>
  );
};

export default CommandPalette;