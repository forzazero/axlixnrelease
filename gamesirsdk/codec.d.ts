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
export declare const SHARE_CODE_PREFIX = "GAMESIR:";
/** Decoded share-code payload. `diff` is a sparse overlay of non-default settings. */
export interface ConnectProfile {
    v: number;
    appVer?: string;
    /** Import-validation gate, e.g. "G7ProCE" — must match the target device. */
    productType?: string;
    ts?: number;
    /** Button remaps, trigger curves, deadzones, rumble strength, report rate, … */
    diff?: Record<string, unknown>;
    [key: string]: unknown;
}
/**
 * OpenSSL legacy EVP_BytesToKey with MD5, no salt, 1 iteration:
 * D1 = MD5(password), Dn = MD5(Dn-1 ‖ password); concatenate until
 * keyLen + ivLen bytes are available.
 */
export declare function evpBytesToKey(password: Uint8Array, keyLen?: number, ivLen?: number): {
    key: Uint8Array;
    iv: Uint8Array;
};
/**
 * Decode a `GAMESIR:` share code to its profile JSON.
 * Throws on a bad prefix, corrupt base64/ciphertext, or malformed payload.
 */
export declare function decodeShareCode(code: string): Promise<ConnectProfile>;
/** Encode a profile as a `GAMESIR:` share code importable by the official app. */
export declare function encodeShareCode(profile: ConnectProfile): Promise<string>;
