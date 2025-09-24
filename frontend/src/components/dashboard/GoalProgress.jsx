import React from 'react'
import { motion } from 'framer-motion'
import { Target, TrendingUp, Award, CheckCircle } from 'lucide-react'
import { Card, CardHeader, CardTitle, CardContent } from '../ui/Card'

const GoalProgress = ({ dailyWords, weeklyAverage, currentStreak }) => {
  const dailyGoal = 500 // 每日字数目标
  const weeklyGoal = 10 // 每周笔记目标
  const streakGoal = 7 // 连续天数目标

  // 计算完成百分比
  const dailyProgress = Math.min((dailyWords / dailyGoal) * 100, 100)
  const weeklyProgress = Math.min((weeklyAverage / (dailyGoal / 7)) * 100, 100)
  const streakProgress = Math.min((currentStreak / streakGoal) * 100, 100)

  // 目标状态
  const goals = [
    {
      title: '今日写作',
      current: dailyWords,
      target: dailyGoal,
      progress: dailyProgress,
      unit: '字',
      icon: <Target className="w-4 h-4" />,
      color: 'blue',
      message: dailyProgress >= 100 ? '🎉 今日目标达成!' : 
               dailyProgress >= 50 ? '💪 加油，过半了!' : '🌱 开始今日写作'
    },
    {
      title: '周平均',
      current: Math.round(weeklyAverage),
      target: Math.round(dailyGoal / 7),
      progress: weeklyProgress,
      unit: '字/天',
      icon: <TrendingUp className="w-4 h-4" />,
      color: 'green',
      message: weeklyProgress >= 100 ? '📈 周目标超额完成!' : 
               weeklyProgress >= 70 ? '👏 本周表现优秀!' : '📚 继续努力写作'
    },
    {
      title: '连续天数',
      current: currentStreak,
      target: streakGoal,
      progress: streakProgress,
      unit: '天',
      icon: <Award className="w-4 h-4" />,
      color: 'purple',
      message: streakProgress >= 100 ? '🔥 习惯养成达人!' : 
               currentStreak >= 3 ? '⭐ 坚持就是胜利!' : '🎯 开始建立写作习惯'
    }
  ]

  const getColorClasses = (color) => {
    const colors = {
      blue: {
        bg: 'from-blue-500 to-blue-600',
        light: 'bg-blue-50',
        text: 'text-blue-600',
        ring: 'ring-blue-200'
      },
      green: {
        bg: 'from-green-500 to-green-600',
        light: 'bg-green-50',
        text: 'text-green-600',
        ring: 'ring-green-200'
      },
      purple: {
        bg: 'from-purple-500 to-purple-600',
        light: 'bg-purple-50',
        text: 'text-purple-600',
        ring: 'ring-purple-200'
      }
    }
    return colors[color]
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Target className="w-5 h-5 text-indigo-600" />
          目标追踪
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {goals.map((goal, index) => {
          const colors = getColorClasses(goal.color)
          
          return (
            <motion.div
              key={goal.title}
              className="space-y-3"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
            >
              {/* 目标标题和数值 */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className={`p-1.5 rounded-lg ${colors.light}`}>
                    <span className={colors.text}>
                      {goal.icon}
                    </span>
                  </div>
                  <span className="font-medium text-gray-700 text-sm">
                    {goal.title}
                  </span>
                </div>
                
                <div className="text-right">
                  <div className="text-sm font-semibold text-gray-800">
                    {goal.current.toLocaleString()} / {goal.target.toLocaleString()} {goal.unit}
                  </div>
                  <div className="text-xs text-gray-500">
                    {Math.round(goal.progress)}%
                  </div>
                </div>
              </div>

              {/* 进度条 */}
              <div className="relative">
                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                  <motion.div
                    className={`h-full bg-gradient-to-r ${colors.bg} rounded-full`}
                    initial={{ width: 0 }}
                    animate={{ width: `${goal.progress}%` }}
                    transition={{ duration: 1, delay: index * 0.2 }}
                  />
                </div>
                
                {/* 完成标记 */}
                {goal.progress >= 100 && (
                  <motion.div
                    className="absolute -top-1 -right-1"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ duration: 0.3, delay: 0.8 }}
                  >
                    <CheckCircle className={`w-4 h-4 ${colors.text} bg-white rounded-full`} />
                  </motion.div>
                )}
              </div>

              {/* 激励消息 */}
              <motion.p
                className="text-xs text-gray-600 italic"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.5, delay: index * 0.1 + 0.3 }}
              >
                {goal.message}
              </motion.p>
            </motion.div>
          )
        })}

        {/* 总体进度摘要 */}
        <motion.div
          className="mt-6 p-4 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-lg border border-indigo-100"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.6 }}
        >
          <div className="text-center">
            <div className="text-lg font-bold text-gray-800 mb-1">
              {Math.round((dailyProgress + weeklyProgress + streakProgress) / 3)}%
            </div>
            <div className="text-sm text-gray-600 mb-2">整体完成度</div>
            
            {/* 成就徽章 */}
            <div className="flex justify-center gap-1">
              {[dailyProgress, weeklyProgress, streakProgress].map((progress, i) => (
                <motion.div
                  key={i}
                  className={`w-2 h-2 rounded-full ${
                    progress >= 100 ? 'bg-gold-400' :
                    progress >= 50 ? 'bg-yellow-400' : 'bg-gray-300'
                  }`}
                  animate={progress >= 100 ? { scale: [1, 1.2, 1] } : {}}
                  transition={{ duration: 0.8, repeat: Infinity, delay: i * 0.2 }}
                />
              ))}
            </div>
          </div>
        </motion.div>
      </CardContent>
    </Card>
  )
}

export default GoalProgress