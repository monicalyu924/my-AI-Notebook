import React from 'react'
import { motion } from 'framer-motion'
import { Card, CardContent } from '../ui/Card'

const StatCard = ({ title, value, icon, trend, subtitle, bgColor }) => {
  return (
    <motion.div
      whileHover={{ y: -5, scale: 1.02 }}
      transition={{ duration: 0.2 }}
    >
      <Card className="overflow-hidden relative">
        <div className={`absolute inset-0 bg-gradient-to-r ${bgColor} opacity-5`} />
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div className={`p-2 rounded-lg bg-gradient-to-r ${bgColor} bg-opacity-10`}>
              {icon}
            </div>
            {trend && (
              <span className="text-xs font-medium text-green-600 bg-green-50 px-2 py-1 rounded-full">
                {trend}
              </span>
            )}
          </div>
          
          <div>
            <h3 className="text-2xl font-bold text-gray-900 mb-1">
              {value}
            </h3>
            <p className="text-sm font-medium text-gray-600 mb-1">
              {title}
            </p>
            {subtitle && (
              <p className="text-xs text-gray-500">
                {subtitle}
              </p>
            )}
          </div>
          
          {/* 装饰性渐变条 */}
          <div className={`h-1 w-full bg-gradient-to-r ${bgColor} rounded-full mt-4 opacity-20`} />
        </CardContent>
      </Card>
    </motion.div>
  )
}

export default StatCard