const HIGH_SCORES_KEY = 'bulletHellHighScores';

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
