import axios from 'axios';


const TOKEN_KEY = 'token';
const EMAIL_KEY = 'userEmail';


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


export function isAdmin() {
  const token = getToken();
  if (!token) return false;
  const payload = decodeToken(token);
  return !!payload?.is_admin;
}


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