/**
 * One-time: apply CORS rules to the Backblaze B2 bucket so the browser can
 * upload directly via presigned PUT URLs.
 *
 * Run once (Node 20+):
 *   node --env-file=.env.local scripts/b2-cors.mjs
 */
import { S3Client, PutBucketCorsCommand, GetBucketCorsCommand } from "@aws-sdk/client-s3";

const { B2_KEY_ID, B2_APP_KEY, B2_BUCKET, B2_ENDPOINT, B2_REGION } = process.env;

if (!B2_KEY_ID || !B2_APP_KEY || !B2_BUCKET || !B2_ENDPOINT) {
  console.error("Missing B2_* env vars. Run: node --env-file=.env.local scripts/b2-cors.mjs");
  process.exit(1);
}

const client = new S3Client({
  region: B2_REGION || "eu-central-003",
  endpoint: `https://${B2_ENDPOINT}`,
  credentials: { accessKeyId: B2_KEY_ID, secretAccessKey: B2_APP_KEY },
});

const CORSRules = [
  {
    AllowedOrigins: [
      "https://rentgen.az",
      "https://www.rentgen.az",
      "http://localhost:3000",
    ],
    AllowedMethods: ["GET", "PUT", "HEAD"],
    AllowedHeaders: ["*"],
    ExposeHeaders: ["ETag"],
    MaxAgeSeconds: 3600,
  },
];

await client.send(
  new PutBucketCorsCommand({ Bucket: B2_BUCKET, CORSConfiguration: { CORSRules } }),
);
console.log("✓ CORS applied to bucket:", B2_BUCKET);

const check = await client.send(new GetBucketCorsCommand({ Bucket: B2_BUCKET }));
console.log("Current rules:", JSON.stringify(check.CORSRules, null, 2));
