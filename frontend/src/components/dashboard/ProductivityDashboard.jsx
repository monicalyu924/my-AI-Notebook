import React, { useEffect, useMemo } from 'react'
import { motion } from 'framer-motion'
import { 
  BarChart3, 
  Clock, 
  FileText, 
  Brain, 
  Target, 
  TrendingUp,
  Calendar,
  Award,
  Zap
} from 'lucide-react'
import { Card, CardHeader, CardTitle, CardContent } from '../ui/Card'
import { useProductivityStore } from '../../store/productivityStore'
import StatCard from './StatCard'
import ProgressChart from './ProgressChart'
import ActivityCalendar from './ActivityCalendar'
import GoalProgress from './GoalProgress'

const ProductivityDashboard = () => {
  const { getDashboardData, updateProductivityScore, updateStreak } = useProductivityStore()
  const dashboardData = getDashboardData()

  useEffect(() => {
    // 定期更新生产力评分和连续天数
    updateProductivityScore()
    updateStreak()
  }, [updateProductivityScore, updateStreak])

  // 计算今日进度
  const todayProgress = useMemo(() => {
    const today = new Date().toDateString()
    const todayData = dashboardData.weeklyProgress.find(day => day.date === today)
    return todayData || { date: today, words: 0, time: 0 }
  }, [dashboardData.weeklyProgress])

  // 计算本周平均值
  const weeklyAverage = useMemo(() => {
    if (dashboardData.weeklyProgress.length === 0) return 0
    return Math.round(dashboardData.weeklyWords / dashboardData.weeklyProgress.length)
  }, [dashboardData.weeklyWords, dashboardData.weeklyProgress])

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  }

  const cardVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { 
      y: 0, 
      opacity: 1,
      transition: { duration: 0.5 }
    }
  }

  return (
    <motion.div
      className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 p-6"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      <div className="max-w-7xl mx-auto space-y-6">
        {/* 页面标题 */}
        <motion.div variants={cardVariants} className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">📊 个人生产力仪表盘</h1>
          <p className="text-gray-600">追踪你的写作进度，优化学习效率</p>
        </motion.div>

        {/* 核心统计卡片 */}
        <motion.div 
          variants={cardVariants}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8"
        >
          <StatCard
            title="总字数"
            value={dashboardData.totalWords.toLocaleString()}
            icon={<FileText className="w-6 h-6 text-blue-600" />}
            trend="+12%"
            subtitle="本周"
            bgColor="from-blue-500 to-blue-600"
          />
          <StatCard
            title="AI助手使用"
            value={dashboardData.aiRequests}
            icon={<Brain className="w-6 h-6 text-purple-600" />}
            trend={`节省 ${dashboardData.timeSaved} 分钟`}
            subtitle="智能辅助"
            bgColor="from-purple-500 to-purple-600"
          />
          <StatCard
            title="笔记数量"
            value={dashboardData.totalNotes}
            icon={<FileText className="w-6 h-6 text-green-600" />}
            trend={`${todayProgress.words} 字今日`}
            subtitle="创作内容"
            bgColor="from-green-500 to-green-600"
          />
          <StatCard
            title="连续天数"
            value={`${dashboardData.currentStreak} 天`}
            icon={<Award className="w-6 h-6 text-orange-600" />}
            trend="保持活跃"
            subtitle="写作习惯"
            bgColor="from-orange-500 to-orange-600"
          />
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* 写作进度图表 */}
          <motion.div variants={cardVariants}>
            <Card className="h-96">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-blue-600" />
                  本周写作进度
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ProgressChart data={dashboardData.weeklyProgress} />
              </CardContent>
            </Card>
          </motion.div>

          {/* 生产力评分 */}
          <motion.div variants={cardVariants}>
            <Card className="h-96">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="w-5 h-5 text-purple-600" />
                  生产力评分
                </CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col items-center justify-center h-full">
                <div className="relative w-32 h-32 mb-4">
                  <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                    <circle
                      cx="50"
                      cy="50"
                      r="40"
                      fill="none"
                      stroke="#e5e7eb"
                      strokeWidth="8"
                    />
                    <motion.circle
                      cx="50"
                      cy="50"
                      r="40"
                      fill="none"
                      stroke="url(#gradient)"
                      strokeWidth="8"
                      strokeLinecap="round"
                      strokeDasharray={`${2 * Math.PI * 40}`}
                      initial={{ strokeDashoffset: 2 * Math.PI * 40 }}
                      animate={{ 
                        strokeDashoffset: 2 * Math.PI * 40 * (1 - dashboardData.productivityScore / 100) 
                      }}
                      transition={{ duration: 1.5, ease: "easeOut" }}
                    />
                    <defs>
                      <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#8b5cf6" />
                        <stop offset="100%" stopColor="#3b82f6" />
                      </linearGradient>
                    </defs>
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-3xl font-bold text-gray-800">
                      {dashboardData.productivityScore}
                    </span>
                  </div>
                </div>
                <p className="text-lg font-semibold text-gray-700 mb-1">生产力指数</p>
                <p className="text-sm text-gray-500">
                  {dashboardData.productivityScore >= 80 ? '🔥 高效状态' : 
                   dashboardData.productivityScore >= 60 ? '💪 良好状态' : 
                   dashboardData.productivityScore >= 40 ? '📈 进步中' : '🌱 起步阶段'}
                </p>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* AI功能使用分析 */}
          <motion.div variants={cardVariants}>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="w-5 h-5 text-yellow-600" />
                  AI功能使用
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {dashboardData.topAiFeatures.map(([feature, count], index) => (
                    <div key={feature} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className={`w-3 h-3 rounded-full ${
                          index === 0 ? 'bg-yellow-400' :
                          index === 1 ? 'bg-gray-400' :
                          index === 2 ? 'bg-orange-400' : 'bg-blue-400'
                        }`} />
                        <span className="text-sm text-gray-600 capitalize">
                          {feature === 'aiAssistance' ? 'AI对话' :
                           feature === 'translation' ? '翻译' :
                           feature === 'summary' ? '摘要' : feature}
                        </span>
                      </div>
                      <span className="text-sm font-semibold">{count}次</span>
                    </div>
                  ))}
                </div>
                {dashboardData.topAiFeatures.length === 0 && (
                  <div className="text-center py-4 text-gray-500">
                    <Brain className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">开始使用AI功能来查看统计</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>

          {/* 目标进度 */}
          <motion.div variants={cardVariants}>
            <GoalProgress 
              dailyWords={todayProgress.words}
              weeklyAverage={weeklyAverage}
              currentStreak={dashboardData.currentStreak}
            />
          </motion.div>

          {/* 活动日历 */}
          <motion.div variants={cardVariants}>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-indigo-600" />
                  活动热力图
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ActivityCalendar data={dashboardData.weeklyProgress} />
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* 快速操作 */}
        <motion.div variants={cardVariants}>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-green-600" />
                今日建议
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <Clock className="w-8 h-8 text-blue-600 mx-auto mb-2" />
                  <h3 className="font-semibold text-gray-800 mb-1">保持专注</h3>
                  <p className="text-sm text-gray-600">今日已写作 {Math.round(todayProgress.time)} 分钟</p>
                </div>
                <div className="text-center p-4 bg-purple-50 rounded-lg">
                  <Brain className="w-8 h-8 text-purple-600 mx-auto mb-2" />
                  <h3 className="font-semibold text-gray-800 mb-1">AI助手</h3>
                  <p className="text-sm text-gray-600">让AI帮你提升写作效率</p>
                </div>
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <Award className="w-8 h-8 text-green-600 mx-auto mb-2" />
                  <h3 className="font-semibold text-gray-800 mb-1">坚持习惯</h3>
                  <p className="text-sm text-gray-600">连续 {dashboardData.currentStreak} 天活跃</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </motion.div>
  )
}

export default ProductivityDashboard