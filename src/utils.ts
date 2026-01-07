import type { Vector2D, GameObject } from './types';

export function distance(a: Vector2D, b: Vector2D): number {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  return Math.sqrt(dx * dx + dy * dy);
}

export function normalize(v: Vector2D): Vector2D {
  const len = Math.sqrt(v.x * v.x + v.y * v.y);
  if (len === 0) return { x: 0, y: 0 };
  return { x: v.x / len, y: v.y / len };
}

export function checkCollision(a: GameObject, b: GameObject): boolean {
  return distance(a.position, b.position) < a.radius + b.radius;
}

export function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

export function getDirectionVector(from: Vector2D, to: Vector2D): Vector2D {
  return normalize({ x: to.x - from.x, y: to.y - from.y });
}
