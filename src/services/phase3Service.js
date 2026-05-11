const BASE_URL = '/api/predictions/phase3';

export const phase3Service = {
  async getPredictions(token) {
    if (!token) {
      return { phase3_predictions: {} };
    }

    try {
      const response = await fetch(`${BASE_URL}/me`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        console.error('Falha ao carregar previsoes da Fase 3:', response.statusText);
        return { phase3_predictions: {} };
      }

      return response.json();
    } catch (error) {
      console.error('Erro ao carregar previsoes da Fase 3:', error);
      return { phase3_predictions: {} };
    }
  },

  async savePredictions(token, predictions) {
    if (!token) {
      console.warn('Token nao disponivel. Previsoes nao serao salvas no servidor.');
      return false;
    }

    try {
      const response = await fetch(`${BASE_URL}/me`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ phase3_predictions: predictions }),
      });

      if (!response.ok) {
        console.error('Falha ao salvar previsoes da Fase 3:', response.statusText);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Erro ao salvar previsoes da Fase 3:', error);
      return false;
    }
  },
};
