const API_BASE_URL = '/api/predictions';

const extractErrorMessage = (value, fallback = 'Falha ao carregar palpites.') => {
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

const normalizeGames = (games) => {
  // Backend pode retornar a lista dentro de uma string JSON (ex: { games: "[{...}]" })
  if (Array.isArray(games)) {
    return games;
  }

  if (typeof games === 'string') {
    const trimmed = games.trim();
    if (trimmed) {
      try {
        const parsed = JSON.parse(trimmed);
        return Array.isArray(parsed) ? parsed : [];
      } catch {
        return [];
      }
    }
  }

  // Fallbacks comuns quando o backend muda o shape
  if (games && typeof games === 'object') {
    return Object.values(games);
  }

  return [];
};

export const predictionService = {
  async getMyPredictions({ token }) {
    const data = await requestJson('/me', { token });
    const remoteGames = data?.games ?? data?.phase2_predictions ?? data?.data?.games;
    return normalizeGames(remoteGames);
  },


  async saveMyPredictions({ token, games }) {
    const data = await requestJson('/me', {
      method: 'PUT',
      token,
      body: { games: normalizeGames(games) },
    });

    return normalizeGames(data.games);
  },
};