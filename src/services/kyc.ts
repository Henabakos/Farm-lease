import { api } from './api';

export type KycDocumentType =
  | 'photo'
  | 'national_id'
  | 'passport'
  | 'drivers_license'
  | 'address_proof';

export type KycDocumentStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

export interface KycDocument {
  id: string;
  user_id: string;
  user_name?: string | null;
  user_email?: string | null;
  document_type: KycDocumentType;
  storage_key: string;
  file_name: string;
  mime_type: string;
  file_size: number;
  status: KycDocumentStatus;
  reviewer_id?: string | null;
  reviewed_at?: string | null;
  review_notes?: string | null;
  created_at: string;
  updated_at: string;
}

export interface MyKyc {
  verification_status: 'unverified' | 'pending' | 'verified' | 'rejected';
  required_document_types: KycDocumentType[];
  documents: KycDocument[];
}

export async function getMyKyc(): Promise<MyKyc> {
  const res = await api.get('/kyc/me');
  return res.data as MyKyc;
}

export async function submitKycDocument(payload: {
  document_type: KycDocumentType;
  storage_key: string;
  file_name: string;
  mime_type: string;
  file_size: number;
}): Promise<KycDocument> {
  const res = await api.post('/kyc/documents', payload);
  return res.data as KycDocument;
}

export async function deleteKycDocument(id: string): Promise<void> {
  await api.delete(`/kyc/documents/${id}`);
}

export async function listKycDocuments(params: {
  status?: KycDocumentStatus;
  user_id?: string;
  page?: number;
  pageSize?: number;
} = {}): Promise<{ data: KycDocument[]; pagination: { page: number; pageSize: number; total: number } }> {
  const res = await api.get('/kyc/documents', { params });
  return res.data;
}

export async function reviewKycDocument(id: string, decision: 'APPROVED' | 'REJECTED', notes?: string): Promise<KycDocument> {
  const res = await api.post(`/kyc/documents/${id}/review`, { decision, notes });
  return res.data as KycDocument;
}
