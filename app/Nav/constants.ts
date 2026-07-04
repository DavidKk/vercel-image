/**
 * Route prefixes that should hide global Nav (these pages provide their own chrome)
 */
export const HIDDEN_ROUTES: string[] = ['/studio', '/mosaic/editor']

export const DEFAULT_NAV = {
  $tools: [
    { name: 'Studio', href: '/studio' },
    // Hidden for now (kept for later re-enable):
    // { name: 'Mosaic', href: '/mosaic' },
    // { name: 'Mosaic Editor', href: '/mosaic/editor' },
  ],
}
