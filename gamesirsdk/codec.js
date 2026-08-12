import { md5 } from './md5.js';
/**
 * GameSir Connect share-code codec (RESEARCH.md §2.6, ported from
 * KerbalSpace/gamesir-connect-codec).
 *
 * Wire format:  "GAMESIR:" + base64( AES-256-CBC( base64( gzip( JSON ) ) ) )
 *
 * The AES plaintext is itself base64 *text* (of the gzipped JSON) — an app
 * quirk the codec must reproduce byte-for-byte. Key + IV come from OpenSSL's
 * legacy `EVP_BytesToKey(MD5, no salt, 1 iteration)` with the app-wide
 * password "SZHJC"; PKCS#7 padding (WebCrypto's AES-CBC default). No salt or
 * random IV, so encoding is deterministic for identical gzip output.
 *
 * Runs anywhere with WebCrypto + CompressionStream: all modern browsers,
 * Node 18+, Bun. Not WebKit-restricted — profiles are plain data.
 */
export const SHARE_CODE_PREFIX = 'GAMESIR:';
/** Hardcoded app-wide password (not a secret — shipped in the official app). */
const PASSWORD = 'SZHJC';
// ---- helpers ----
function bytesToBase64(bytes) {
    let bin = '';
    const CHUNK = 0x8000; // avoid call-stack limits on large arrays
    for (let i = 0; i < bytes.length; i += CHUNK) {
        bin += String.fromCharCode(...bytes.subarray(i, i + CHUNK));
    }
    return btoa(bin);
}
function base64ToBytes(b64) {
    const bin = atob(b64);
    const bytes = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++)
        bytes[i] = bin.charCodeAt(i);
    return bytes;
}
/**
 * OpenSSL legacy EVP_BytesToKey with MD5, no salt, 1 iteration:
 * D1 = MD5(password), Dn = MD5(Dn-1 ‖ password); concatenate until
 * keyLen + ivLen bytes are available.
 */
export function evpBytesToKey(password, keyLen = 32, ivLen = 16) {
    const need = keyLen + ivLen;
    const material = new Uint8Array(need + 15); // room for a whole final digest
    let filled = 0;
    let prev = new Uint8Array(0);
    while (filled < need) {
        const round = new Uint8Array(prev.length + password.length);
        round.set(prev);
        round.set(password, prev.length);
        prev = md5(round);
        material.set(prev.subarray(0, Math.min(prev.length, material.length - filled)), filled);
        filled += prev.length;
    }
    return { key: material.slice(0, keyLen), iv: material.slice(keyLen, keyLen + ivLen) };
}
async function pipeThrough(bytes, transform) {
    const stream = new Blob([bytes]).stream().pipeThrough(transform);
    return new Uint8Array(await new Response(stream).arrayBuffer());
}
async function aesKey(usage) {
    const derived = evpBytesToKey(new TextEncoder().encode(PASSWORD));
    const key = await crypto.subtle.importKey('raw', derived.key, { name: 'AES-CBC' }, false, [usage]);
    return { key, iv: derived.iv };
}
// ---- public API ----
/**
 * Decode a `GAMESIR:` share code to its profile JSON.
 * Throws on a bad prefix, corrupt base64/ciphertext, or malformed payload.
 */
export async function decodeShareCode(code) {
    const trimmed = code.trim();
    if (!trimmed.toUpperCase().startsWith(SHARE_CODE_PREFIX)) {
        throw new Error(`Not a GameSir share code (missing "${SHARE_CODE_PREFIX}" prefix)`);
    }
    const ciphertext = base64ToBytes(trimmed.slice(SHARE_CODE_PREFIX.length));
    const { key, iv } = await aesKey('decrypt');
    const plain = new Uint8Array(await crypto.subtle.decrypt({ name: 'AES-CBC', iv: iv }, key, ciphertext));
    // Plaintext is base64 text of the gzipped JSON.
    const gzipped = base64ToBytes(new TextDecoder().decode(plain));
    const json = await pipeThrough(gzipped, new DecompressionStream('gzip'));
    return JSON.parse(new TextDecoder().decode(json));
}
/** Encode a profile as a `GAMESIR:` share code importable by the official app. */
export async function encodeShareCode(profile) {
    const json = new TextEncoder().encode(JSON.stringify(profile));
    const gzipped = await pipeThrough(json, new CompressionStream('gzip'));
    const plain = new TextEncoder().encode(bytesToBase64(gzipped));
    const { key, iv } = await aesKey('encrypt');
    const ciphertext = new Uint8Array(await crypto.subtle.encrypt({ name: 'AES-CBC', iv: iv }, key, plain));
    return SHARE_CODE_PREFIX + bytesToBase64(ciphertext);
}
//# sourceMappingURL=codec.js.map