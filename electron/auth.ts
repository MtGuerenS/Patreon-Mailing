import { BrowserWindow, session, net, safeStorage } from "electron";
import { store } from "./store";

const REDIRECT_URI = "http://localhost:54321/callback";

function getCredentials() {
  return {
    clientId: process.env.PATREON_CLIENT_ID ?? '',
    clientSecret: process.env.PATREON_CLIENT_SECRET ?? '',
  }
}

let authWindow: BrowserWindow | null = null;

export async function openPatreonAuth(win: BrowserWindow | null) {
  try {
    authWindow?.webContents.session.webRequest.onBeforeRequest(
      { urls: ["http://localhost:54321/*"] },
      null,
    );
  } catch {}

  const { clientId } = getCredentials();
  const params = new URLSearchParams({
    response_type: "code",
    client_id: clientId,
    redirect_uri: REDIRECT_URI,
    scope:
      "identity identity[email] campaigns campaigns.members campaigns.members.address",
  });

  authWindow = new BrowserWindow({
    width: 600,
    height: 700,
    parent: win ?? undefined,
    modal: true,
    webPreferences: { nodeIntegration: false, contextIsolation: true },
  });

  authWindow.webContents.session.webRequest.onBeforeRequest(
    { urls: ["http://localhost:54321/*"] },
    (details, callback) => {
      callback({ cancel: true });

      const url = new URL(details.url);
      const code = url.searchParams.get("code");
      const error = url.searchParams.get("error");

      try {
        authWindow?.webContents.session.webRequest.onBeforeRequest(
          { urls: ["http://localhost:54321/*"] },
          null,
        );
      } catch {}

      authWindow?.close();

      if (error || !code) {
        win?.webContents.send(
          "patreon-auth-error",
          error ?? "No code received",
        );
        return;
      }

      exchangeCodeForToken(code)
        .then((tokens) => {
          saveTokens(tokens);
          win?.webContents.send("patreon-auth-success", tokens);
        })
        .catch((err) =>
          win?.webContents.send("patreon-auth-error", (err as Error).message),
        );
    },
  );

  await authWindow.webContents.session.clearStorageData();
  authWindow.loadURL(`https://www.patreon.com/oauth2/authorize?${params}`);
  authWindow.on("closed", () => {
    try {
      session.defaultSession.webRequest.onBeforeRequest(
        { urls: ["http://localhost:54321/*"] },
        null,
      );
    } catch {}
    authWindow = null;
  });
}

async function exchangeCodeForToken(code: string): Promise<{
  access_token: string;
  refresh_token: string;
  expires_in: number;
}> {
  const { clientId, clientSecret } = getCredentials();
  const body = new URLSearchParams({
    code,
    grant_type: "authorization_code",
    client_id: clientId,
    client_secret: clientSecret,
    redirect_uri: REDIRECT_URI,
  });

  const response = await net.fetch("https://www.patreon.com/api/oauth2/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: body.toString(),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Token exchange failed: ${response.status} — ${text}`);
  }

  return response.json();
}

export function saveTokens(tokens: {
  access_token: string;
  refresh_token: string;
  expires_in: number;
}) {
  if (safeStorage.isEncryptionAvailable()) {
    store.set(
      "access_token",
      safeStorage.encryptString(tokens.access_token).toString("base64"),
    );
    store.set(
      "refresh_token",
      safeStorage.encryptString(tokens.refresh_token).toString("base64"),
    );
  } else {
    store.set("access_token", tokens.access_token);
    store.set("refresh_token", tokens.refresh_token);
  }
  store.set("token_expires_at", Date.now() + tokens.expires_in * 1000);
}

export function loadTokens(): {
  access_token: string;
  refresh_token: string;
} | null {
  try {
    const raw_access = store.get("access_token") as string;
    const raw_refresh = store.get("refresh_token") as string;
    if (!raw_access || !raw_refresh) return null;

    if (safeStorage.isEncryptionAvailable()) {
      return {
        access_token: safeStorage.decryptString(
          Buffer.from(raw_access, "base64"),
        ),
        refresh_token: safeStorage.decryptString(
          Buffer.from(raw_refresh, "base64"),
        ),
      };
    }
    return { access_token: raw_access, refresh_token: raw_refresh };
  } catch {
    return null;
  }
}

export function isTokenExpired(): boolean {
  const expires_at = store.get("token_expires_at") as number;
  if (!expires_at) return true;
  return Date.now() >= expires_at - 60_000;
}

export function clearTokens() {
  store.delete("access_token");
  store.delete("refresh_token");
  store.delete("token_expires_at");
}
