const API_BASE = import.meta.env.VITE_API_URL 
  ? `${import.meta.env.VITE_API_URL}/api`
  : '/api';

async function fetchApi<T>(
  endpoint: string,
  options?: RequestInit
): Promise<T> {
  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Request failed' }));
    throw new Error(error.error || 'Request failed');
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return response.json();
}

export const api = {
  conversations: {
    list: () => fetchApi<ConversationListItem[]>('/conversations'),
    get: (id: string) => fetchApi<ConversationDetail>(`/conversations/${id}`),
    create: (title?: string) =>
      fetchApi<ConversationDetail>('/conversations', {
        method: 'POST',
        body: JSON.stringify({ title }),
      }),
    delete: (id: string) =>
      fetchApi<void>(`/conversations/${id}`, { method: 'DELETE' }),
    updateTitle: (id: string, title: string) =>
      fetchApi<ConversationDetail>(`/conversations/${id}`, {
        method: 'PATCH',
        body: JSON.stringify({ title }),
      }),
  },
};

interface ConversationListItem {
  id: string;
  title: string;
  createdAt: string;
  messages: { content: string; createdAt: string }[];
}

interface ConversationDetail {
  id: string;
  title: string;
  createdAt: string;
  messages: {
    id: string;
    role: string;
    content: string;
    createdAt: string;
  }[];
}
