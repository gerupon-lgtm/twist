const validPoint = p => p && [p.x, p.y, p.z].every(Number.isFinite);

/** Heading-up horizontal map, independent of camera/display roll. */
export function projectRadarTarget({ position, target, heading = 0, range = 60 } = {}) {
  if (!validPoint(position) || !validPoint(target)) return null;
  const angle = Number.isFinite(heading) ? heading : 0;
  const radius = Number.isFinite(range) && range > 0 ? range : 60;
  const dx = target.x - position.x, dz = target.z - position.z;
  const distance = Math.hypot(dx, dz), scale = Math.max(radius, distance);
  const x = (dx * Math.cos(angle) + dz * Math.sin(angle)) / scale;
  const y = (-dx * Math.sin(angle) + dz * Math.cos(angle)) / scale;
  const height = target.y - position.y;
  if (![x,y,distance,height].every(Number.isFinite)) return null;
  return { x, y, distance, outside: distance > radius, height,
    elevation: Math.abs(height) <= 1 ? 'level' : height > 0 ? 'above' : 'below' };
}

export function rectanglesOverlap(a, b, gap = 0) {
  return a.left < b.right + gap && a.right > b.left - gap && a.top < b.bottom + gap && a.bottom > b.top - gap;
}

/** Search free HUD corners and obstacle boundaries before choosing a map position. */
export function placeRadar({ width, height, obstacles = [], size = 100, inset = 12 }) {
  const xs = [inset, width - inset - size];
  const ys = [inset, ...obstacles.flatMap(r => [r.bottom + 8, r.top - size - 8]), height - inset - size];
  for (const y of [...new Set(ys)].sort((a,b) => a-b)) for (const x of xs) {
    const rect = { left: x, top: y, right: x + size, bottom: y + size };
    if (x >= inset && y >= inset && rect.right <= width - inset && rect.bottom <= height - inset
      && !obstacles.some(r => rectanglesOverlap(rect, r, 6))) return rect;
  }
  return null;
}
