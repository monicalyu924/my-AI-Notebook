import { useEffect, useRef, useCallback } from 'react'
import { useProductivityStore } from '../store/productivityStore'

/**
 * 自动追踪用户生产力活动的Hook
 * 包括写作活动、AI使用、番茄钟等统计
 */
export const useProductivityTracker = () => {
  const {
    recordWritingActivity,
    recordNoteCreation,
    recordAIUsage,
    recordPomodoroSession,
    updateProductivityScore,
    updateStreak
  } = useProductivityStore()

  const sessionStartTime = useRef(null)
  const lastActivity = useRef(Date.now())
  const wordsCountRef = useRef(0)

  // 开始写作会话
  const startWritingSession = useCallback(() => {
    sessionStartTime.current = Date.now()
    lastActivity.current = Date.now()
  }, [])

  // 记录写作活动
  const recordWriting = useCallback((wordCount) => {
    if (!sessionStartTime.current) {
      startWritingSession()
    }

    const now = Date.now()
    const timeDiff = (now - lastActivity.current) / 1000 / 60 // 转换为分钟
    const wordsDiff = wordCount - wordsCountRef.current

    if (wordsDiff > 0 && timeDiff < 10) { // 10分钟内的有效写作
      recordWritingActivity(wordsDiff, timeDiff)
      wordsCountRef.current = wordCount
    }
    
    lastActivity.current = now
  }, [recordWritingActivity, startWritingSession])

  // 结束写作会话
  const endWritingSession = useCallback(() => {
    if (sessionStartTime.current) {
      const sessionTime = (Date.now() - sessionStartTime.current) / 1000 / 60
      if (sessionTime > 1) { // 至少1分钟的写作才记录
        recordWritingActivity(0, sessionTime)
      }
      sessionStartTime.current = null
      wordsCountRef.current = 0
    }
  }, [recordWritingActivity])

  // 记录笔记创建
  const trackNoteCreation = useCallback(() => {
    recordNoteCreation()
    updateStreak()
  }, [recordNoteCreation, updateStreak])

  // 记录AI功能使用
  const trackAIUsage = useCallback((feature, estimatedTimeSaved = 2) => {
    recordAIUsage(feature, estimatedTimeSaved)
  }, [recordAIUsage])

  // 记录番茄钟会话
  const trackPomodoroSession = useCallback((focusTime, breakTime) => {
    recordPomodoroSession(focusTime, breakTime)
    updateProductivityScore()
  }, [recordPomodoroSession, updateProductivityScore])

  // 页面可见性变化时的处理
  const handleVisibilityChange = useCallback(() => {
    if (document.hidden) {
      endWritingSession()
    } else {
      startWritingSession()
    }
  }, [endWritingSession, startWritingSession])

  // 监听页面可见性变化
  useEffect(() => {
    document.addEventListener('visibilitychange', handleVisibilityChange)
    
    // 页面卸载时结束会话
    const handleBeforeUnload = () => {
      endWritingSession()
    }
    
    window.addEventListener('beforeunload', handleBeforeUnload)
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      window.removeEventListener('beforeunload', handleBeforeUnload)
      endWritingSession()
    }
  }, [handleVisibilityChange, endWritingSession])

  // 定期更新生产力评分
  useEffect(() => {
    const interval = setInterval(() => {
      updateProductivityScore()
    }, 5 * 60 * 1000) // 每5分钟更新一次

    return () => clearInterval(interval)
  }, [updateProductivityScore])

  return {
    startWritingSession,
    recordWriting,
    endWritingSession,
    trackNoteCreation,
    trackAIUsage,
    trackPomodoroSession
  }
}

// 文本分析工具 - 计算字数和写作时间
export const analyzeText = (text) => {
  const words = text.trim().split(/\s+/).filter(word => word.length > 0).length
  const characters = text.length
  const paragraphs = text.split(/\n\s*\n/).filter(p => p.trim().length > 0).length
  
  // 估算阅读时间（基于平均阅读速度）
  const readingTime = Math.ceil(words / 200) // 每分钟200字
  
  // 估算写作时间（基于平均打字速度）
  const writingTime = Math.ceil(words / 40) // 每分钟40字
  
  return {
    words,
    characters,
    paragraphs,
    readingTime,
    writingTime
  }
}

// AI功能使用类型常量
export const AI_FEATURES = {
  CHAT: 'aiAssistance',
  TRANSLATION: 'translation', 
  SUMMARY: 'summary',
  POLISH: 'polish',
  CONTINUE: 'continue',
  TITLE_GENERATION: 'titleGeneration',
  TAG_SUGGESTION: 'tagSuggestion'
}

export default useProductivityTracker