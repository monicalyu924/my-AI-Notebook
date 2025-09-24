import React from 'react'
import { motion } from 'framer-motion'

const ProgressChart = ({ data }) => {
  // 获取最近7天的数据，如果不足7天则补充空数据
  const last7Days = []
  const today = new Date()
  
  for (let i = 6; i >= 0; i--) {
    const date = new Date(today)
    date.setDate(today.getDate() - i)
    const dateString = date.toDateString()
    const dayData = data.find(item => item.date === dateString)
    
    last7Days.push({
      date: dateString,
      day: date.toLocaleDateString('zh-CN', { weekday: 'short' }),
      words: dayData ? dayData.words : 0,
      time: dayData ? dayData.time : 0
    })
  }

  // 找出最大值用于比例计算
  const maxWords = Math.max(...last7Days.map(day => day.words), 100)

  return (
    <div className="h-full flex flex-col justify-center">
      {/* 图表标题 */}
      <div className="flex justify-between items-center mb-4">
        <span className="text-sm text-gray-600">每日字数</span>
        <span className="text-xs text-gray-500">最近7天</span>
      </div>
      
      {/* 图表主体 */}
      <div className="flex-1 flex items-end justify-between gap-2 mb-4">
        {last7Days.map((day, index) => {
          const height = maxWords > 0 ? (day.words / maxWords) * 100 : 0
          
          return (
            <div key={day.date} className="flex-1 flex flex-col items-center">
              {/* 柱状图 */}
              <div className="w-full bg-gray-100 rounded-t-lg relative overflow-hidden h-32 mb-2">
                <motion.div
                  className="absolute bottom-0 left-0 w-full bg-gradient-to-t from-blue-500 to-purple-500 rounded-t-lg"
                  initial={{ height: 0 }}
                  animate={{ height: `${height}%` }}
                  transition={{ 
                    duration: 0.8, 
                    delay: index * 0.1,
                    ease: "easeOut" 
                  }}
                />
                
                {/* 数值显示 */}
                {day.words > 0 && (
                  <motion.div
                    className="absolute top-1 left-1/2 transform -translate-x-1/2 text-xs font-semibold text-white bg-black bg-opacity-20 px-1 rounded"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ 
                      duration: 0.5, 
                      delay: index * 0.1 + 0.3 
                    }}
                  >
                    {day.words}
                  </motion.div>
                )}
              </div>
              
              {/* 日期标签 */}
              <span className="text-xs text-gray-600 font-medium">
                {day.day}
              </span>
            </div>
          )
        })}
      </div>
      
      {/* 统计信息 */}
      <div className="grid grid-cols-3 gap-4 text-center border-t pt-4">
        <div>
          <div className="text-lg font-bold text-gray-800">
            {last7Days.reduce((sum, day) => sum + day.words, 0).toLocaleString()}
          </div>
          <div className="text-xs text-gray-500">本周总计</div>
        </div>
        <div>
          <div className="text-lg font-bold text-gray-800">
            {Math.round(last7Days.reduce((sum, day) => sum + day.words, 0) / 7)}
          </div>
          <div className="text-xs text-gray-500">日均字数</div>
        </div>
        <div>
          <div className="text-lg font-bold text-gray-800">
            {Math.round(last7Days.reduce((sum, day) => sum + day.time, 0))}
          </div>
          <div className="text-xs text-gray-500">总时长(分)</div>
        </div>
      </div>
      
      {/* 空状态 */}
      {last7Days.every(day => day.words === 0) && (
        <motion.div 
          className="flex flex-col items-center justify-center h-32 text-gray-400"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <div className="text-4xl mb-2">📝</div>
          <p className="text-sm">开始写作来查看进度图表</p>
        </motion.div>
      )}
    </div>
  )
}

export default ProgressChart