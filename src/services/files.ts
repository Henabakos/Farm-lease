// Frontend helper for the generic /api/files upload endpoint. Used by chat
// attachments, KYC uploads, proposal documents, payment receipts, etc.
import { api } from './api';

export interface UploadedFile {
  storage_key: string;
  file_name: string;
  mime_type: string;
  file_size: number;
  url: string;
}

export type UploadPrefix =
  | 'attachments'
  | 'kyc'
  | 'proposals'
  | 'receipts'
  | 'avatars'
  | 'agreements'
  | 'kb';

/** Upload a single file. Returns the persisted storage key + signed GET URL. */
export async function uploadFile(file: File, prefix: UploadPrefix = 'attachments'): Promise<UploadedFile> {
  const form = new FormData();
  form.append('file', file);
  form.append('prefix', prefix);
  const res = await api.post('/files/upload', form, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return res.data as UploadedFile;
}

/** Get a fresh signed GET URL for a previously-uploaded storage key. */
export async function getSignedDownloadUrl(key: string, expires = 600): Promise<string> {
  const res = await api.get('/files/signed-url', { params: { key, expires } });
  return res.data.url as string;
}
