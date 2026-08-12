/**
 * Known GameSir identities. One physical product can appear under several
 * identities depending on connection mode and firmware (see RESEARCH.md §2.5),
 * so this is a flat match table, not one entry per product.
 *
 * Sources for the VID/PID rows (all verified, see RESEARCH.md §3):
 * Linux xpad.c (GameSir vendor 0x3537), SDL_GameControllerDB + SDL's built-in
 * DB, xpadneo docs, linux-hardware.org. GameSir's own USB VID is 0x3537
 * ("Guangzhou Chicken Run Network Technology", their legal name); older
 * devices spoof Apple's 0x05ac or use OEM VIDs (0x20bc, 0x8585, 0x1949).
 *
 * Not in this table on purpose: modern GameSir pads in Bluetooth Xbox mode
 * clone the real Xbox Wireless Controller (045e:02e0, randomized MAC) and are
 * indistinguishable from one by ID — they normalize fine through the standard
 * mapping, so we let them surface as unknown/standard pads.
 *
 * Order matters: `identify` name-matching returns the first hit, so put more
 * specific patterns (x2s, x2 pro) before general ones (x2).
 */
export const DEVICES = [
    // ---- X-family mobile clip pads ----
    {
        device: 'x2s',
        name: 'GameSir X2s',
        namePattern: /gamesir[- ]?x2s/i, // BT name per FCC 2AF9S-GSX2SBH
        quirks: [],
    },
    {
        device: 'x2-pro',
        name: 'GameSir X2 Pro',
        // USB VID/PID unpublished (possibly 3537:1046); match by name until captured.
        namePattern: /gamesir[- ]?x2[- ]?pro|x2 pro/i,
        quirks: [],
    },
    {
        device: 'x2-typec',
        name: 'GameSir X2 (USB-C)',
        vendor: '05ac', // spoofs Apple; see RESEARCH.md §2.1
        product: '3b06',
        // Also matches the BT pairing names "Gamesir-X2" / "gamesir-x2_G".
        namePattern: /gamesir[- ]?x2/i,
        quirks: ['nintendo-layout'],
    },
    {
        device: 'x3',
        name: 'GameSir X3',
        // USB VID/PID unpublished; match by name until captured.
        namePattern: /gamesir[- ]?x3/i,
        quirks: [],
    },
    {
        device: 'x4-aileron',
        name: 'GameSir X4 Aileron',
        vendor: '3537',
        product: '1104', // "GameSir X4A Xbox Controller" (SDL macOS mapping)
        namePattern: /x4a|x4[- ]?aileron/i,
        quirks: [],
    },
    {
        device: 'x5-lite',
        name: 'GameSir X5 Lite',
        vendor: '3537',
        product: '1116',
        namePattern: /gamesir[- ]?x5/i,
        quirks: [],
    },
    // ---- G7 desktop family (Xbox-licensed, GIP over USB) ----
    {
        device: 'g7-se',
        name: 'GameSir G7 SE',
        vendor: '3537',
        product: '1010', // revisions also seen as 1071/1073/1075; caught by name
        namePattern: /g7 se/i,
        quirks: [],
    },
    {
        device: 'g7-pro',
        name: 'GameSir G7 Pro',
        vendor: '3537',
        product: '1022',
        namePattern: /g7 pro/i,
        quirks: [],
    },
    {
        device: 'g7',
        name: 'GameSir G7',
        vendor: '3537',
        product: '1001', // "GameSir-G7 Controller for Xbox"
        namePattern: /gamesir[- ]?g7/i,
        quirks: [],
    },
    // ---- T-family / other 0x3537 pads ----
    {
        device: 't4-kaleid',
        name: 'GameSir T4 Kaleid',
        vendor: '3537',
        product: '1004', // Xbox-360 mode; HID/Switch mode is 3537:1005 "GameSir-T4K"
        namePattern: /t4[- ]?kaleid|t4k/i,
        quirks: [],
    },
    {
        device: 'nova-2-lite',
        name: 'GameSir Nova 2 Lite',
        vendor: '3537',
        product: '100f',
        namePattern: /nova 2 lite/i,
        quirks: [],
    },
    {
        device: 'cyclone-pro',
        name: 'GameSir T4 Cyclone Pro',
        vendor: '3537',
        product: '1023',
        namePattern: /cyclone pro/i,
        quirks: [],
    },
    {
        device: 'cyclone-2',
        name: 'GameSir Cyclone 2',
        vendor: '3537',
        product: '100b',
        namePattern: /cyclone 2/i,
        quirks: [],
    },
    {
        device: 't7',
        name: 'GameSir T7',
        vendor: '3537',
        product: '1056', // revisions also 107f/1095
        namePattern: /gamesir[- ]?t7/i,
        quirks: [],
    },
    // ---- Older devices (spoofed/OEM vendor ids) ----
    {
        device: 'g3',
        name: 'GameSir G3 / G3s',
        vendor: '05ac',
        product: '033d',
        namePattern: /gamesir[- ]?g3s?\b|xiaojigamesirg3/i,
        quirks: [],
    },
    {
        device: 'g3w',
        name: 'GameSir G3w',
        vendor: '05ac',
        product: '055b', // alt identity: 20bc:5500
        namePattern: /gamesir[- ]?g3w/i,
        quirks: [],
    },
    {
        device: 'g4',
        name: 'GameSir G4 / G4s',
        vendor: '05ac',
        product: '022d', // G4s: 05ac:044d, G4 Pro: 8585:061b
        namePattern: /gamesir[- ]?g4/i,
        quirks: [],
    },
    {
        device: 'g5',
        name: 'GameSir G5',
        vendor: '05ac',
        product: '057a',
        namePattern: /gamesir[- ]?g5/i,
        quirks: [],
    },
    {
        device: 't3',
        name: 'GameSir T3',
        vendor: '05ac',
        product: '061a',
        namePattern: /gamesir[- ]?t3\b/i,
        quirks: [],
    },
    {
        device: 't4w',
        name: 'GameSir T4w',
        vendor: '20bc',
        product: '5656',
        namePattern: /gamesir[- ]?t4w/i,
        quirks: [],
    },
    {
        device: 't4-pro',
        name: 'GameSir T4 Pro',
        vendor: '1949',
        product: '0402',
        namePattern: /t4 pro/i,
        quirks: [],
    },
    // ---- Connection-mode identities ----
    {
        device: 'xusb-clone',
        name: 'GameSir (Xbox 360 clone mode)',
        vendor: '045e',
        product: '028e',
        quirks: [],
    },
    {
        device: 't4-nova-lite',
        name: 'GameSir T4 Nova Lite',
        namePattern: /zikway|2\.4g xbox 360/i,
        quirks: [],
    },
    {
        device: 't1d',
        name: 'GameSir T1d',
        namePattern: /gamesir[- ]?t1d/i,
        quirks: ['no-rumble'],
    },
];
/** Alternate (vendor, product) identities that map onto a DEVICES entry. */
const ALT_IDS = {
    '3537:1005': 't4-kaleid', // HID/Switch mode "GameSir-T4K Controller"
    '3537:1071': 'g7-se',
    '3537:1073': 'g7-se',
    '3537:1075': 'g7-se',
    '3537:107f': 't7',
    '3537:1095': 't7',
    '05ac:044d': 'g4', // G4s
    '8585:061b': 'g4', // G4 Pro
    '20bc:5500': 'g3w', // alt G3w identity
};
/** Catch-all for unrecognized models on GameSir's own vendor id. */
const GENERIC_GAMESIR = {
    device: 'gamesir-unknown',
    name: 'GameSir (unrecognized model)',
    vendor: '3537',
    quirks: [],
};
const VENDOR_PRODUCT_PATTERNS = [
    // Chrome: "... (STANDARD GAMEPAD Vendor: 05ac Product: 3b06)" / "(Vendor: ... Product: ...)"
    /vendor:?\s*([0-9a-f]{4})\s+product:?\s*([0-9a-f]{4})/i,
    // Firefox: "05ac-3b06-GameSir-X2"
    /^([0-9a-f]{4})-([0-9a-f]{4})-/i,
];
/** Match a Gamepad API id string (or BLE/HID device name) to a known descriptor. */
export function identify(id) {
    for (const pattern of VENDOR_PRODUCT_PATTERNS) {
        const m = id.match(pattern);
        if (!m)
            continue;
        const vendor = m[1].toLowerCase();
        const product = m[2].toLowerCase();
        const hit = DEVICES.find((d) => d.vendor === vendor && d.product === product);
        if (hit)
            return hit;
        const alt = ALT_IDS[`${vendor}:${product}`];
        if (alt)
            return DEVICES.find((d) => d.device === alt) ?? null;
        // Parsed but unknown ids: GameSir's own vendor still identifies the maker.
        if (vendor === '3537')
            return byName(id) ?? GENERIC_GAMESIR;
        break; // fall through to name matching
    }
    return byName(id);
}
function byName(id) {
    return (DEVICES.find((d) => d.namePattern?.test(id)) ??
        (/gamesir/i.test(id) ? GENERIC_GAMESIR : null));
}
//# sourceMappingURL=devices.js.map