import crypto from 'node:crypto';

const PASSWORD_ALGORITHM = 'pbkdf2';
const PASSWORD_DIGEST = 'sha256';
const DEFAULT_ITERATIONS = 210000;
const DEFAULT_KEY_LENGTH = 32;
const DEFAULT_SALT_LENGTH = 16;

function generateSalt(length = DEFAULT_SALT_LENGTH) {
  return crypto.randomBytes(length).toString('base64url');
}

function derivePasswordKey(password, salt, iterations, keyLength, digest) {
  return crypto.pbkdf2Sync(String(password), String(salt), iterations, keyLength, digest);
}

export function createPasswordHash(password, options = {}) {
  const iterations = Number.isInteger(options.iterations) ? options.iterations : DEFAULT_ITERATIONS;
  const keyLength = Number.isInteger(options.keyLength) ? options.keyLength : DEFAULT_KEY_LENGTH;
  const digest = options.digest || PASSWORD_DIGEST;
  const salt = options.salt || generateSalt();
  const derivedKey = derivePasswordKey(password, salt, iterations, keyLength, digest);

  return [
    PASSWORD_ALGORITHM,
    digest,
    String(iterations),
    salt,
    derivedKey.toString('base64url')
  ].join('$');
}

export function verifyPassword(password, encodedHash) {
  if (typeof encodedHash !== 'string' || !encodedHash.includes('$')) {
    return false;
  }

  const parsed = parsePasswordHash(encodedHash);

  if (
    !parsed ||
    parsed.algorithm !== PASSWORD_ALGORITHM ||
    !parsed.digest ||
    !Number.isFinite(parsed.iterations) ||
    parsed.iterations <= 0 ||
    !parsed.salt ||
    !parsed.hash
  ) {
    return false;
  }

  try {
    const expectedBuffer = Buffer.from(parsed.hash, 'base64url');

    if (expectedBuffer.length === 0) {
      return false;
    }

    const actualKey = derivePasswordKey(
      password,
      parsed.salt,
      parsed.iterations,
      expectedBuffer.length,
      parsed.digest
    );

    if (actualKey.length !== expectedBuffer.length) {
      return false;
    }

    return crypto.timingSafeEqual(actualKey, expectedBuffer);
  } catch {
    return false;
  }
}

export function parsePasswordHash(encodedHash) {
  if (typeof encodedHash !== 'string') {
    return null;
  }

  const [algorithm, digest, iterationsString, salt, hash] = encodedHash.split('$');

  if (!algorithm || !digest || !iterationsString || !salt || !hash) {
    return null;
  }

  return {
    algorithm,
    digest,
    iterations: Number.parseInt(iterationsString, 10),
    salt,
    hash
  };
}
