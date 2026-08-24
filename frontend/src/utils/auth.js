import axios from 'axios';

// Centralized session handling.
//
// Two changes from the old approach (which used localStorage +
// a separately-set "isAdmin" string):
//
// 1. sessionStorage instead of localStorage.
//    localStorage is shared by every tab/window open on the same origin.
//    sessionStorage is scoped to a single tab. Logging in as admin in one
//    tab no longer changes what other open tabs (e.g. a plain user
//    browsing session) see.
//
// 2. The admin flag is read out of the JWT payload, not stored as its
//    own separate value. The backend now signs `is_admin` into the token
//    itself (see backend/main.py `/login`), so a user can no longer grant
//    themselves admin by editing storage in devtools — there is no
//    freestanding "isAdmin" key left to edit. Without the server's secret
//    key they cannot produce a token that decodes to is_admin: true.

const TOKEN_KEY = 'token';
const EMAIL_KEY = 'userEmail';

/**
 * Decode a JWT payload WITHOUT verifying the signature. This is safe to do
 * client-side purely for reading claims to drive the UI (which page to
 * show), because the signature was already verified server-side when the
 * token was issued, and every real admin action is re-checked against the
 * database on the backend (ensure_admin) regardless of what this decode
 * says. This is a display convenience, not a security boundary.
 */
function decodeToken(token) {
  try {
    const payload = token.split('.')[1];
    const base64 = payload.replace(/-/g, '+').replace(/_/g, '/');
    const json = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + c.charCodeAt(0).toString(16).padStart(2, '0'))
        .join('')
    );
    return JSON.parse(json);
  } catch (err) {
    return null;
  }
}

export function setSession(token, email) {
  sessionStorage.setItem(TOKEN_KEY, token);
  if (email) sessionStorage.setItem(EMAIL_KEY, email);
}

export function clearSession() {
  sessionStorage.removeItem(TOKEN_KEY);
  sessionStorage.removeItem(EMAIL_KEY);
}

export function getToken() {
  return sessionStorage.getItem(TOKEN_KEY);
}

export function getUserEmail() {
  return sessionStorage.getItem(EMAIL_KEY);
}

export function isLoggedIn() {
  return !!getToken();
}

/**
 * Is the current tab's session an admin session? Derived fresh from the
 * token's own payload every time it's called — there is nothing else to
 * go stale or be independently tampered with.
 */
export function isAdmin() {
  const token = getToken();
  if (!token) return false;
  const payload = decodeToken(token);
  return !!payload?.is_admin;
}

/**
 * Optional stronger check: ask the backend who the token actually belongs
 * to right now, straight from the database, instead of trusting the
 * token's claims. Use this right before rendering the admin dashboard so
 * a revoked/downgraded admin can't keep using a stale-but-unexpired token.
 * Returns the /user/me payload, or null if the check fails for any reason
 * (expired token, network error, etc).
 *
 * Uses axios (not the native fetch) specifically so it picks up the
 * axios.defaults.baseURL set in main.jsx. A plain fetch('/user/me') would
 * resolve against the frontend's own origin instead of the backend and
 * 404 in dev, which made this check always fail and bounce admins back
 * to '/' even with a valid token.
 */
export async function verifySessionWithServer() {
  const token = getToken();
  if (!token) return null;
  try {
    const res = await axios.get('/user/me', {
      headers: { Authorization: `Bearer ${token}` },
    });
    return res.data;
  } catch (err) {
    return null;
  }
}