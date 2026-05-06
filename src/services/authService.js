const API_BASE_URL = '/api/auth';

const extractErrorMessage = (value, fallback = 'Falha na autenticação.') => {
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
    const message = extractErrorMessage(data?.error, `Erro ${response.status}: ${response.statusText || 'requisição inválida'}`);
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

export const authService = {
  register({ name, email, password }) {
    return requestJson('/register', {
      method: 'POST',
      body: { name, email, password },
    });
  },

  login({ email, password }) {
    return requestJson('/login', {
      method: 'POST',
      body: { email, password },
    });
  },

  me({ token }) {
    return requestJson('/me', { token });
  },
};
