import "server-only";
import crypto from "crypto";

// Shared OAuth2 for any Google API a service account can call (GA4 Data
// API, Search Console API). No `googleapis` dependency: the JWT-bearer
// flow is a handful of lines with the built-in `crypto` module, and this
// project only ever needs a couple of read-only endpoints.

type ServiceAccountConfig = {
  clientEmail: string;
  privateKey: string;
};

export function getServiceAccountConfig(): ServiceAccountConfig | null {
  const clientEmail = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  const privateKeyRaw = process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY;
  if (!clientEmail || !privateKeyRaw) return null;
  // Env vars can't hold literal newlines cleanly, so the convention
  // (same one used for other JSON/PEM secrets on Vercel) is to store
  // \n escape sequences and unescape them here.
  return { clientEmail, privateKey: privateKeyRaw.replace(/\\n/g, "\n") };
}

function base64url(input: Buffer | string) {
  return Buffer.from(input)
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

function signJwt(header: object, payload: object, privateKeyPem: string) {
  const signingInput = `${base64url(JSON.stringify(header))}.${base64url(JSON.stringify(payload))}`;
  const signature = crypto.sign("RSA-SHA256", Buffer.from(signingInput), privateKeyPem);
  return `${signingInput}.${base64url(signature)}`;
}

export async function getGoogleAccessToken(scope: string): Promise<string> {
  const config = getServiceAccountConfig();
  if (!config) throw new Error("Google service account no configurado.");

  const now = Math.floor(Date.now() / 1000);
  const assertion = signJwt(
    { alg: "RS256", typ: "JWT" },
    {
      iss: config.clientEmail,
      scope,
      aud: "https://oauth2.googleapis.com/token",
      iat: now,
      exp: now + 3600,
    },
    config.privateKey,
  );

  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion,
    }),
  });

  if (!response.ok) {
    throw new Error(`No se pudo autenticar con Google (${response.status}): ${await response.text()}`);
  }

  const data = (await response.json()) as { access_token: string };
  return data.access_token;
}
