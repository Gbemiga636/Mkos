/** Browser-side AES-256-GCM matching Flutterwave's documented encryptAES helper. */

export function flutterwaveGenerateNonce(length = 12) {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  const randomValues = new Uint8Array(length);
  crypto.getRandomValues(randomValues);
  let result = "";
  for (let i = 0; i < length; i++) result += chars[randomValues[i]! % chars.length];
  return result;
}

async function encryptAES(data: string, token: string, nonce: string): Promise<string> {
  if (nonce.length !== 12) {
    throw new Error("Nonce must be exactly 12 characters long");
  }
  const decodedKeyBytes = Uint8Array.from(atob(token), (c) => c.charCodeAt(0));
  const key = await crypto.subtle.importKey(
    "raw",
    decodedKeyBytes,
    { name: "AES-GCM" },
    false,
    ["encrypt"]
  );
  const encryptedData = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv: new TextEncoder().encode(nonce) },
    key,
    new TextEncoder().encode(data)
  );
  return btoa(String.fromCharCode(...new Uint8Array(encryptedData)));
}

export async function flutterwaveEncryptCard(opts: {
  encryptionKey: string;
  cardNumber: string;
  expiryMonth: string;
  expiryYear: string;
  cvv: string;
}) {
  const key = opts.encryptionKey.trim();
  if (!key) {
    throw new Error("Flutterwave encryption key is missing. Add NEXT_PUBLIC_FLUTTERWAVE_ENCRYPTION_KEY.");
  }
  const nonce = flutterwaveGenerateNonce(12);
  const cardNumber = opts.cardNumber.replace(/\D/g, "");
  const [encrypted_card_number, encrypted_expiry_month, encrypted_expiry_year, encrypted_cvv] =
    await Promise.all([
      encryptAES(cardNumber, key, nonce),
      encryptAES(opts.expiryMonth, key, nonce),
      encryptAES(opts.expiryYear, key, nonce),
      encryptAES(opts.cvv, key, nonce),
    ]);
  return {
    nonce,
    encrypted_card_number,
    encrypted_expiry_month,
    encrypted_expiry_year,
    encrypted_cvv,
  };
}

export async function flutterwaveEncryptSecret(opts: {
  encryptionKey: string;
  value: string;
}) {
  const key = opts.encryptionKey.trim();
  const nonce = flutterwaveGenerateNonce(12);
  return {
    nonce,
    encrypted: await encryptAES(opts.value, key, nonce),
  };
}
