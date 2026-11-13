// Street lamps along the dirt path from the spawn point to the cabin, alternating sides, about
// 8.6 units apart. Placed just outside the path's edge, measured from the heightmap (the path is
// where it's dark). `y` is the ground height at the lamp's foot (the lowest point under its base).
// Ordered from the cabin end to the spawn end.
export const STREET_LAMPS: ReadonlyArray<{ x: number; y: number; z: number }> = [
    { x: -3.77, y: 0.15, z: -12.49 },
    { x: -1.97, y: 0.21, z: 0.45 },
    { x: 10.79, y: 0.16, z: -2.39 },
    { x: 12.07, y: 0.31, z: 9.83 },
    { x: 24.61, y: 0.33, z: 10.55 },
    { x: 20.79, y: 0.33, z: 21.96 },
    { x: 29.9, y: 0.33, z: 29.62 },
    { x: 18.56, y: 0.23, z: 34.28 },
];

/** Height of the middle of the lantern (where the light comes from) above the lamp's foot. */
export const LAMP_LIGHT_HEIGHT = 3.0;
