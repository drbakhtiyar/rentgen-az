import "server-only";
import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
  CreateMultipartUploadCommand,
  UploadPartCommand,
  CompleteMultipartUploadCommand,
  AbortMultipartUploadCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { env } from "./env";

/** Files above this size are uploaded via resumable multipart. */
export const MULTIPART_THRESHOLD = 100 * 1024 * 1024; // 100 MB
export const MULTIPART_PART_SIZE = 100 * 1024 * 1024; // 100 MB per part

/**
 * Backblaze B2 (S3-compatible) storage for rentgen files.
 * The bucket is PRIVATE — files are only ever reached through short-lived
 * presigned URLs generated server-side after an authorization check.
 */

const UPLOAD_TTL_SECONDS = 300; // 5 min to start an upload
const DOWNLOAD_TTL_SECONDS = 300; // 5 min to start a download

export function b2Configured(): boolean {
  return Boolean(env.b2.keyId && env.b2.appKey && env.b2.bucket && env.b2.endpoint);
}

function client(): S3Client {
  return new S3Client({
    region: env.b2.region,
    endpoint: `https://${env.b2.endpoint}`,
    credentials: {
      accessKeyId: env.b2.keyId,
      secretAccessKey: env.b2.appKey,
    },
    // B2 (like R2) rejects the AWS SDK's default flexible checksum headers on
    // presigned PUTs — only add checksums when the caller explicitly asks.
    requestChecksumCalculation: "WHEN_REQUIRED",
    responseChecksumValidation: "WHEN_REQUIRED",
  });
}

/** Presigned PUT URL for a direct browser→B2 upload. */
export async function presignUpload(key: string, contentType: string): Promise<string> {
  const cmd = new PutObjectCommand({
    Bucket: env.b2.bucket,
    Key: key,
    ContentType: contentType,
  });
  return getSignedUrl(client(), cmd, { expiresIn: UPLOAD_TTL_SECONDS });
}

/** Presigned GET URL that forces a download with the original filename. */
export async function presignDownload(key: string, fileName: string): Promise<string> {
  const safe = fileName.replace(/["\\\r\n]/g, "_");
  const cmd = new GetObjectCommand({
    Bucket: env.b2.bucket,
    Key: key,
    ResponseContentDisposition: `attachment; filename="${safe}"`,
  });
  return getSignedUrl(client(), cmd, { expiresIn: DOWNLOAD_TTL_SECONDS });
}

/** Permanently delete an object. */
export async function deleteObject(key: string): Promise<void> {
  await client().send(
    new DeleteObjectCommand({ Bucket: env.b2.bucket, Key: key }),
  );
}

// ---- Resumable multipart upload (large files) ----

/** Begin a multipart upload; returns presigned PUT URLs for every part. */
export async function createMultipart(
  key: string,
  contentType: string,
  partCount: number,
): Promise<{ uploadId: string; urls: string[] }> {
  const c = client();
  const created = await c.send(
    new CreateMultipartUploadCommand({
      Bucket: env.b2.bucket,
      Key: key,
      ContentType: contentType,
    }),
  );
  const uploadId = created.UploadId!;
  const urls: string[] = [];
  for (let part = 1; part <= partCount; part++) {
    const cmd = new UploadPartCommand({
      Bucket: env.b2.bucket,
      Key: key,
      UploadId: uploadId,
      PartNumber: part,
    });
    urls.push(await getSignedUrl(c, cmd, { expiresIn: 6 * 60 * 60 })); // 6h
  }
  return { uploadId, urls };
}

/** Finish a multipart upload with the ETags returned for each part. */
export async function completeMultipart(
  key: string,
  uploadId: string,
  parts: { PartNumber: number; ETag: string }[],
): Promise<void> {
  await client().send(
    new CompleteMultipartUploadCommand({
      Bucket: env.b2.bucket,
      Key: key,
      UploadId: uploadId,
      MultipartUpload: {
        Parts: parts
          .slice()
          .sort((a, b) => a.PartNumber - b.PartNumber),
      },
    }),
  );
}

/** Cancel a multipart upload (cleanup on failure/cancel). */
export async function abortMultipart(key: string, uploadId: string): Promise<void> {
  await client().send(
    new AbortMultipartUploadCommand({
      Bucket: env.b2.bucket,
      Key: key,
      UploadId: uploadId,
    }),
  );
}
