/** Browser AES-256-GCM encryption for Flutterwave v4 card fields. */

function cleanKey(value: string) {
  let v = value.trim();
  if (
    (v.startsWith('"') && v.endsWith('"')) ||
    (v.startsWith("'") && v.endsWith("'"))
  ) {
    v = v.slice(1, -1).trim();
  }
  return v;
}

export function flutterwavePublicEncryptionKey() {
  return cleanKey(process.env.NEXT_PUBLIC_FLUTTERWAVE_ENCRYPTION_KEY || "");
}

export function flutterwaveGenerateNonce(length = 12) {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  const bytes = new Uint8Array(length);
  crypto.getRandomValues(bytes);
  let out = "";
  for (let i = 0; i < length; i++) out += chars[bytes[i] % chars.length];
  return out;
}

function toBase64(buffer: ArrayBuffer) {
  const bytes = new Uint8Array(buffer);
  let binary = "";
  for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
  return btoa(binary);
}

export async function flutterwaveEncryptSecret(plain: string, nonce: string, keyB64?: string) {
  if (nonce.length !== 12) {
    throw new Error("Nonce must be exactly 12 characters long");
  }
  const token = keyB64 || flutterwavePublicEncryptionKey();
  if (!token) {
    throw new Error("Missing Flutterwave encryption key.");
  }
  const subtle = globalThis.crypto?.subtle;
  if (!subtle) {
    throw new Error("Secure encryption is not available in this browser.");
  }
  const decoded = Uint8Array.from(atob(token), (c) => c.charCodeAt(0));
  const keyBytes = new Uint8Array(decoded.buffer.slice(decoded.byteOffset, decoded.byteOffset + decoded.byteLength));
  const key = await subtle.importKey("raw", keyBytes, { name: "AES-GCM" }, false, ["encrypt"]);
  const iv = new Uint8Array(new TextEncoder().encode(nonce));
  const data = new Uint8Array(new TextEncoder().encode(plain));
  const encrypted = await subtle.encrypt({ name: "AES-GCM", iv }, key, data);
  return toBase64(encrypted);
}

export async function flutterwaveEncryptCard(fields: {
  number: string;
  expiryMonth: string;
  expiryYear: string;
  cvv: string;
}) {
  const nonce = flutterwaveGenerateNonce();
  const [encrypted_card_number, encrypted_expiry_month, encrypted_expiry_year, encrypted_cvv] =
    await Promise.all([
      flutterwaveEncryptSecret(fields.number, nonce),
      flutterwaveEncryptSecret(fields.expiryMonth, nonce),
      flutterwaveEncryptSecret(fields.expiryYear, nonce),
      flutterwaveEncryptSecret(fields.cvv, nonce),
    ]);
  return {
    nonce,
    encrypted_card_number,
    encrypted_expiry_month,
    encrypted_expiry_year,
    encrypted_cvv,
  };
}
