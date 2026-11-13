export interface PlateItem {
  weight: number;
  countPerSide: number;
  color: string;
  textColor: string;
}

export interface PlateCalculationResult {
  targetWeight: number;
  barWeight: number;
  weightPerSide: number;
  platesPerSide: PlateItem[];
  achievedTotalWeight: number;
  remainingWeight: number;
  unit: 'lbs' | 'kg';
}

export type AvailablePlates = Record<number, number>; // weight -> pairs available (count per side)

export const DEFAULT_LBS_INVENTORY: AvailablePlates = {
  45: 4,
  35: 2,
  25: 2,
  10: 4,
  5: 2,
  2.5: 2
};

export const DEFAULT_KG_INVENTORY: AvailablePlates = {
  25: 4,
  20: 4,
  15: 2,
  10: 4,
  5: 4,
  2.5: 2,
  1.25: 2
};

export const LBS_PLATES: { weight: number; color: string; textColor: string }[] = [
  { weight: 45, color: '#3B82F6', textColor: '#FFFFFF' },
  { weight: 35, color: '#EAB308', textColor: '#000000' },
  { weight: 25, color: '#22C55E', textColor: '#000000' },
  { weight: 10, color: '#E2E8F0', textColor: '#0A0C10' },
  { weight: 5, color: '#64748B', textColor: '#FFFFFF' },
  { weight: 2.5, color: '#334155', textColor: '#F8FAFC' }
];

export const KG_PLATES: { weight: number; color: string; textColor: string }[] = [
  { weight: 25, color: '#EF4444', textColor: '#FFFFFF' },
  { weight: 20, color: '#3B82F6', textColor: '#FFFFFF' },
  { weight: 15, color: '#EAB308', textColor: '#000000' },
  { weight: 10, color: '#22C55E', textColor: '#000000' },
  { weight: 5, color: '#E2E8F0', textColor: '#0A0C10' },
  { weight: 2.5, color: '#64748B', textColor: '#FFFFFF' },
  { weight: 1.25, color: '#334155', textColor: '#F8FAFC' }
];

export function calculatePlates(
  targetWeight: number,
  barWeight: number,
  unit: 'lbs' | 'kg',
  availablePlates?: AvailablePlates
): PlateCalculationResult {
  const plateDefs = unit === 'lbs' ? LBS_PLATES : KG_PLATES;
  const inventory = availablePlates || (unit === 'lbs' ? DEFAULT_LBS_INVENTORY : DEFAULT_KG_INVENTORY);

  if (targetWeight <= barWeight) {
    return {
      targetWeight,
      barWeight,
      weightPerSide: 0,
      platesPerSide: [],
      achievedTotalWeight: barWeight,
      remainingWeight: 0,
      unit
    };
  }

  let neededPerSide = (targetWeight - barWeight) / 2;
  const originalNeededPerSide = neededPerSide;
  const platesPerSide: PlateItem[] = [];

  for (const plate of plateDefs) {
    const maxAvailable = inventory[plate.weight] !== undefined ? inventory[plate.weight] : 999;
    if (maxAvailable > 0 && neededPerSide >= plate.weight) {
      const neededCount = Math.floor(neededPerSide / plate.weight);
      const countToLoad = Math.min(neededCount, maxAvailable);
      if (countToLoad > 0) {
        platesPerSide.push({
          weight: plate.weight,
          countPerSide: countToLoad,
          color: plate.color,
          textColor: plate.textColor
        });
        neededPerSide = Math.round((neededPerSide - countToLoad * plate.weight) * 100) / 100;
      }
    }
  }

  const loadedPerSide = originalNeededPerSide - neededPerSide;
  const achievedTotalWeight = barWeight + loadedPerSide * 2;
  const remainingWeight = Math.round((targetWeight - achievedTotalWeight) * 100) / 100;

  return {
    targetWeight,
    barWeight,
    weightPerSide: loadedPerSide,
    platesPerSide,
    achievedTotalWeight,
    remainingWeight,
    unit
  };
}
