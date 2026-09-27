/** Routes that require an authenticated learner (used by middleware). */
export const PROTECTED_ROUTES = ['/home', '/history', '/passport', '/profile', '/quest', '/calibrate', '/admin'];

/**
 * `/passport/<id>` is the public share route and is intentionally NOT protected;
 * it never renders learner data without a real published record.
 */
export function isProtectedPath(pathname: string): boolean {
  if (pathname.startsWith('/passport/') && pathname !== '/passport') return false;
  return PROTECTED_ROUTES.some((route) => pathname === route || pathname.startsWith(`${route}/`));
}
