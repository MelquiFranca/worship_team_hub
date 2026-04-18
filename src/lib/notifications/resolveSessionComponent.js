import { normalizeString } from '../api/validation.js';

const COMBINING_MARKS_PATTERN = /[\u0300-\u036f]/g;

function normalizeComparableText(value) {
  const normalized = normalizeString(value);

  if (!normalized) {
    return '';
  }

  return normalized
    .normalize('NFD')
    .replace(COMBINING_MARKS_PATTERN, '')
    .toLowerCase()
    .replace(/\s+/g, ' ');
}

function getUsernameCandidates(user) {
  const candidates = new Set();
  const username = normalizeString(user?.username).toLowerCase();
  const email = normalizeString(user?.email).toLowerCase();
  const identifier = normalizeString(user?.identifier).toLowerCase();

  if (username) {
    candidates.add(username);
  }

  if (email) {
    candidates.add(email);

    const localPart = email.split('@')[0];
    if (localPart) {
      candidates.add(localPart);
    }
  }

  if (identifier) {
    candidates.add(identifier);
  }

  if (username.includes('@')) {
    const localPart = username.split('@')[0];
    if (localPart) {
      candidates.add(localPart);
    }
  }

  return candidates;
}

function getNameCandidates(user) {
  const candidates = new Set();
  const names = [user?.name, user?.displayName];

  for (const entry of names) {
    const normalized = normalizeComparableText(entry);

    if (normalized) {
      candidates.add(normalized);
    }
  }

  return candidates;
}

export async function resolveSessionComponent(componentsCollection, groupId, user) {
  const usernameCandidates = getUsernameCandidates(user);
  const nameCandidates = getNameCandidates(user);

  if (!usernameCandidates.size && !nameCandidates.size) {
    return null;
  }

  const components = await componentsCollection
    .find({ groupId })
    .project({ _id: 1, username: 1, fullName: 1 })
    .toArray();

  const byUsername = components.find((component) => {
    const componentUsername = normalizeString(component?.username).toLowerCase();
    return componentUsername && usernameCandidates.has(componentUsername);
  });

  if (byUsername) {
    return byUsername;
  }

  const byName = components.find((component) => {
    const componentName = normalizeComparableText(component?.fullName);
    return componentName && nameCandidates.has(componentName);
  });

  return byName || null;
}
