const API_BASE_URL = '/api';

const sanitizeUserRecord = (record) => {
  if (!record) {
    return null;
  }

  return {
    id: record.id ?? null,
    clerkId: record.clerk_id ?? null,
    email: record.email ?? null,
    name: record.name ?? null,
    avatarUrl: record.avatar_url ?? null,
    createdAt: record.created_at ?? null,
    updatedAt: record.updated_at ?? null,
    raw: record,
  };
};

export const neonUserService = {
  isConfigured: true,

  async upsertClerkUser({ clerkUser }) {
    const payload = {
      clerkId: clerkUser.id,
      email: clerkUser.primaryEmailAddress?.emailAddress ?? clerkUser.emailAddresses?.[0]?.emailAddress ?? null,
      name: clerkUser.fullName ?? [clerkUser.firstName, clerkUser.lastName].filter(Boolean).join(' ') ?? null,
      avatarUrl: clerkUser.imageUrl ?? null,
    };

    const response = await fetch(`${API_BASE_URL}/users/sync`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Erro ao sincronizar usuário no Neon: ${response.status} ${errorText}`);
    }

    const data = await response.json();
    return sanitizeUserRecord(data);
  },

  async getClerkUser({ clerkUserId }) {
    const response = await fetch(`${API_BASE_URL}/users/${encodeURIComponent(clerkUserId)}`, {
      headers: {
        Accept: 'application/json',
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Erro ao buscar usuário no Neon: ${response.status} ${errorText}`);
    }

    const data = await response.json();
    return sanitizeUserRecord(data);
  },
};