const DEG_TO_RAD = Math.PI / 180;
export const normalizeVisibility = value => ['classic', 'legacy'].includes(value) ? 'classic' : 'assisted';
const RAD_TO_DEG = 180 / Math.PI;
const clamp = (value, min, max) => Math.min(max, Math.max(min, value));
const positiveFinite = (value) => Number.isFinite(value) && value > 0;
const validRect = (rect) => rect && [rect.left, rect.top, rect.right, rect.bottom].every(Number.isFinite)
  && rect.left < rect.right && rect.top < rect.bottom;
const contains = (rect, x, y) => x >= rect.left && x <= rect.right && y >= rect.top && y <= rect.bottom;
const hidden = () => ({ visible: false, x: 0, y: 0, rotation: 0, behind: false, inView: false });

/** Camera angles in degrees. Extremely narrow screens prefer the 100° cap to stretching further. */
export function computeFieldOfView(width, height, visibility = 'assisted') {
  const validSize = positiveFinite(width) && positiveFinite(height);
  const w = validSize ? width : 1;
  const h = validSize ? height : 1;
  const requiredVertical = 2 * Math.atan(Math.tan(22.5 * DEG_TO_RAD) * h / w) * RAD_TO_DEG;
  const vertical = normalizeVisibility(visibility) === 'classic' ? 64 : clamp(requiredVertical, 64, 100);
  const horizontal = 2 * Math.atan(Math.tan(vertical * DEG_TO_RAD / 2) * w / h) * RAD_TO_DEG;
  return { vertical, horizontal };
}

/** First boundary hit from outside; final boundary hit when starting inside. */
function rayEdge(centerX, centerY, dx, dy, bounds) {
  let entry = -Infinity;
  let exit = Infinity;
  for (const [origin, direction, min, max] of [
    [centerX, dx, bounds.left, bounds.right], [centerY, dy, bounds.top, bounds.bottom],
  ]) {
    if (direction === 0) {
      if (origin < min || origin > max) return null;
      continue;
    }
    const a = (min - origin) / direction;
    const b = (max - origin) / direction;
    entry = Math.max(entry, Math.min(a, b));
    exit = Math.min(exit, Math.max(a, b));
  }
  if (exit < Math.max(entry, 0)) return null;
  const time = contains(bounds, centerX, centerY) ? exit : Math.max(0, entry);
  if (!Number.isFinite(time)) return null;
  const x = centerX + dx * time;
  const y = centerY + dy * time;
  if (!Number.isFinite(x) || !Number.isFinite(y)) return null;
  return { x: clamp(x, bounds.left, bounds.right), y: clamp(y, bounds.top, bounds.bottom) };
}

function fallbackEdge(centerX, centerY, dx, dy, bounds) {
  // When the allowed HUD-free rectangle lies away from this ray, its nearest
  // edge still gives an on-screen location. Arrow rotation retains the bearing.
  const reach = Math.max(Math.abs(bounds.left - centerX), Math.abs(bounds.right - centerX),
    Math.abs(bounds.top - centerY), Math.abs(bounds.bottom - centerY), 1);
  const x = clamp(centerX + dx * reach, bounds.left, bounds.right);
  const y = clamp(centerY + dy * reach, bounds.top, bounds.bottom);
  // Projection of a missed ray is on an edge; choose one explicitly as a guard
  // against floating-point cancellation in exceptionally small rectangles.
  const options = [
    { x: bounds.left, y }, { x: bounds.right, y }, { x, y: bounds.top }, { x, y: bounds.bottom },
  ];
  options.sort((a, b) => Math.hypot(a.x - x, a.y - y) - Math.hypot(b.x - x, b.y - y));
  return options[0];
}

/**
 * Camera coordinates: front is -Z, right +X, up +Y. Bounds allow marker centers;
 * avoid is already expanded for marker dimensions. Returned rotation is clockwise
 * from an upward arrow. Rear bearings use angles, never mirrored perspective.
 */
export function projectEdgeTarget(input) {
  const { target, width, height, verticalFov, bounds, avoid } = input ?? {};
  if (!target || ![target.x, target.y, target.z].every(Number.isFinite)
    || !positiveFinite(width) || !positiveFinite(height)
    || !Number.isFinite(verticalFov) || verticalFov <= 0 || verticalFov >= 180
    || !validRect(bounds)) return hidden();
  const scale = Math.max(Math.abs(target.x), Math.abs(target.y), Math.abs(target.z));
  if (scale === 0) return hidden();
  const x = target.x / scale;
  const y = target.y / scale;
  const z = target.z / scale;
  const centerX = width / 2;
  const centerY = height / 2;
  const behind = target.z >= 0;
  let dx;
  let dy;
  if (!behind) {
    const focal = height / 2 / Math.tan(verticalFov * DEG_TO_RAD / 2);
    // Zero components need explicit treatment when a finite target is almost
    // side-on and scaled depth underflows to zero (0 * Infinity is NaN).
    const projectedX = x === 0 ? centerX : centerX + x / -z * focal;
    const projectedY = y === 0 ? centerY : centerY - y / -z * focal;
    if (Number.isFinite(projectedX) && Number.isFinite(projectedY)
      && contains(bounds, projectedX, projectedY)) {
      return { visible: false, x: projectedX, y: projectedY, rotation: 0, behind: false, inView: true };
    }
    dx = x;
    dy = -y;
  } else {
    let bearing = Math.atan2(x, -z);
    // The exactly rearward direction has two equally short turns. Consistently
    // choose right nearby so tiny sensor noise cannot alternate left and right.
    if (Math.abs(bearing) >= 175 * DEG_TO_RAD) bearing = Math.PI;
    dx = bearing;
    dy = -Math.atan2(y, Math.hypot(x, z));
  }
  const directionScale = Math.max(Math.abs(dx), Math.abs(dy));
  if (directionScale > 0) { dx /= directionScale; dy /= directionScale; }
  else { dx = 0; dy = -1; }
  const rotation = (Math.atan2(dx, -dy) * RAD_TO_DEG + 360) % 360;
  let point = rayEdge(centerX, centerY, dx, dy, bounds)
    ?? fallbackEdge(centerX, centerY, dx, dy, bounds);
  if (!Number.isFinite(point.x) || !Number.isFinite(point.y)) return { ...hidden(), behind };
  if (validRect(avoid) && contains(avoid, point.x, point.y)) {
    const corners = [
      { x: bounds.left, y: bounds.top }, { x: bounds.right, y: bounds.top },
      { x: bounds.left, y: bounds.bottom }, { x: bounds.right, y: bounds.bottom },
    ].filter((corner) => !contains(avoid, corner.x, corner.y));
    if (corners.length === 0) return { ...hidden(), behind };
    corners.sort((a, b) => Math.hypot(a.x - point.x, a.y - point.y)
      - Math.hypot(b.x - point.x, b.y - point.y));
    point = corners[0];
  }
  return { visible: true, x: point.x, y: point.y, rotation, behind, inView: false };
}
