import React, { useMemo } from 'react';
import { useNotes } from '../../context/NotesContext';
import {
  FileText,
  Hash,
  TrendingUp,
  Calendar,
  BarChart3,
  Tag as TagIcon
} from 'lucide-react';
import { format, parseISO, startOfWeek, startOfMonth, isAfter } from 'date-fns';
import { zhCN } from 'date-fns/locale';

const NotesStatistics = () => {
  const { notes } = useNotes();

  // 计算统计数据
  const statistics = useMemo(() => {
    if (!notes || notes.length === 0) {
      return {
        totalNotes: 0,
        totalWords: 0,
        totalTags: 0,
        uniqueTags: [],
        tagCounts: {},
        notesThisWeek: 0,
        notesThisMonth: 0,
        avgWordsPerNote: 0
      };
    }

    let totalWords = 0;
    const tagCounts = {};
    const now = new Date();
    const weekStart = startOfWeek(now, { locale: zhCN });
    const monthStart = startOfMonth(now);
    let notesThisWeek = 0;
    let notesThisMonth = 0;

    notes.forEach(note => {
      // 计算字数
      const content = note.content || '';
      const plainText = content.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();
      totalWords += plainText.split(' ').length;

      // 统计标签
      if (note.tags && Array.isArray(note.tags)) {
        note.tags.forEach(tag => {
          tagCounts[tag] = (tagCounts[tag] || 0) + 1;
        });
      }

      // 统计本周和本月笔记
      try {
        const createdAt = parseISO(note.created_at);
        if (isAfter(createdAt, weekStart)) {
          notesThisWeek++;
        }
        if (isAfter(createdAt, monthStart)) {
          notesThisMonth++;
        }
      } catch (e) {
        console.error('Error parsing date:', e);
      }
    });

    const uniqueTags = Object.keys(tagCounts);
    const avgWordsPerNote = notes.length > 0 ? Math.round(totalWords / notes.length) : 0;

    return {
      totalNotes: notes.length,
      totalWords,
      totalTags: uniqueTags.length,
      uniqueTags,
      tagCounts,
      notesThisWeek,
      notesThisMonth,
      avgWordsPerNote
    };
  }, [notes]);

  // 获取最常用的标签（前5个）
  const topTags = useMemo(() => {
    return Object.entries(statistics.tagCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);
  }, [statistics.tagCounts]);

  const StatCard = ({ icon: Icon, label, value, color = 'blue', trend }) => (
    <div className="bg-white rounded-xl p-4 border border-gray-200 hover:shadow-lg transition-shadow">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm text-gray-600 mb-1">{label}</p>
          <p className="text-2xl font-bold text-gray-900">{value}</p>
          {trend && (
            <p className="text-xs text-gray-500 mt-1 flex items-center gap-1">
              <TrendingUp className="w-3 h-3" />
              {trend}
            </p>
          )}
        </div>
        <div className={`p-3 rounded-lg bg-${color}-50`}>
          <Icon className={`w-6 h-6 text-${color}-600`} />
        </div>
      </div>
    </div>
  );

  return (
    <div className="p-6 space-y-6">
      {/* 标题 */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">笔记统计</h2>
        <BarChart3 className="w-6 h-6 text-gray-400" />
      </div>

      {/* 主要统计卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={FileText}
          label="总笔记数"
          value={statistics.totalNotes}
          color="blue"
          trend={`本周新增 ${statistics.notesThisWeek} 篇`}
        />
        <StatCard
          icon={Hash}
          label="总字数"
          value={statistics.totalWords.toLocaleString()}
          color="green"
          trend={`平均 ${statistics.avgWordsPerNote} 字/篇`}
        />
        <StatCard
          icon={TagIcon}
          label="标签数量"
          value={statistics.totalTags}
          color="purple"
        />
        <StatCard
          icon={Calendar}
          label="本月笔记"
          value={statistics.notesThisMonth}
          color="amber"
        />
      </div>

      {/* 热门标签 */}
      {topTags.length > 0 && (
        <div className="bg-white rounded-xl p-6 border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <TagIcon className="w-5 h-5 text-purple-600" />
            热门标签
          </h3>
          <div className="space-y-3">
            {topTags.map(([tag, count], index) => {
              const percentage = (count / statistics.totalNotes) * 100;
              return (
                <div key={tag} className="space-y-1">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium text-gray-700">#{tag}</span>
                    <span className="text-gray-500">{count} 篇</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-gradient-to-r from-purple-500 to-pink-500 h-2 rounded-full transition-all duration-500"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 创作活跃度 */}
      <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-6 border border-blue-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-blue-600" />
          创作活跃度
        </h3>
        <div className="grid grid-cols-2 gap-4">
          <div className="text-center">
            <p className="text-3xl font-bold text-blue-600">{statistics.notesThisWeek}</p>
            <p className="text-sm text-gray-600 mt-1">本周新增</p>
          </div>
          <div className="text-center">
            <p className="text-3xl font-bold text-indigo-600">{statistics.notesThisMonth}</p>
            <p className="text-sm text-gray-600 mt-1">本月新增</p>
          </div>
        </div>
      </div>

      {/* 空状态 */}
      {notes.length === 0 && (
        <div className="text-center py-12">
          <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">暂无笔记数据</p>
          <p className="text-sm text-gray-400 mt-2">创建第一篇笔记开始记录吧！</p>
        </div>
      )}
    </div>
  );
};

export default React.memo(NotesStatistics);
