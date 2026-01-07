import { describe, it, expect } from 'vitest';
import { distance, normalize, checkCollision, clamp, getDirectionVector } from './utils';
import type { GameObject } from './types';

describe('distance', () => {
  it('同じ座標の場合は0を返す', () => {
    const a = { x: 0, y: 0 };
    const b = { x: 0, y: 0 };
    expect(distance(a, b)).toBe(0);
  });

  it('水平方向の距離を正しく計算する', () => {
    const a = { x: 0, y: 0 };
    const b = { x: 3, y: 0 };
    expect(distance(a, b)).toBe(3);
  });

  it('垂直方向の距離を正しく計算する', () => {
    const a = { x: 0, y: 0 };
    const b = { x: 0, y: 4 };
    expect(distance(a, b)).toBe(4);
  });

  it('ピタゴラスの定理に基づいて距離を計算する (3-4-5の三角形)', () => {
    const a = { x: 0, y: 0 };
    const b = { x: 3, y: 4 };
    expect(distance(a, b)).toBe(5);
  });

  it('負の座標でも正しく動作する', () => {
    const a = { x: -1, y: -1 };
    const b = { x: 2, y: 3 };
    expect(distance(a, b)).toBe(5);
  });
});

describe('normalize', () => {
  it('ゼロベクトルの場合はゼロベクトルを返す', () => {
    const v = { x: 0, y: 0 };
    const result = normalize(v);
    expect(result.x).toBe(0);
    expect(result.y).toBe(0);
  });

  it('単位ベクトルはそのまま返す', () => {
    const v = { x: 1, y: 0 };
    const result = normalize(v);
    expect(result.x).toBeCloseTo(1);
    expect(result.y).toBeCloseTo(0);
  });

  it('任意のベクトルを長さ1に正規化する', () => {
    const v = { x: 3, y: 4 };
    const result = normalize(v);
    expect(result.x).toBeCloseTo(0.6);
    expect(result.y).toBeCloseTo(0.8);

    // 長さが1であることを確認
    const length = Math.sqrt(result.x * result.x + result.y * result.y);
    expect(length).toBeCloseTo(1);
  });

  it('負の値を持つベクトルでも正しく正規化する', () => {
    const v = { x: -3, y: -4 };
    const result = normalize(v);
    expect(result.x).toBeCloseTo(-0.6);
    expect(result.y).toBeCloseTo(-0.8);
  });

  it('正規化後のベクトルの方向は元のベクトルと同じ', () => {
    const v = { x: 5, y: 12 };
    const result = normalize(v);

    // 元のベクトルと正規化後のベクトルの比率が等しいことを確認
    const ratio1 = v.x / result.x;
    const ratio2 = v.y / result.y;
    expect(ratio1).toBeCloseTo(ratio2);
  });
});

describe('checkCollision', () => {
  it('完全に重なっている場合は衝突している', () => {
    const a: GameObject = {
      position: { x: 0, y: 0 },
      velocity: { x: 0, y: 0 },
      radius: 5,
    };
    const b: GameObject = {
      position: { x: 0, y: 0 },
      velocity: { x: 0, y: 0 },
      radius: 5,
    };
    expect(checkCollision(a, b)).toBe(true);
  });

  it('接触している場合は衝突していない（境界条件）', () => {
    const a: GameObject = {
      position: { x: 0, y: 0 },
      velocity: { x: 0, y: 0 },
      radius: 5,
    };
    const b: GameObject = {
      position: { x: 10, y: 0 },
      velocity: { x: 0, y: 0 },
      radius: 5,
    };
    // distance = 10, radius合計 = 10 なので 10 < 10 = false
    expect(checkCollision(a, b)).toBe(false);
  });

  it('少しだけ重なっている場合は衝突している', () => {
    const a: GameObject = {
      position: { x: 0, y: 0 },
      velocity: { x: 0, y: 0 },
      radius: 5,
    };
    const b: GameObject = {
      position: { x: 9, y: 0 },
      velocity: { x: 0, y: 0 },
      radius: 5,
    };
    // distance = 9, radius合計 = 10 なので 9 < 10 = true
    expect(checkCollision(a, b)).toBe(true);
  });

  it('完全に離れている場合は衝突していない', () => {
    const a: GameObject = {
      position: { x: 0, y: 0 },
      velocity: { x: 0, y: 0 },
      radius: 5,
    };
    const b: GameObject = {
      position: { x: 20, y: 0 },
      velocity: { x: 0, y: 0 },
      radius: 5,
    };
    expect(checkCollision(a, b)).toBe(false);
  });

  it('異なるサイズのオブジェクトでも正しく判定する', () => {
    const small: GameObject = {
      position: { x: 0, y: 0 },
      velocity: { x: 0, y: 0 },
      radius: 2,
    };
    const large: GameObject = {
      position: { x: 5, y: 0 },
      velocity: { x: 0, y: 0 },
      radius: 10,
    };
    // distance = 5, radius合計 = 12 なので 5 < 12 = true
    expect(checkCollision(small, large)).toBe(true);
  });

  it('斜め方向でも正しく衝突判定する', () => {
    const a: GameObject = {
      position: { x: 0, y: 0 },
      velocity: { x: 0, y: 0 },
      radius: 5,
    };
    const b: GameObject = {
      position: { x: 3, y: 4 },
      velocity: { x: 0, y: 0 },
      radius: 5,
    };
    // distance = 5, radius合計 = 10 なので 5 < 10 = true
    expect(checkCollision(a, b)).toBe(true);
  });
});

describe('clamp', () => {
  it('範囲内の値はそのまま返す', () => {
    expect(clamp(5, 0, 10)).toBe(5);
  });

  it('最小値未満の値は最小値に制限する', () => {
    expect(clamp(-5, 0, 10)).toBe(0);
  });

  it('最大値超過の値は最大値に制限する', () => {
    expect(clamp(15, 0, 10)).toBe(10);
  });

  it('最小値と等しい値はそのまま返す', () => {
    expect(clamp(0, 0, 10)).toBe(0);
  });

  it('最大値と等しい値はそのまま返す', () => {
    expect(clamp(10, 0, 10)).toBe(10);
  });

  it('負の範囲でも正しく動作する', () => {
    expect(clamp(-5, -10, -1)).toBe(-5);
    expect(clamp(-15, -10, -1)).toBe(-10);
    expect(clamp(0, -10, -1)).toBe(-1);
  });

  it('小数値でも正しく動作する', () => {
    expect(clamp(5.5, 0, 10)).toBe(5.5);
    expect(clamp(-0.5, 0, 10)).toBe(0);
    expect(clamp(10.5, 0, 10)).toBe(10);
  });
});

describe('getDirectionVector', () => {
  it('右方向のベクトルを正しく計算する', () => {
    const from = { x: 0, y: 0 };
    const to = { x: 10, y: 0 };
    const result = getDirectionVector(from, to);
    expect(result.x).toBeCloseTo(1);
    expect(result.y).toBeCloseTo(0);
  });

  it('上方向のベクトルを正しく計算する', () => {
    const from = { x: 0, y: 0 };
    const to = { x: 0, y: 10 };
    const result = getDirectionVector(from, to);
    expect(result.x).toBeCloseTo(0);
    expect(result.y).toBeCloseTo(1);
  });

  it('斜め方向のベクトルを正しく計算する', () => {
    const from = { x: 0, y: 0 };
    const to = { x: 3, y: 4 };
    const result = getDirectionVector(from, to);
    expect(result.x).toBeCloseTo(0.6);
    expect(result.y).toBeCloseTo(0.8);
  });

  it('逆方向（負の方向）のベクトルも正しく計算する', () => {
    const from = { x: 5, y: 5 };
    const to = { x: 0, y: 0 };
    const result = getDirectionVector(from, to);

    // 長さが1であることを確認
    const length = Math.sqrt(result.x * result.x + result.y * result.y);
    expect(length).toBeCloseTo(1);

    // 方向が正しいことを確認（左下方向なので両方負）
    expect(result.x).toBeLessThan(0);
    expect(result.y).toBeLessThan(0);
  });

  it('同じ座標の場合はゼロベクトルを返す', () => {
    const from = { x: 5, y: 5 };
    const to = { x: 5, y: 5 };
    const result = getDirectionVector(from, to);
    expect(result.x).toBe(0);
    expect(result.y).toBe(0);
  });

  it('距離に関わらず単位ベクトルを返す', () => {
    const from = { x: 0, y: 0 };

    // 距離が異なる2つのケース
    const to1 = { x: 100, y: 0 };
    const to2 = { x: 1, y: 0 };

    const result1 = getDirectionVector(from, to1);
    const result2 = getDirectionVector(from, to2);

    // どちらも同じ方向ベクトルになる
    expect(result1.x).toBeCloseTo(result2.x);
    expect(result1.y).toBeCloseTo(result2.y);
  });
});
