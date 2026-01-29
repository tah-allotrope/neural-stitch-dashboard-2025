import * as THREE from 'three';

// --- IMAGE PATH LOGIC (FIREBASE FIX) ---
// 1. Explicitly map lowercase names to exact filenames (Case-Sensitive)
export const STAFF_IMAGE_MAP: Record<string, string> = {
    'aiden': 'Aiden',
    'anh': 'Anh',
    'cong': 'Cong',
    'hang': 'Hang',
    'marc': 'Marc',
    'michelle': 'Michelle',
    'rob': 'Rob',
    'tinh': 'Tinh',
    'trang': 'Trang',
    'tung': 'Tung',
    // Add known variations here if needed
    'alnie': 'Alnie',
    'bob': 'Bob',
    'sve': 'Svetlana',
    'svetlana': 'Svetlana'
};

// 2. Helper to Title Case (e.g. "ethan" -> "Ethan")
export const toTitleCase = (str: string) => {
    return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
};

export const getStaffImagePath = (staffName: string): string => {
    // A. Check strict map first
    const cleanName = staffName.trim().toLowerCase();
    const mappedName = STAFF_IMAGE_MAP[cleanName];

    if (mappedName) {
        return `/staff/${mappedName}.webp`;
    }

    // B. Smart Fallback: Assume filename is TitleCase.webp
    // This handles new staff without needing to edit the map every time
    return `/staff/${toTitleCase(staffName)}.webp`;
};

export const getStringColor = (str: string) => {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    // Hue: 0-360 (Full spectrum)
    const hue = Math.abs(hash % 360);
    // Saturation: 75% (High pop), Lightness: 50% (Medium)
    return `hsl(${hue}, 75%, 50%)`;
};

// --- TEXTURE CACHE MANAGER ---
// Defined outside component to persist across re-renders
export const textureCache: Record<string, THREE.Texture> = {};
export const textureLoader = new THREE.TextureLoader();

// --- PERFORMANCE: SHARED ASSETS ---
export const sharedSphereGeometry = new THREE.SphereGeometry(1, 16, 16);
export const materialCache: Record<string, THREE.MeshLambertMaterial> = {};

export const getSharedMaterial = (id: string, texture?: THREE.Texture) => {
    // Create a unique key based on ID and texture UUID
    const key = `${id}-${texture?.uuid || 'none'}`;
    if (!materialCache[key]) {
        materialCache[key] = new THREE.MeshLambertMaterial({
            color: texture ? 0xffffff : getStringColor(id),
            map: texture || null,
            transparent: true,
            opacity: 0.9
        });
    }
    return materialCache[key];
};
