const ADOBE_CLIENT_ID = '3c4d6d13e656458ab1801f036a51c81a';

const ADOBE_AUTHORIZE_URL = 'https://ims-na1.adobelogin.com/ims/authorize/v2';
const ADOBE_TOKEN_URL = 'https://ims-na1.adobelogin.com/ims/token/v3';
const ADOBE_USERINFO_URL = 'https://ims-na1.adobelogin.com/ims/userinfo/v2';

const REDIRECT_URI = window.location.origin + window.location.pathname;

const SCOPES = 'openid,AdobeID,read_organizations';

function base64UrlEncode(buffer) {
  return btoa(String.fromCharCode(...new Uint8Array(buffer)))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

function randomString(length = 64) {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~';
  const random = new Uint8Array(length);
  crypto.getRandomValues(random);

  return Array.from(random)
    .map((value) => chars[value % chars.length])
    .join('');
}

async function sha256(value) {
  return crypto.subtle.digest(
    'SHA-256',
    new TextEncoder().encode(value),
  );
}

async function login() {
  const state = randomString(32);
  const codeVerifier = randomString(64);

  const hash = await sha256(codeVerifier);
  const codeChallenge = base64UrlEncode(hash);

  sessionStorage.setItem('adobe_oauth_state', state);
  sessionStorage.setItem('adobe_code_verifier', codeVerifier);

  const params = new URLSearchParams({
    client_id: ADOBE_CLIENT_ID,
    redirect_uri: REDIRECT_URI,
    scope: SCOPES,
    state,
    response_type: 'code',
    code_challenge: codeChallenge,
    code_challenge_method: 'S256',
  });

  window.location.href = `${ADOBE_AUTHORIZE_URL}?${params.toString()}`;
}

async function handleCallback() {
  const params = new URLSearchParams(window.location.search);

  const code = params.get('code');
  const returnedState = params.get('state');
  const error = params.get('error');

  if (error) {
    throw new Error(`Adobe authentication error: ${error}`);
  }

  if (!code) {
    return null;
  }

  const savedState = sessionStorage.getItem('adobe_oauth_state');
  const codeVerifier = sessionStorage.getItem('adobe_code_verifier');

  if (!savedState || returnedState !== savedState) {
    throw new Error('Invalid OAuth state.');
  }

  if (!codeVerifier) {
    throw new Error('Missing PKCE code verifier.');
  }

  const body = new URLSearchParams({
    code,
    grant_type: 'authorization_code',
    code_verifier: codeVerifier,
  });

  body.append('client_id', ADOBE_CLIENT_ID);

  const tokenResponse = await fetch(ADOBE_TOKEN_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body,
  });

  if (!tokenResponse.ok) {
    const message = await tokenResponse.text();
    throw new Error(`Token request failed: ${message}`);
  }

  const tokens = await tokenResponse.json();

  sessionStorage.setItem('adobe_access_token', tokens.access_token);

  sessionStorage.removeItem('adobe_oauth_state');
  sessionStorage.removeItem('adobe_code_verifier');

  window.history.replaceState({}, document.title, REDIRECT_URI);

  return tokens;
}

async function getUserInfo() {
  const accessToken = sessionStorage.getItem('adobe_access_token');

  if (!accessToken) {
    return null;
  }

  const response = await fetch(
    `${ADOBE_USERINFO_URL}?client_id=${encodeURIComponent(ADOBE_CLIENT_ID)}`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    },
  );

  if (!response.ok) {
    sessionStorage.removeItem('adobe_access_token');
    return null;
  }

  return response.json();
}

function logout() {
  sessionStorage.removeItem('adobe_access_token');
  sessionStorage.removeItem('adobe_oauth_state');
  sessionStorage.removeItem('adobe_code_verifier');

  window.location.reload();
}

export {
  login,
  logout,
  handleCallback,
  getUserInfo,
};