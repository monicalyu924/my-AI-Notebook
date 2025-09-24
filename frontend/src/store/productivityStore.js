import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export const useProductivityStore = create(
  persist(
    (set, get) => ({
      // 写作统计
      writingStats: {
        totalWords: 0,
        totalNotes: 0,
        writingTime: 0, // 分钟
        dailyWordCounts: [], // 每日字数记录
        weeklyProgress: [],
        monthlyProgress: []
      },
      
      // AI使用统计
      aiUsage: {
        totalRequests: 0,
        timeSaved: 0, // 估算节省的时间（分钟）
        mostUsedFeatures: {},
        aiAssistanceCount: 0,
        translationCount: 0,
        summaryCount: 0
      },
      
      // 学习追踪
      learningProgress: {
        knowledgePoints: 0,
        reviewsSessions: 0,
        streakDays: 0,
        lastActiveDate: null,
        topicsMastered: []
      },
      
      // 时间管理
      timeManagement: {
        pomodoroSessions: 0,
        focusTime: 0, // 专注时间（分钟）
        breakTime: 0,
        productivityScore: 0,
        bestFocusTime: null // 最佳专注时段
      },
      
      // 目标追踪
      goals: {
        dailyWordGoal: 500,
        weeklyNoteGoal: 10,
        currentStreak: 0,
        longestStreak: 0,
        achievements: []
      },
      
      // 动作方法
      recordWritingActivity: (words, time) => {
        const today = new Date().toDateString()
        const state = get()
        
        set({
          writingStats: {
            ...state.writingStats,
            totalWords: state.writingStats.totalWords + words,
            writingTime: state.writingStats.writingTime + time,
            dailyWordCounts: [
              ...state.writingStats.dailyWordCounts.filter(entry => entry.date !== today),
              { 
                date: today, 
                words: (state.writingStats.dailyWordCounts.find(entry => entry.date === today)?.words || 0) + words,
                time: (state.writingStats.dailyWordCounts.find(entry => entry.date === today)?.time || 0) + time
              }
            ]
          }
        })
      },
      
      recordNoteCreation: () => {
        const state = get()
        set({
          writingStats: {
            ...state.writingStats,
            totalNotes: state.writingStats.totalNotes + 1
          }
        })
      },
      
      recordAIUsage: (feature, timeSaved = 2) => {
        const state = get()
        const currentFeatures = state.aiUsage.mostUsedFeatures
        
        set({
          aiUsage: {
            ...state.aiUsage,
            totalRequests: state.aiUsage.totalRequests + 1,
            timeSaved: state.aiUsage.timeSaved + timeSaved,
            mostUsedFeatures: {
              ...currentFeatures,
              [feature]: (currentFeatures[feature] || 0) + 1
            },
            [`${feature}Count`]: (state.aiUsage[`${feature}Count`] || 0) + 1
          }
        })
      },
      
      recordPomodoroSession: (focusTime, breakTime) => {
        const state = get()
        set({
          timeManagement: {
            ...state.timeManagement,
            pomodoroSessions: state.timeManagement.pomodoroSessions + 1,
            focusTime: state.timeManagement.focusTime + focusTime,
            breakTime: state.timeManagement.breakTime + breakTime
          }
        })
      },
      
      updateProductivityScore: () => {
        const state = get()
        const { writingStats, aiUsage, timeManagement } = state
        
        // 简单的生产力评分算法
        const wordScore = Math.min(writingStats.totalWords / 1000 * 20, 40)
        const aiScore = Math.min(aiUsage.totalRequests * 2, 30)
        const timeScore = Math.min(timeManagement.focusTime / 60 * 3, 30)
        
        const totalScore = Math.round(wordScore + aiScore + timeScore)
        
        set({
          timeManagement: {
            ...state.timeManagement,
            productivityScore: totalScore
          }
        })
      },
      
      updateStreak: () => {
        const today = new Date().toDateString()
        const yesterday = new Date(Date.now() - 86400000).toDateString()
        const state = get()
        
        const todayActivity = state.writingStats.dailyWordCounts.find(entry => entry.date === today)
        const yesterdayActivity = state.writingStats.dailyWordCounts.find(entry => entry.date === yesterday)
        
        if (todayActivity && todayActivity.words > 0) {
          if (yesterdayActivity && yesterdayActivity.words > 0) {
            // 连续活跃
            set({
              goals: {
                ...state.goals,
                currentStreak: state.goals.currentStreak + 1,
                longestStreak: Math.max(state.goals.longestStreak, state.goals.currentStreak + 1)
              }
            })
          } else {
            // 重新开始计数
            set({
              goals: {
                ...state.goals,
                currentStreak: 1,
                longestStreak: Math.max(state.goals.longestStreak, 1)
              }
            })
          }
        }
      },
      
      getWeeklyStats: () => {
        const state = get()
        const today = new Date()
        const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000)
        
        return state.writingStats.dailyWordCounts.filter(entry => {
          const entryDate = new Date(entry.date)
          return entryDate >= weekAgo && entryDate <= today
        })
      },
      
      getDashboardData: () => {
        const state = get()
        const weeklyStats = get().getWeeklyStats()
        
        return {
          totalWords: state.writingStats.totalWords,
          totalNotes: state.writingStats.totalNotes,
          writingTime: state.writingStats.writingTime,
          aiRequests: state.aiUsage.totalRequests,
          timeSaved: state.aiUsage.timeSaved,
          productivityScore: state.timeManagement.productivityScore,
          currentStreak: state.goals.currentStreak,
          weeklyWords: weeklyStats.reduce((sum, day) => sum + day.words, 0),
          weeklyProgress: weeklyStats,
          topAiFeatures: Object.entries(state.aiUsage.mostUsedFeatures)
            .sort(([,a], [,b]) => b - a)
            .slice(0, 5)
        }
      }
    }),
    {
      name: 'productivity-storage',
      version: 1
    }
  )
)