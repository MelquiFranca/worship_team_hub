import { NextResponse } from 'next/server';

export function createApiErrorPayload(code, message, details = null) {
  const payload = {
    error: {
      code,
      message
    }
  };

  if (details && typeof details === 'object') {
    payload.error.details = details;
  }

  return payload;
}

export function jsonApiError(message, status = 400, code = 'BAD_REQUEST', details = null) {
  return NextResponse.json(createApiErrorPayload(code, message, details), { status });
}
