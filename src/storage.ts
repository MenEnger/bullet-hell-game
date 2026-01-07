const HIGH_SCORES_KEY = 'bulletHellHighScores';
const MUTE_STATE_KEY = 'bulletHellMuteState';

/**
 * ハイスコア関連の関数
 */

export function getHighScores(): number[] {
  const stored = localStorage.getItem(HIGH_SCORES_KEY);
  if (!stored) return [0, 0, 0];

  try {
    const scores = JSON.parse(stored);
    return Array.isArray(scores) ? scores : [0, 0, 0];
  } catch {
    return [0, 0, 0];
  }
}

export function saveHighScore(newScore: number): number[] {
  const scores = getHighScores();
  scores.push(newScore);
  scores.sort((a, b) => b - a);
  const topThree = scores.slice(0, 3);

  localStorage.setItem(HIGH_SCORES_KEY, JSON.stringify(topThree));
  return topThree;
}

export function updateHighScoresDisplay(scores: number[]): void {
  const highScoresElement = document.getElementById('highScores');
  if (!highScoresElement) return;

  const spans = highScoresElement.querySelectorAll('span');
  scores.forEach((score, index) => {
    if (spans[index]) {
      spans[index].textContent = score.toString();
    }
  });
}

/**
 * ミュート状態関連の関数
 */

/**
 * localStorageからミュート状態を取得
 * @returns ミュート状態（デフォルトはfalse）
 */
export function getMuteState(): boolean {
  const stored = localStorage.getItem(MUTE_STATE_KEY);
  return stored === 'true';
}

/**
 * ミュート状態をlocalStorageに保存
 * @param muted - ミュート状態
 */
export function saveMuteState(muted: boolean): void {
  localStorage.setItem(MUTE_STATE_KEY, muted.toString());
}
