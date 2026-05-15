import axios from 'axios'

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

export interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
}

// Send a chat message and get AI response
export const sendChatMessage = async (
  message: string,
  history: ChatMessage[]
): Promise<string> => {
  const res = await axios.post(`${BASE_URL}/ai/chat`, {
    message,
    history: history.map(h => ({
      role:    h.role,
      content: h.content
    }))
  })
  return res.data.reply
}

// Get automatic insights
export const getInsights = async (): Promise<string> => {
  const res = await axios.get(`${BASE_URL}/ai/insights`)
  return res.data.insights
}

// Get spending prediction
export const getPrediction = async (): Promise<string> => {
  const res = await axios.get(`${BASE_URL}/ai/predict`)
  return res.data.prediction
}

// Get weekly tip
export const getWeeklyTip = async (): Promise<string> => {
  const res = await axios.get(`${BASE_URL}/ai/tip`)
  return res.data.tip
}
