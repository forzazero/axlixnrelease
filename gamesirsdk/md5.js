/**
 * Minimal MD5 (RFC 1321) over bytes.
 *
 * WebCrypto deliberately omits MD5, but the GameSir Connect share-code format
 * derives its AES key with OpenSSL's legacy `EVP_BytesToKey(MD5, …)`
 * (RESEARCH.md §2.6), so the codec needs this ~1 KB implementation. Not for
 * any security purpose — key-derivation compatibility only.
 */
const S = [
    7, 12, 17, 22, 7, 12, 17, 22, 7, 12, 17, 22, 7, 12, 17, 22,
    5, 9, 14, 20, 5, 9, 14, 20, 5, 9, 14, 20, 5, 9, 14, 20,
    4, 11, 16, 23, 4, 11, 16, 23, 4, 11, 16, 23, 4, 11, 16, 23,
    6, 10, 15, 21, 6, 10, 15, 21, 6, 10, 15, 21, 6, 10, 15, 21,
];
// K[i] = floor(abs(sin(i+1)) * 2^32) — the RFC 1321 constant definition.
const K = new Uint32Array(64);
for (let i = 0; i < 64; i++)
    K[i] = Math.floor(Math.abs(Math.sin(i + 1)) * 4294967296);
function rotl(x, n) {
    return (x << n) | (x >>> (32 - n));
}
export function md5(input) {
    // Pad: 0x80, zeros, 64-bit little-endian bit length.
    const bitLen = input.length * 8;
    const paddedLen = ((input.length + 8) >> 6) * 64 + 64;
    const padded = new Uint8Array(paddedLen);
    padded.set(input);
    padded[input.length] = 0x80;
    const view = new DataView(padded.buffer);
    view.setUint32(paddedLen - 8, bitLen >>> 0, true);
    view.setUint32(paddedLen - 4, Math.floor(bitLen / 4294967296), true);
    let a0 = 0x67452301;
    let b0 = 0xefcdab89;
    let c0 = 0x98badcfe;
    let d0 = 0x10325476;
    const m = new Uint32Array(16);
    for (let block = 0; block < paddedLen; block += 64) {
        for (let i = 0; i < 16; i++)
            m[i] = view.getUint32(block + i * 4, true);
        let a = a0;
        let b = b0;
        let c = c0;
        let d = d0;
        for (let i = 0; i < 64; i++) {
            let f;
            let g;
            if (i < 16) {
                f = (b & c) | (~b & d);
                g = i;
            }
            else if (i < 32) {
                f = (d & b) | (~d & c);
                g = (5 * i + 1) % 16;
            }
            else if (i < 48) {
                f = b ^ c ^ d;
                g = (3 * i + 5) % 16;
            }
            else {
                f = c ^ (b | ~d);
                g = (7 * i) % 16;
            }
            const tmp = d;
            d = c;
            c = b;
            b = (b + rotl((a + f + K[i] + m[g]) | 0, S[i])) | 0;
            a = tmp;
        }
        a0 = (a0 + a) | 0;
        b0 = (b0 + b) | 0;
        c0 = (c0 + c) | 0;
        d0 = (d0 + d) | 0;
    }
    const digest = new Uint8Array(16);
    const out = new DataView(digest.buffer);
    out.setUint32(0, a0 >>> 0, true);
    out.setUint32(4, b0 >>> 0, true);
    out.setUint32(8, c0 >>> 0, true);
    out.setUint32(12, d0 >>> 0, true);
    return digest;
}
//# sourceMappingURL=md5.js.map