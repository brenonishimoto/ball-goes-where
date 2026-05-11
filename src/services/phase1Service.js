const BASE_URL = '/api/predictions/phase1'

export const phase1Service = {
  async getPredictions(token) {
    if (!token) {
      return { phase1_predictions: {} }
    }

    try {
      const response = await fetch(`${BASE_URL}/me`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      })

      if (!response.ok) {
        console.error('Falha ao carregar previsões da Fase 1:', response.statusText)
        return { phase1_predictions: {} }
      }

      const data = await response.json()
      return data
    } catch (error) {
      console.error('Erro ao carregar previsões da Fase 1:', error)
      return { phase1_predictions: {} }
    }
  },

  async savePredictions(token, predictions) {
    if (!token) {
      console.warn('Token não disponível. Previsões não serão salvas no servidor.')
      return false
    }

    try {
      const response = await fetch(`${BASE_URL}/me`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ phase1_predictions: predictions }),
      })

      if (!response.ok) {
        console.error('Falha ao salvar previsões da Fase 1:', response.statusText)
        return false
      }

      return true
    } catch (error) {
      console.error('Erro ao salvar previsões da Fase 1:', error)
      return false
    }
  },
}
