import { create } from 'zustand'

export const useChatStore = create((set, get) => ({
  messages: [],
  isLoading: false,
  
  addMessage: (message) => set((state) => ({
    messages: [...state.messages, {
      id: Date.now(),
      timestamp: new Date().toISOString(),
      ...message
    }]
  })),
  
  setLoading: (loading) => set({ isLoading: loading }),
  
  clearMessages: () => set({ messages: [] }),
  
  sendMessage: async (content) => {
    const { addMessage, setLoading } = get()
    
    // Add user message
    addMessage({
      type: 'user',
      content,
    })
    
    setLoading(true)
    
    try {
      // Simulate AI response for now
      setTimeout(() => {
        addMessage({
          type: 'assistant',
          content: `我收到了您的消息："${content}"。这是一个模拟回复，稍后我们会连接真正的AI后端。`,
        })
        setLoading(false)
      }, 1000)
    } catch (error) {
      addMessage({
        type: 'assistant',
        content: '抱歉，发生了错误。请稍后再试。',
      })
      setLoading(false)
    }
  }
}))