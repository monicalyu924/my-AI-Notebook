import React from 'react'
import { motion } from 'framer-motion'

const ActivityCalendar = ({ data }) => {
  // 生成最近30天的日期
  const generateCalendarData = () => {
    const days = []
    const today = new Date()
    
    for (let i = 29; i >= 0; i--) {
      const date = new Date(today)
      date.setDate(today.getDate() - i)
      const dateString = date.toDateString()
      const dayData = data.find(item => item.date === dateString)
      
      days.push({
        date: dateString,
        day: date.getDate(),
        month: date.getMonth(),
        words: dayData ? dayData.words : 0,
        isToday: i === 0,
        isWeekend: date.getDay() === 0 || date.getDay() === 6
      })
    }
    
    return days
  }

  const calendarData = generateCalendarData()
  const maxWords = Math.max(...calendarData.map(day => day.words), 1)

  // 获取活动强度颜色
  const getIntensityColor = (words) => {
    if (words === 0) return 'bg-gray-100'
    const intensity = words / maxWords
    if (intensity >= 0.8) return 'bg-green-500'
    if (intensity >= 0.6) return 'bg-green-400'
    if (intensity >= 0.4) return 'bg-green-300'
    if (intensity >= 0.2) return 'bg-green-200'
    return 'bg-green-100'
  }

  return (
    <div className="space-y-4">
      {/* 日历网格 */}
      <div className="grid grid-cols-7 gap-1">
        {calendarData.map((day, index) => (
          <motion.div
            key={day.date}
            className={`
              aspect-square rounded-md relative cursor-pointer transition-all duration-200
              ${getIntensityColor(day.words)}
              ${day.isToday ? 'ring-2 ring-blue-500 ring-offset-1' : ''}
              hover:scale-110 hover:z-10
            `}
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ 
              duration: 0.2, 
              delay: index * 0.01 
            }}
            whileHover={{ scale: 1.1 }}
            title={`${new Date(day.date).toLocaleDateString('zh-CN')} - ${day.words} 字`}
          >
            {/* 日期数字 */}
            <div className="absolute inset-0 flex items-center justify-center">
              <span className={`text-xs font-medium ${
                day.words > maxWords * 0.5 ? 'text-white' : 'text-gray-600'
              }`}>
                {day.day}
              </span>
            </div>
            
            {/* 今日标记 */}
            {day.isToday && (
              <motion.div
                className="absolute -top-1 -right-1 w-2 h-2 bg-blue-500 rounded-full"
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
              />
            )}
          </motion.div>
        ))}
      </div>

      {/* 图例 */}
      <div className="flex items-center justify-between text-xs text-gray-600">
        <span>少</span>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 bg-gray-100 rounded-sm" />
          <div className="w-3 h-3 bg-green-100 rounded-sm" />
          <div className="w-3 h-3 bg-green-200 rounded-sm" />
          <div className="w-3 h-3 bg-green-300 rounded-sm" />
          <div className="w-3 h-3 bg-green-400 rounded-sm" />
          <div className="w-3 h-3 bg-green-500 rounded-sm" />
        </div>
        <span>多</span>
      </div>

      {/* 统计摘要 */}
      <div className="grid grid-cols-3 gap-2 text-center text-xs">
        <div>
          <div className="font-semibold text-gray-800">
            {calendarData.filter(day => day.words > 0).length}
          </div>
          <div className="text-gray-500">活跃天数</div>
        </div>
        <div>
          <div className="font-semibold text-gray-800">
            {Math.round(calendarData.filter(day => day.words > 0).length / 30 * 100)}%
          </div>
          <div className="text-gray-500">活跃率</div>
        </div>
        <div>
          <div className="font-semibold text-gray-800">
            {maxWords > 0 ? maxWords.toLocaleString() : 0}
          </div>
          <div className="text-gray-500">最高记录</div>
        </div>
      </div>
    </div>
  )
}

export default ActivityCalendar