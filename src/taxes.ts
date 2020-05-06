export function calculateTaxes(income: number, option: 'single' | 'joint' = 'single') {
    const brackets = {
      'single': [
        [12400, 0],
        [9875, 0.10],
        [40125 - 9875, 0.12],
        [85525 - 40125, 0.22],
        [163300 - 85525, 0.24],
        [207350 - 163300, 0.32],
        [518400 - 207350, 0.35],
        [Infinity, 0.37]
      ],
      'joint': [
        [24800, 0],
        [19750, 0.10],
        [80250 - 19750, 0.12],
        [171050 - 80250, 0.22],
        [326600 - 171050, 0.24],
        [414700 - 326600, 0.32],
        [622050 - 414700, 0.35],
        [Infinity, 0.37]
      ]
    }[option];
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
    return { incomeCalc, socialMedicare, taxes, netIncome: incomeCalc - socialMedicare - taxes };
  };
  export function invCalculateTaxes(netIncome: number, option: 'single' | 'joint' = 'single'): number {
    let lower = netIncome;
    let upper = 2 * netIncome;
    while (upper - lower > 2) {
      const mid = (lower + upper) / 2;
      const { netIncome: mine } = calculateTaxes(mid, option);
      if (mine > netIncome) {
        upper = mid;
      } else if (mine < netIncome) {
        lower = mid;
      } else {
        return mid;
      }
    }
    return (upper + lower) / 2;
  };
