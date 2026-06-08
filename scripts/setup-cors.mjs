import { S3Client, PutBucketCorsCommand, GetBucketCorsCommand } from "@aws-sdk/client-s3";

const s3 = new S3Client({
  region: process.env.S3_REGION,
  endpoint: process.env.S3_ENDPOINT,
  credentials: {
    accessKeyId: process.env.S3_ACCESS_KEY_ID,
    secretAccessKey: process.env.S3_SECRET_ACCESS_KEY,
  },
  forcePathStyle: false,
});

try {
  console.log("Bucket:", process.env.S3_BUCKET);
  await s3.send(new PutBucketCorsCommand({
    Bucket: process.env.S3_BUCKET,
    CORSConfiguration: {
      CORSRules: [{
        AllowedOrigins: ["https://aiwedding.space", "http://localhost:3000"],
        AllowedMethods: ["PUT", "GET", "HEAD"],
        AllowedHeaders: ["*"],
        MaxAgeSeconds: 3600,
      }],
    },
  }));
  const v = await s3.send(new GetBucketCorsCommand({ Bucket: process.env.S3_BUCKET }));
  console.log("✅ CORS OK:", JSON.stringify(v.CORSRules[0].AllowedOrigins));
} catch(e) {
  console.error("FAIL:", e.message);
  process.exit(1);
}
