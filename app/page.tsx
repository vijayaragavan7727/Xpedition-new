import { redirect } from 'next/navigation';

/**
 * The root URL is not a page of its own. middleware.ts sends signed-in learners
 * to /home and everyone else to /login (the current sign-in / sign-up screen).
 * This fallback only runs if the middleware did not, and never shows a
 * separate landing screen.
 */
export default function RootPage() {
  redirect('/login');
}
