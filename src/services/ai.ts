// Frontend AI client. Wraps the `/api/ai/*` endpoints exposed by the
// new RAG backend so React components don't need to know about axios
// boilerplate.
import api from './api';

export interface KnowledgeBase {
  id: string;
  name: string;
  scope: 'GLOBAL' | 'CLUSTER' | 'USER';
  owner_id: string | null;
  cluster_id: string | null;
  description: string | null;
  document_count: number;
  created_at: string;
  updated_at: string;
}

export interface KbDocument {
  id: string;
  knowledge_base_id: string;
  title: string;
  source: 'UPLOAD' | 'URL';
  source_url: string | null;
  storage_key: string | null;
  mime_type: string | null;
  file_size: number | null;
  status: 'PENDING' | 'PROCESSING' | 'INDEXED' | 'FAILED';
  error_message: string | null;
  chunk_count: number;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface AiCitation {
  index: number;
  document_id: string;
  chunk_id: string;
  similarity: string;
  snippet: string;
}

export interface AiChatResponse {
  chat_id: string;
  message_id: string;
  role: 'assistant';
  content: string;
  citations: AiCitation[];
  created_at: string;
}

export const aiAPI = {
  // Knowledge bases
  listKnowledgeBases: () => api.get<{ data: KnowledgeBase[]; pagination: any }>('/ai/knowledge-bases'),
  createKnowledgeBase: (data: {
    name: string;
    scope?: 'GLOBAL' | 'CLUSTER' | 'USER';
    cluster_id?: string;
    description?: string;
  }) => api.post<KnowledgeBase>('/ai/knowledge-bases', data),
  deleteKnowledgeBase: (id: string) => api.delete(`/ai/knowledge-bases/${id}`),

  // Documents
  listDocuments: (kbId: string) =>
    api.get<{ data: KbDocument[]; pagination: any }>(`/ai/knowledge-bases/${kbId}/documents`),
  uploadDocument: (kbId: string, file: File, title?: string) => {
    const form = new FormData();
    form.append('file', file);
    if (title) form.append('title', title);
    return api.post<KbDocument>(`/ai/knowledge-bases/${kbId}/documents`, form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
  ingestUrl: (kbId: string, sourceUrl: string, title?: string) =>
    api.post<KbDocument>(`/ai/knowledge-bases/${kbId}/documents`, { source_url: sourceUrl, title }),
  deleteDocument: (id: string) => api.delete(`/ai/documents/${id}`),
  getDocumentDownloadUrl: (id: string) =>
    api.get<{ url: string; expires_in: number }>(`/ai/documents/${id}/download-url`),

  // Chat & retrieval
  chat: (data: { message: string; chat_id?: string; knowledge_base_ids?: string[] }) =>
    api.post<AiChatResponse>('/ai/chat', data),
  search: (data: { query: string; knowledge_base_ids?: string[]; top_k?: number }) =>
    api.post<AiCitation[]>('/ai/search', data),
  listChats: () => api.get('/ai/chats'),
  getChat: (id: string) => api.get(`/ai/chats/${id}`),
};
