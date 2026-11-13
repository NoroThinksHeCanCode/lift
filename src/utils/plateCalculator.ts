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

const LBS_PLATES: { weight: number; color: string; textColor: string }[] = [
  { weight: 45, color: '#3B82F6', textColor: '#FFFFFF' },
  { weight: 35, color: '#EAB308', textColor: '#000000' },
  { weight: 25, color: '#22C55E', textColor: '#000000' },
  { weight: 10, color: '#E2E8F0', textColor: '#0A0C10' },
  { weight: 5, color: '#64748B', textColor: '#FFFFFF' },
  { weight: 2.5, color: '#334155', textColor: '#F8FAFC' }
];

const KG_PLATES: { weight: number; color: string; textColor: string }[] = [
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
  unit: 'lbs' | 'kg'
): PlateCalculationResult {
  const plateDefs = unit === 'lbs' ? LBS_PLATES : KG_PLATES;

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
    if (neededPerSide >= plate.weight) {
      const count = Math.floor(neededPerSide / plate.weight);
      if (count > 0) {
        platesPerSide.push({
          weight: plate.weight,
          countPerSide: count,
          color: plate.color,
          textColor: plate.textColor
        });
        neededPerSide = Math.round((neededPerSide - count * plate.weight) * 100) / 100;
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
