import { Buffer } from 'node:buffer';

export function base64UrlEncode(value) {
  const buffer = Buffer.isBuffer(value) ? value : Buffer.from(String(value), 'utf8');
  return buffer.toString('base64url');
}

export function base64UrlDecode(value) {
  return Buffer.from(String(value), 'base64url');
}

export function safeEqualStrings(left, right) {
  const leftBuffer = Buffer.from(String(left), 'utf8');
  const rightBuffer = Buffer.from(String(right), 'utf8');

  if (leftBuffer.length !== rightBuffer.length) {
    return false;
  }

  return leftBuffer.length === 0 ? true : Buffer.compare(leftBuffer, rightBuffer) === 0;
}

