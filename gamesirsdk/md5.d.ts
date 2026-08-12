/**
 * Minimal MD5 (RFC 1321) over bytes.
 *
 * WebCrypto deliberately omits MD5, but the GameSir Connect share-code format
 * derives its AES key with OpenSSL's legacy `EVP_BytesToKey(MD5, …)`
 * (RESEARCH.md §2.6), so the codec needs this ~1 KB implementation. Not for
 * any security purpose — key-derivation compatibility only.
 */
export declare function md5(input: Uint8Array): Uint8Array;
