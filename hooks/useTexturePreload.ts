import { useEffect } from 'react';
import { textureCache, textureLoader, getStaffImagePath } from '../utils';

export const useTexturePreload = (allStaff: string[]) => {
    useEffect(() => {
        if (!allStaff.length) return;

        allStaff.forEach(staff => {
            if (textureCache[staff]) return;

            const imagePath = getStaffImagePath(staff);

            textureLoader.load(
                imagePath,
                (texture) => {
                    textureCache[staff] = texture;
                },
                undefined,
                () => {
                    console.warn(`Texture failed for ${staff} at ${imagePath}`);
                }
            );
        });
    }, [allStaff]);
};
