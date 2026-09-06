import { LocalPrivateStorageDriver } from './local.storage';
import { S3StorageDriver } from './s3.storage';
export function documentStorage(root: string) {
  if (process.env.STORAGE_DRIVER === 's3') {
    const { S3_BUCKET: bucket, S3_ACCESS_KEY_ID: accessKeyId, S3_SECRET_ACCESS_KEY: secretAccessKey } = process.env;
    if (!bucket || !accessKeyId || !secretAccessKey) throw new Error('S3 configuration missing');
    return new S3StorageDriver({ bucket, accessKeyId, secretAccessKey, endpoint: process.env.S3_ENDPOINT, region: process.env.S3_REGION || 'auto', forcePathStyle: ['1','true','yes'].includes(process.env.S3_FORCE_PATH_STYLE || 'true') });
  }
  return new LocalPrivateStorageDriver(root);
}
