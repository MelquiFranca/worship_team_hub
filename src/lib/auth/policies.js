const LOGIN_PATHS = Object.freeze({
  user: '/login',
  admin: '/admin/login'
});

const PUBLIC_AUTH_PATHS = new Set(['/login', '/admin/login', '/api/auth/login', '/api/auth/refresh']);

const GROUP_MANAGEMENT_PATHS = new Set([
  '/cadastro-escalas',
  '/cadastro-componentes',
  '/configuracoes-gerais-grupo'
]);

const MEMBER_PATHS = new Set(['/escalas', '/componentes', '/editar-perfil', '/minha-indisponibilidade']);

function normalizePathname(pathname) {
  if (!pathname) {
    return '/';
  }

  if (pathname.length > 1 && pathname.endsWith('/')) {
    return pathname.slice(0, -1);
  }

  return pathname;
}

export function isPublicAuthPath(pathname) {
  return PUBLIC_AUTH_PATHS.has(normalizePathname(pathname));
}

export function isAdminProtectedPath(pathname) {
  const normalizedPathname = normalizePathname(pathname);
  return normalizedPathname === '/admin' || normalizedPathname.startsWith('/admin/');
}

export function getRoutePolicy(pathname) {
  const normalizedPathname = normalizePathname(pathname);

  if (isAdminProtectedPath(normalizedPathname)) {
    return {
      name: 'admin',
      area: 'admin',
      loginPath: LOGIN_PATHS.admin,
      allowedPairs: [{ aud: 'admin-panel', role: 'admin' }]
    };
  }

  if (GROUP_MANAGEMENT_PATHS.has(normalizedPathname)) {
    return {
      name: 'group-management',
      area: 'app',
      loginPath: LOGIN_PATHS.user,
      allowedPairs: [{ aud: 'group-app', role: 'group_owner' }]
    };
  }

  if (MEMBER_PATHS.has(normalizedPathname)) {
    return {
      name: 'member',
      area: 'app',
      loginPath: LOGIN_PATHS.user,
      allowedPairs: [
        { aud: 'group-app', role: 'group_owner' },
        { aud: 'component-app', role: 'component' }
      ]
    };
  }

  return null;
}

export function getLoginPathForPolicy(policy) {
  return policy?.loginPath ?? LOGIN_PATHS.user;
}
