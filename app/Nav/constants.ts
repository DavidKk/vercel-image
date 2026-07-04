/**
 * Route prefixes that should hide global Nav
 * If the current path starts with these prefixes, Nav will not be displayed
 */
export const HIDDEN_ROUTES: string[] = []

export const DEFAULT_NAV = {
  $tools: [
    { name: 'Studio', href: '/studio' },
    // Hidden for now (kept for later re-enable):
    // { name: 'Mosaic', href: '/mosaic' },
    // { name: 'Mosaic Editor', href: '/mosaic/editor' },
  ],
}
