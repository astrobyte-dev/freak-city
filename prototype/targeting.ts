import type { Point } from "./navigation";
import type { Target } from "./simulation";

// Bounds cover the drawn shapes and a small pointer allowance, not just rings.
const bounds = {
  inez: { x: 758, y: 313, width: 64, height: 112 },
  bench: { x: 334, y: 279, width: 292, height: 102 },
  ledge: { x: 694, y: 204, width: 132, height: 92 },
  notice: { x: 84, y: 144, width: 57, height: 70 },
  heater: { x: 174, y: 214, width: 77, height: 102 },
};
export function hitTarget(targets: Target[], point: Point): Target | undefined {
  // The envelope sits in front of the ledge. Prefer the smaller foreground prop.
  return [...targets].reverse().find((target) => {
    const b =
      target.id === "envelope"
        ? {
            x: target.position.x - 30,
            y: target.position.y - 20,
            width: 60,
            height: 40,
          }
        : bounds[target.id as keyof typeof bounds];
    return (
      !!b &&
      point.x >= b.x &&
      point.x <= b.x + b.width &&
      point.y >= b.y &&
      point.y <= b.y + b.height
    );
  });
}
