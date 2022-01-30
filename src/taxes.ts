export const allBrackets = {
  2020: {
    single: [
      [12400, 0],
      [9875, 0.1],
      [40125 - 9875, 0.12],
      [85525 - 40125, 0.22],
      [163300 - 85525, 0.24],
      [207350 - 163300, 0.32],
      [518400 - 207350, 0.35],
      [Infinity, 0.37],
    ],
    joint: [
      [24800, 0],
      [19750, 0.1],
      [80250 - 19750, 0.12],
      [171050 - 80250, 0.22],
      [326600 - 171050, 0.24],
      [414700 - 326600, 0.32],
      [622050 - 414700, 0.35],
      [Infinity, 0.37],
    ],
  },
  2021: {
    single: [
      [12550, 0],
      [9950, 0.1],
      [40525 - 9950, 0.12],
      [86375 - 40525, 0.22],
      [164925 - 86375, 0.24],
      [209425 - 164925, 0.32],
      [523600 - 209425, 0.35],
      [Infinity, 0.37],
    ],
    joint: [
      [25100, 0],
      [19900, 0.1],
      [81050 - 19900, 0.12],
      [172750 - 81050, 0.22],
      [329850 - 172750, 0.24],
      [418850 - 329850, 0.32],
      [628300 - 418850, 0.35],
      [Infinity, 0.37],
    ],
  },
  2022: {
    single: [
      [12950, 0],
      [10275, 0.1],
      [41775 - 10275, 0.12],
      [89075 - 41775, 0.22],
      [170050 - 89075, 0.24],
      [215950 - 170050, 0.32],
      [539900 - 215950, 0.35],
      [Infinity, 0.37],
    ],
    joint: [
      [25900, 0],
      [20550, 0.1],
      [83550 - 20550, 0.12],
      [178150 - 83550, 0.22],
      [340100 - 178150, 0.24],
      [431900 - 340100, 0.32],
      [647850 - 431900, 0.35],
      [Infinity, 0.37],
    ],
  },
};

export function calculateTaxes(
  income: number,
  year: number,
  option: "single" | "joint" = "single"
) {
  const brackets = allBrackets[year][option];
  income = Math.floor(income + 0.5);
  const incomeCalc = income;
  const socialMedicare = incomeCalc * 0.0765;
  let taxes = 0;
  for (let i = 0; i < brackets.length && income > 0; ++i) {
    const [amt, frac] = brackets[i];
    const amt1 = Math.min(income, amt);
    const tax = frac * amt1;
    taxes += tax;
    income -= amt1;
  }
  return {
    incomeCalc,
    socialMedicare,
    taxes,
    netIncome: incomeCalc - socialMedicare - taxes,
  };
}
export function invCalculateTaxes(
  netIncome: number,
  year: number,
  option: "single" | "joint" = "single"
): number {
  let lower = netIncome;
  let upper = 2 * netIncome;
  while (upper - lower > 2) {
    const mid = (lower + upper) / 2;
    const { netIncome: mine } = calculateTaxes(mid, year, option);
    if (mine > netIncome) {
      upper = mid;
    } else if (mine < netIncome) {
      lower = mid;
    } else {
      return mid;
    }
  }
  return (upper + lower) / 2;
}
