/**
 * A full page load to `path`, dropping every client-side state.
 * Next.js (Cache Components) keeps pages you navigate away from alive but hidden (React Activity),
 * so a client navigation would carry one user's open dialogs and typed passwords over to the next.
 */
export function reloadTo(path: string): void {
  window.location.replace(path);
}
