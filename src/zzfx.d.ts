/**
 * ZzFXの型定義
 */

declare module 'zzfx' {
  /**
   * ZzFX効果音を再生
   * @param parameters - ZzFXパラメータ配列
   * @returns AudioBufferSourceNode
   */
  export function zzfx(...parameters: any[]): any;
  
  /**
   * ZzFXコアオブジェクト
   */
  export const ZZFX: any;
  
  /**
   * ZzFXサウンドクラス
   */
  export class ZZFXSound {
    constructor(...parameters: any[]);
  }
}
