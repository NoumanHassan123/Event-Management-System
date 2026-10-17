export function getAuthDestination(from) {
  const pathname = from?.pathname
  if (pathname !== '/my-events' && !(typeof pathname === 'string' && /^\/events\/[^/]+$/.test(pathname))) {
    return '/events'
  }
  return {
    pathname,
    search: typeof from.search === 'string' ? from.search : '',
    hash: typeof from.hash === 'string' ? from.hash : '',
  }
}
