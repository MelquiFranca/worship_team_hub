import { MongoClient } from 'mongodb';

const DEFAULT_DB_NAME = 'escalas_app_local';

const globalForMongo = globalThis;

function getMongoCache() {
  if (!globalForMongo.__escalasAppMongoCache) {
    globalForMongo.__escalasAppMongoCache = {
      client: null,
      clientPromise: null,
      indexesPromise: null
    };
  }

  return globalForMongo.__escalasAppMongoCache;
}

function getMongoUri() {
  const uri = process.env.MONGODB_URI?.trim();

  if (!uri) {
    throw new Error('MongoDB nao configurado.');
  }

  return uri;
}

export function getMongoDatabaseName() {
  return process.env.MONGODB_DB_NAME?.trim() || DEFAULT_DB_NAME;
}

export async function getMongoClient() {
  const cache = getMongoCache();

  if (cache.clientPromise) {
    return cache.clientPromise;
  }

  const uri = getMongoUri();
  const client = new MongoClient(uri, {
    maxPoolSize: 10
  });

  cache.client = client;
  cache.clientPromise = client.connect().catch(() => {
    cache.client = null;
    cache.clientPromise = null;
    throw new Error('MongoDB indisponivel.');
  });

  return cache.clientPromise;
}

export async function getMongoDb() {
  const client = await getMongoClient();
  return client.db(getMongoDatabaseName());
}

async function ensureMongoIndexes(db) {
  const cache = getMongoCache();

  if (cache.indexesPromise) {
    return cache.indexesPromise;
  }

  cache.indexesPromise = (async () => {
    await Promise.all([
      db.collection('components').createIndex(
        { groupId: 1, normalizedUsername: 1 },
        { unique: true, name: 'components_group_username_unique' }
      ),
      db.collection('components').createIndex(
        { groupId: 1, createdAt: -1 },
        { name: 'components_group_created_at' }
      ),
      db.collection('scales').createIndex(
        { groupId: 1, date: -1, createdAt: -1 },
        { name: 'scales_group_date_created_at' }
      )
    ]);
  })().catch(() => {
    cache.indexesPromise = null;
    throw new Error('MongoDB indisponivel.');
  });

  return cache.indexesPromise;
}

export async function getMongoCollections() {
  const db = await getMongoDb();
  await ensureMongoIndexes(db);

  return {
    db,
    components: db.collection('components'),
    scales: db.collection('scales')
  };
}
