export const airMarkers = [98, 124, 150, 176, 202, 228, 254];

export const lastFrame = 7;

export const markerOffsets = [
  [4, -4, 0, 0, 0, 0, 0],
  [0, 0, 4, -4, 0, 0, 0],
  [0, 0, 0, 4, 8, -4, 0],
  [0, 0, 0, 0, 0, 0, 0],
] as const;

export const wavefrontPositions = [111, 163, 217, 302] as const;

export const rarefactionPositions = [135, 187, 195] as const;

export const staticFrameMap = [1, 2, 4, 6] as const;
