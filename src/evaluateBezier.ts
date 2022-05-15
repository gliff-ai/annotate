import type { XYPoint } from "@/annotation/interfaces";

function evaluateBezier(coordinates: XYPoint[]): XYPoint[] {
  const result: XYPoint[] = [];
  for (let i = 0; i < coordinates.length - 3; i += 3) {
    for (let t = 0; t <= 1; t += 0.01) {
      // lerp between p0 and p1, p1 and p2, and p2 and p3:
      const a0x = (1 - t) * coordinates[i].x + t * coordinates[i + 1].x;
      const a0y = (1 - t) * coordinates[i].y + t * coordinates[i + 1].y;

      const a1x = (1 - t) * coordinates[i + 1].x + t * coordinates[i + 2].x;
      const a1y = (1 - t) * coordinates[i + 1].y + t * coordinates[i + 2].y;

      const a2x = (1 - t) * coordinates[i + 2].x + t * coordinates[i + 3].x;
      const a2y = (1 - t) * coordinates[i + 2].y + t * coordinates[i + 3].y;

      // lerp between l0 and l1, and l1 and l2:
      const b0x = (1 - t) * a0x + t * a1x;
      const b0y = (1 - t) * a0y + t * a1y;

      const b1x = (1 - t) * a1x + t * a2x;
      const b1y = (1 - t) * a1y + t * a2y;

      // lerp between b0 and b1:
      const cx = (1 - t) * b0x + t * b1x;
      const cy = (1 - t) * b0y + t * b1y;

      result.push({ x: cx, y: cy });
    }
  }
  return result;
}

export { evaluateBezier };
