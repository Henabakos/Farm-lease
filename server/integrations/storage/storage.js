// ============================================================================
// Object storage adapter — wraps the AWS SDK so the rest of the app talks
// to a small `StoragePort` interface (`put`, `get`, `delete`, `signGet`,
// `signPut`) regardless of whether the underlying provider is MinIO,
// AWS S3, R2, Backblaze B2, etc.
//
// In dev, the docker-compose stack runs MinIO on http://localhost:9000 with
// the default credentials. The S3 SDK speaks MinIO's protocol natively as
// long as `forcePathStyle: true` is set.
// ============================================================================

import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
  HeadObjectCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { randomUUID } from 'node:crypto';
import { env } from '../../config/env.js';
import { ExternalServiceError } from '../../shared/errors.js';

export const s3 = new S3Client({
  endpoint: env.S3_ENDPOINT,
  region: env.S3_REGION,
  credentials: {
    accessKeyId:     env.S3_ACCESS_KEY ?? '',
    secretAccessKey: env.S3_SECRET_KEY ?? '',
  },
  forcePathStyle: env.S3_FORCE_PATH_STYLE,
});

const BUCKET = env.S3_BUCKET;

/** Build a namespaced object key. Always use this — never construct keys ad-hoc. */
export function buildKey(prefix, filename) {
  const safe = String(filename ?? 'file').replace(/[^\w.\-]/g, '_').slice(0, 200);
  return `${prefix}/${randomUUID()}-${safe}`;
}

/** Upload an in-memory Buffer to the bucket. Returns the storage key. */
export async function put({ key, body, contentType }) {
  try {
    await s3.send(new PutObjectCommand({
      Bucket: BUCKET,
      Key: key,
      Body: body,
      ContentType: contentType ?? 'application/octet-stream',
    }));
    return key;
  } catch (err) {
    throw new ExternalServiceError('storage', `put failed: ${err.message}`);
  }
}

/** Fetch an object as a Buffer. Use sparingly — prefer signed URLs for downloads. */
export async function getBuffer(key) {
  const out = await s3.send(new GetObjectCommand({ Bucket: BUCKET, Key: key }));
  const chunks = [];
  for await (const c of out.Body) chunks.push(c);
  return Buffer.concat(chunks);
}

export async function remove(key) {
  await s3.send(new DeleteObjectCommand({ Bucket: BUCKET, Key: key }));
}

export async function head(key) {
  try {
    return await s3.send(new HeadObjectCommand({ Bucket: BUCKET, Key: key }));
  } catch {
    return null;
  }
}

/** Presigned URL for browser → S3 PUT (avoids piping uploads through the API node). */
export async function signPut({ key, contentType, expiresIn = 600 }) {
  return getSignedUrl(
    s3,
    new PutObjectCommand({ Bucket: BUCKET, Key: key, ContentType: contentType }),
    { expiresIn },
  );
}

/** Presigned URL for time-limited downloads. */
export async function signGet({ key, expiresIn = 600 }) {
  return getSignedUrl(s3, new GetObjectCommand({ Bucket: BUCKET, Key: key }), { expiresIn });
}
