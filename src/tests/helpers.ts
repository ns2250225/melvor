import '@/content';
import { Game } from '@/game/core/game';
import { createNewState } from '@/game/core/state';
import type { GameMode } from '@/game/core/types';

export function newGame(seed = 12345, mode: GameMode = 'standard') {
  const st = createNewState('测试', mode, 1_700_000_000_000, seed);
  return new Game(st);
}
