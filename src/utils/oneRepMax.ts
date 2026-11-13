export interface OneRepMaxResult {
  weight: number;
  reps: number;
  epley: number;
  brzycki: number;
  average: number;
  percentages: {
    percentage: number;
    weight: number;
    estimatedReps: string;
  }[];
}

export function calculateOneRepMax(weight: number, reps: number): OneRepMaxResult {
  if (weight <= 0 || reps <= 0) {
    return {
      weight: 0,
      reps: 0,
      epley: 0,
      brzycki: 0,
      average: 0,
      percentages: []
    };
  }

  if (reps === 1) {
    const pTable = generatePercentages(weight);
    return {
      weight,
      reps: 1,
      epley: weight,
      brzycki: weight,
      average: weight,
      percentages: pTable
    };
  }

  // Epley formula: w * (1 + r / 30)
  const epley = Math.round(weight * (1 + reps / 30) * 10) / 10;

  // Brzycki formula: w * (36 / (37 - r))
  const brzycki = reps < 37
    ? Math.round(weight * (36 / (37 - reps)) * 10) / 10
    : epley;

  const average = Math.round(((epley + brzycki) / 2) * 10) / 10;
  const percentages = generatePercentages(average);

  return {
    weight,
    reps,
    epley,
    brzycki,
    average,
    percentages
  };
}

function generatePercentages(oneRepMax: number) {
  const percentMap: { pct: number; reps: string }[] = [
    { pct: 100, reps: '1 rep' },
    { pct: 95, reps: '2 reps' },
    { pct: 90, reps: '3 - 4 reps' },
    { pct: 85, reps: '5 - 6 reps' },
    { pct: 80, reps: '7 - 8 reps' },
    { pct: 75, reps: '9 - 10 reps' },
    { pct: 70, reps: '11 - 12 reps' },
    { pct: 65, reps: '13 - 15 reps' },
    { pct: 60, reps: '16 - 18 reps' },
    { pct: 50, reps: 'Warmup' }
  ];

  return percentMap.map(item => ({
    percentage: item.pct,
    weight: Math.round((oneRepMax * (item.pct / 100)) * 10) / 10,
    estimatedReps: item.reps
  }));
}
