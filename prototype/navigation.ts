// Screen-space feet coordinates only. Never part of GameState or its clock.
export interface Point {
  x: number;
  y: number;
}
export interface Obstacle {
  x: number;
  y: number;
  width: number;
  height: number;
}
export const obstacles: Obstacle[] = [
  { x: 340, y: 285, width: 280, height: 90 },
  { x: 700, y: 210, width: 120, height: 80 },
  { x: 180, y: 220, width: 65, height: 90 },
];
export const spawn: Point = { x: 480, y: 540 };
export const distance = (a: Point, b: Point) =>
  Math.hypot(a.x - b.x, a.y - b.y);
export function walkable(p: Point, blocks = obstacles): boolean {
  return (
    Number.isFinite(p.x) &&
    Number.isFinite(p.y) &&
    p.x >= 100 &&
    p.x <= 860 &&
    p.y >= 160 &&
    p.y <= 580 &&
    !blocks.some(
      (b) =>
        p.x >= b.x - 14 &&
        p.x <= b.x + b.width + 14 &&
        p.y >= b.y - 14 &&
        p.y <= b.y + b.height + 14,
    )
  );
}
export function clearSegment(a: Point, b: Point, blocks = obstacles): boolean {
  const steps = Math.max(1, Math.ceil(distance(a, b) / 4));
  for (let i = 0; i <= steps; i++) {
    if (
      !walkable(
        {
          x: a.x + ((b.x - a.x) * i) / steps,
          y: a.y + ((b.y - a.y) * i) / steps,
        },
        blocks,
      )
    )
      return false;
  }
  return true;
}
export function findPath(
  start: Point,
  end: Point,
  blocks = obstacles,
): Point[] | null {
  if (!walkable(start, blocks) || !walkable(end, blocks)) return null;
  if (clearSegment(start, end, blocks)) return [end];
  const nodes: Point[] = [];
  for (let y = 160; y <= 580; y += 20)
    for (let x = 100; x <= 860; x += 20)
      if (walkable({ x, y }, blocks)) nodes.push({ x, y });
  const key = (p: Point) => `${p.x},${p.y}`;
  const map = new Map(nodes.map((p) => [key(p), p]));
  const first = nodes
    .filter((p) => clearSegment(start, p, blocks))
    .sort((a, b) => distance(start, a) - distance(start, b))[0];
  if (!first) return null;
  const queue = [first];
  const parents = new Map<string, Point | null>([[key(first), null]]);
  for (let i = 0; i < queue.length; i++) {
    const p = queue[i];
    if (clearSegment(p, end, blocks)) {
      const path = [end, p];
      let parent = parents.get(key(p));
      while (parent) {
        path.push(parent);
        parent = parents.get(key(parent));
      }
      return path.reverse();
    }
    for (const [dx, dy] of [
      [20, 0],
      [-20, 0],
      [0, 20],
      [0, -20],
    ]) {
      const n = map.get(key({ x: p.x + dx, y: p.y + dy }));
      if (n && !parents.has(key(n)) && clearSegment(p, n, blocks)) {
        parents.set(key(n), p);
        queue.push(n);
      }
    }
  }
  return null;
}
