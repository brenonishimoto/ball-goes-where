const API_BASE_URL = '/api/ranking';

const extractErrorMessage = (value, fallback = 'Falha ao atualizar ranking.') => {
  if (!value) {
    return fallback;
  }

  if (typeof value === 'string') {
    return value;
  }

  if (value instanceof Error) {
    return value.message || fallback;
  }

  if (typeof value === 'object') {
    return extractErrorMessage(value.message || value.error || value.detail || value.reason, fallback);
  }

  return fallback;
};

const parseResponse = async (response) => {
  const rawText = await response.text();
  let data = {};

  if (rawText) {
    try {
      data = JSON.parse(rawText);
    } catch {
      data = {};
    }
  }

  if (!response.ok) {
    const message = extractErrorMessage(
      data?.error || rawText,
      `Erro ${response.status}: ${response.statusText || 'requisição inválida'}`
    );
    throw new Error(message);
  }

  return data;
};

const requestJson = async (path, { method = 'GET', body, token } = {}) => {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });

  return parseResponse(response);
};

export const rankingService = {
  async updateMyScore({ token, score }) {
    const normalizedScore = {
      totalScore: Number(score?.totalScore) || 0,
      phase1Score: Number(score?.phase1Score ?? score?.phase1 ?? 0) || 0,
      phase2Score: Number(score?.phase2Score ?? score?.phase2 ?? 0) || 0,
      phase3Score: Number(score?.phase3Score ?? score?.phase3 ?? 0) || 0,
    };

    const data = await requestJson('/scores/me', {
      method: 'PUT',
      token,
      body: normalizedScore,
    });

    return data;
  },

  async getLeaderboard() {
    const data = await requestJson('/leaderboard', { method: 'GET' });
    return Array.isArray(data.leaderboard) ? data.leaderboard : [];
  },

  async refreshLeaderboard({ token }) {
    const data = await requestJson('/refresh', {
      method: 'POST',
      token,
    });

    return data;
  },
};
