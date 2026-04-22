import type { Battle } from '../../types';
import { americanWars } from './americanWars';
import { ancientEgyptMesopotamia } from './ancientEgyptMesopotamia';
import { ancientGreeceRome } from './ancientGreeceRome';
import { colonialNapoleonic } from './colonialNapoleonic';
import { eastAsia } from './eastAsia';
import { medievalEurope } from './medievalEurope';
import { ottomanIslamic } from './ottomanIslamic';
import { southAmerica } from './southAmerica';
import { worldWars } from './worldWars';

export const allBattles: Battle[] = [
  ...americanWars,
  ...ancientEgyptMesopotamia,
  ...ancientGreeceRome,
  ...colonialNapoleonic,
  ...eastAsia,
  ...medievalEurope,
  ...ottomanIslamic,
  ...southAmerica,
  ...worldWars,
];

export function getBattleById(id: number): Battle | undefined {
  return allBattles.find(b => b.id === id);
}
