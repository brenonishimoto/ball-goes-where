const API_BASE_URL = '/api/auth';

const parseResponse = async (response) => {
  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data?.error || 'Falha na autenticação.');
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
