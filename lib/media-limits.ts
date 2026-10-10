export const MAX_UPLOAD_BYTES = 10 * 1024 * 1024;

// Base64 is stored as a string, so leave room below DynamoDB's 400 KiB item limit.
export const MAX_DATA_URL_CHARS = 340_000;
