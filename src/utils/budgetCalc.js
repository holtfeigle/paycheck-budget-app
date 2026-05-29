const FREQ_MULTIPLIERS = {
  weekly: 52,
  biweekly: 26,
  monthly: 12,
  yearly: 1,
};

export function toMonthly(amount, frequency) {
  return (amount * FREQ_MULTIPLIERS[frequency]) / 12;
}

function futureValue(monthlyPMT, annualRate, years) {
  const r = annualRate / 12;
  const n = years * 12;
  if (r === 0) return monthlyPMT * n;
  return monthlyPMT * ((Math.pow(1 + r, n) - 1) / r);
}

function getBaseRetirementRate(age) {
  if (age >= 65) return 0;
  if (age >= 30) return 0.25;
  if (age >= 25) return 0.20;
  return 0.15; // 18–24
}

function getRetirementRate(age, goals) {
  const base = getBaseRetirementRate(age);
  if (base === 0) return 0;
  let boost = 0;
  if (goals.includes('retire')) boost += 0.05; // Retire Early goal
  if (goals.includes('invest')) boost += 0.03; // Grow Wealth goal
  return Math.min(base + boost, 0.30);          // cap at 30%
}

function getRetirementDescription(age, rate, wasGoalBoosted) {
  if (age >= 65) return 'Focus shifts to income management, RMDs, and sustainable withdrawals — tap for guidance.';
  const pct = Math.round(rate * 100);
  const boost = wasGoalBoosted ? ' (goal-boosted)' : '';
  if (age >= 30) return `${pct}% of gross${boost} — full savings rate. Max tax-advantaged accounts (401k, Roth IRA, HSA) before taxable brokerage.`;
  if (age >= 25) return `${pct}% of gross${boost} — ramping up. Hit employer match first, open a Roth IRA, and increase 1% with every raise.`;
  return `${pct}% of gross${boost} — starting strong. A dollar invested at 22 is worth ~5× a dollar invested at 42.`;
}

// Food scales up with household size (with economies of scale)
const FOOD_RATES  = [0.12, 0.17, 0.21, 0.24, 0.26, 0.28, 0.29, 0.30];
// Transport bumps slightly for larger households (possible second car)
const TRANSPORT_RATES = [0.15, 0.16, 0.17, 0.18, 0.18, 0.18, 0.18, 0.18];

function idx(householdSize) {
  return Math.min(householdSize - 1, 7);
}

function foodDescription(householdSize) {
  if (householdSize === 1) return '12% of take-home — groceries + occasional dining out';
  if (householdSize === 2) return '17% of take-home for 2 people — meal planning keeps this in check';
  if (householdSize <= 4) return `${Math.round(FOOD_RATES[idx(householdSize)] * 100)}% of take-home for ${householdSize} people — warehouse clubs (Costco/Sam\'s) can cut 20%`;
  return `${Math.round(FOOD_RATES[idx(householdSize)] * 100)}% of take-home for ${householdSize}+ people — batch cooking and warehouse memberships are essential`;
}

function transportDescription(householdSize) {
  const pct = Math.round(TRANSPORT_RATES[idx(householdSize)] * 100);
  if (householdSize >= 3) return `${pct}% of take-home — larger household may need a second vehicle; factor in insurance for all drivers`;
  return `${pct}% of take-home — includes car payment, insurance, gas, and maintenance`;
}

function housingDescription(householdSize) {
  if (householdSize >= 5) return '28% of take-home — larger household may need more bedrooms; prioritize staying in this range';
  if (householdSize >= 3) return '28% of take-home — shared cost across the household; consider school districts and commute';
  return '28% of take-home — keeps housing from crowding out savings';
}

// Always reserve at least 5% of take-home for discretionary spending
const MIN_DISCRETIONARY_RATE = 0.05;

export function calcCustomBuckets(monthlyGross, monthlyNet, age, goals, householdSize = 1) {
  const hasGoal = (g) => goals.includes(g);

  const emergencyMonths = hasGoal('security') ? 6 : 3;
  // Larger households have more fixed essential costs as a share of income
  const expenseRates = [0.65, 0.70, 0.75, 0.80, 0.83, 0.85, 0.87, 0.88];
  const expenseRate = expenseRates[Math.min(householdSize - 1, 7)];
  const emergencyFundTarget = monthlyNet * expenseRate * emergencyMonths;

  const baseRetRate = getBaseRetirementRate(age);
  const retirementRate = getRetirementRate(age, goals);
  const wasGoalBoosted = retirementRate > baseRetRate;
  const isRetired = age >= 65;

  const foodRate = FOOD_RATES[idx(householdSize)];
  const transportRate = TRANSPORT_RATES[idx(householdSize)];

  // Each bucket is tagged _essential (housing/food/transport) or flexible (savings/goals).
  // Essential buckets are never scaled. Flexible buckets are scaled proportionally
  // when the total would exceed the available budget after essentials + 5% discretionary floor.
  const rawBuckets = [
    {
      id: 'rent',
      label: 'Max Rent / Housing',
      icon: '🏠',
      monthly: monthlyNet * 0.28,
      description: housingDescription(householdSize),
      color: 'blue',
      _essential: true,
    },
    {
      id: 'transport',
      label: 'Max Transportation',
      icon: '🚗',
      monthly: monthlyNet * transportRate,
      description: transportDescription(householdSize),
      color: 'purple',
      _essential: true,
    },
    {
      id: 'food',
      label: 'Food (Groceries + Dining)',
      icon: '🛒',
      monthly: monthlyNet * foodRate,
      description: foodDescription(householdSize),
      color: 'green',
      _essential: true,
    },
    {
      id: isRetired ? 'retirement_drawdown' : 'retirement',
      label: isRetired ? 'Retirement Income Management' : 'Retirement / Investing',
      icon: '📈',
      monthly: isRetired ? null : monthlyGross * retirementRate,
      description: getRetirementDescription(age, retirementRate, wasGoalBoosted),
      color: 'emerald',
      isRetired,
      _essential: isRetired, // drawdown mode has no monthly allocation
    },
    {
      id: 'emergency',
      label: 'Emergency Fund',
      icon: '🛡️',
      monthly: null,
      target: emergencyFundTarget,
      description: `${emergencyMonths}-month cushion target: save until you hit $${emergencyFundTarget.toLocaleString('en-US', { maximumFractionDigits: 0 })}`,
      color: 'yellow',
      isTarget: true,
      _essential: true, // target-only, no monthly draw from budget
    },
  ];

  if (hasGoal('house')) {
    rawBuckets.push({
      id: 'house',
      label: 'House Down Payment',
      icon: '🏡',
      monthly: monthlyNet * 0.10,
      description: '10% of take-home toward 20% down payment goal',
      color: 'orange',
      _essential: false,
    });
  }

  if (hasGoal('debt')) {
    rawBuckets.push({
      id: 'debt',
      label: 'Debt Paydown',
      icon: '💳',
      monthly: monthlyNet * 0.10,
      description: '10% extra toward high-interest debt (above minimums)',
      color: 'red',
      _essential: false,
    });
  }

  if (hasGoal('travel')) {
    rawBuckets.push({
      id: 'travel',
      label: 'Travel Fund',
      icon: '✈️',
      monthly: monthlyNet * 0.05,
      description: '5% of take-home into a dedicated travel savings account',
      color: 'sky',
      _essential: false,
    });
  }

  // ── Balancing algorithm ──────────────────────────────────────────────────
  const essentialTotal = rawBuckets.reduce(
    (s, b) => s + (b._essential && b.monthly ? b.monthly : 0),
    0
  );
  const flexibleBudget = monthlyNet - essentialTotal - monthlyNet * MIN_DISCRETIONARY_RATE;
  const flexibleBuckets = rawBuckets.filter(b => !b._essential && b.monthly != null);
  const flexibleTotal = flexibleBuckets.reduce((s, b) => s + b.monthly, 0);

  let wasScaled = false;
  let scaleFactor = 1;

  if (flexibleTotal > 0 && flexibleBudget < flexibleTotal) {
    scaleFactor = Math.max(flexibleBudget, 0) / flexibleTotal;
    wasScaled = true;
  }

  // Strip internal _essential tag and apply scaling to flexible buckets
  const buckets = rawBuckets.map(({ _essential, ...b }) => {
    if (_essential || b.monthly == null || !wasScaled) return b;
    return { ...b, monthly: b.monthly * scaleFactor, wasScaled: true };
  });

  // Discretionary = everything left after all allocations
  const allocatedMonthly = buckets.reduce((s, b) => s + (b.monthly || 0), 0);
  const discretionary = monthlyNet - allocatedMonthly;

  buckets.push({
    id: 'discretionary',
    label: 'Discretionary / Wants',
    icon: '🎉',
    monthly: Math.max(discretionary, 0),
    description: 'What remains after all buckets — subscriptions, entertainment, clothes, fun',
    color: 'pink',
  });

  // Attach retirement projection using the final (possibly scaled) monthly amount
  const yearsToRetirement = Math.max(65 - age, 0);
  const finalBuckets = buckets.map(b => {
    if (b.id !== 'retirement' || !b.monthly || yearsToRetirement === 0) return b;
    const pmt = b.monthly;
    return {
      ...b,
      projection: {
        monthlyAmount: pmt,
        years: yearsToRetirement,
        scenarios: [
          { rate: 0.05, label: 'Conservative', value: futureValue(pmt, 0.05, yearsToRetirement) },
          { rate: 0.07, label: 'Moderate',     value: futureValue(pmt, 0.07, yearsToRetirement) },
          { rate: 0.10, label: 'Aggressive',   value: futureValue(pmt, 0.10, yearsToRetirement) },
        ],
      },
    };
  });

  return { buckets: finalBuckets, wasScaled, scaleFactor };
}
