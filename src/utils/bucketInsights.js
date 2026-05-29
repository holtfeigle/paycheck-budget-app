export const BUCKET_INSIGHTS = {
  rent: {
    summary: 'Housing is your biggest lever. Keeping it under 28% of take-home protects everything else.',
    tips: [
      { icon: '🏠', title: 'What counts', body: 'Rent or mortgage payment + renters/homeowners insurance + property taxes. If renting, include utilities if not covered.' },
      { icon: '📉', title: 'The real risk', body: 'Overspending here compresses every other category. A $300/mo rent increase costs you $3,600/year — often more than a raise.' },
      { icon: '🏡', title: 'Saving to buy', body: 'If you\'re renting under this limit, the difference is your down payment fund. Aim for 20% down to avoid PMI (which costs 0.5–1.5% of the loan per year).' },
      { icon: '🤝', title: 'Lender vs. reality', body: 'Lenders may approve you up to 36% debt-to-income. That\'s a ceiling, not a target. Approvals don\'t account for retirement, savings, or emergencies.' },
    ],
  },

  transport: {
    summary: 'Cars are the #2 wealth destroyer after housing. Total cost matters more than the payment.',
    tips: [
      { icon: '🧮', title: 'True total cost', body: 'Car payment + insurance + gas + maintenance + registration. Factor in depreciation — a new car loses 20% of its value in year one.' },
      { icon: '📏', title: 'The rules of thumb', body: 'Total vehicle value shouldn\'t exceed 50% of your annual income. Monthly payment alone shouldn\'t exceed 10-15% of take-home.' },
      { icon: '⏱️', title: 'Loan length', body: 'If you need a 72–84 month loan to afford it, the car is too expensive. Target 48 months max — longer terms mean you\'re paying interest on a depreciating asset.' },
      { icon: '🚌', title: 'The arbitrage', body: 'Driving a paid-off $10k car instead of financing a $35k car frees up $500–$700/month. Invested over 10 years, that\'s often $100k+.' },
    ],
  },

  food: {
    summary: 'The highest ROI habit here is meal planning. Even 2 days of prep cuts dining spend by 30–50%.',
    tips: [
      { icon: '🛒', title: 'Split the budget', body: 'Aim for ~70% groceries, ~30% dining out. Groceries average $300–$500/mo for one person; dining out adds up fast at $15–20 per meal.' },
      { icon: '🏪', title: 'Where to shop', body: 'ALDI, Trader Joe\'s, and warehouse clubs (Costco/Sam\'s) consistently run 20–40% cheaper than traditional grocery stores. A Costco membership pays for itself in ~2 trips.' },
      { icon: '📱', title: 'Meal planning', body: 'Pick 3–4 protein sources, 2–3 grains, and rotate vegetables. Batch cooking Sunday and Wednesday cuts both food waste and decision fatigue.' },
      { icon: '🍽️', title: 'Dining out intentionally', body: 'Happy hour, lunch menus, and BYOB restaurants cut dining costs 30–50% compared to full dinner service. Make it an event, not a default.' },
    ],
  },

  retirement: {
    summary: 'Use this order — each step is better than the next. Don\'t jump ahead.',
    isLadder: true,
    ladder: [
      {
        step: 1,
        icon: '🛡️',
        title: 'Emergency fund first → HYSA',
        body: 'Before investing anything, build 3–6 months of expenses in a High Yield Savings Account. Current rates: 4–5% APY. Try Ally, Marcus, or SoFi. This prevents you from raiding investments during a rough patch.',
        tag: 'Foundation',
        tagColor: 'yellow',
      },
      {
        step: 2,
        icon: '🏢',
        title: '401k up to employer match',
        body: 'If your employer matches 4%, contribute at least 4%. That\'s an immediate 100% return before any market growth. Never skip this — it\'s free money.',
        tag: 'Free money',
        tagColor: 'green',
      },
      {
        step: 3,
        icon: '🏥',
        title: 'HSA (if on a qualifying high-deductible plan)',
        body: 'The HSA is the most tax-advantaged account available — contributions are pre-tax, growth is tax-free, and medical withdrawals are tax-free. Triple tax advantage. 2026 max: $4,400 single / $8,750 family. Invest the balance; don\'t use it as a spending account.',
        tag: 'Best tax deal',
        tagColor: 'blue',
      },
      {
        step: 4,
        icon: '📈',
        title: 'Roth IRA',
        body: 'Contribute after-tax dollars now, and all growth + withdrawals in retirement are 100% tax-free. 2026 max: $7,500 ($8,500 if 50+). Income limits apply — phases out at $153k–$168k single / $242k–$252k married. Open at Fidelity, Schwab, or Vanguard. Invest in low-cost index funds (VTI, VXUS).',
        tag: 'Tax-free growth',
        tagColor: 'emerald',
      },
      {
        step: 5,
        icon: '🏦',
        title: 'Max out 401k',
        body: '2026 limit: $24,500 ($32,500 if 50+). Choose between traditional (tax break now, taxed in retirement) or Roth 401k (no break now, tax-free later). If you\'re in a high tax bracket now, traditional usually wins. If you\'re early career or expect higher income later, Roth often wins.',
        tag: 'Max it out',
        tagColor: 'purple',
      },
      {
        step: 6,
        icon: '📊',
        title: 'Taxable brokerage account',
        body: 'Once tax-advantaged accounts are maxed, open a brokerage (Fidelity, Schwab, or Vanguard). No contribution limits, no withdrawal restrictions, no employer ties. Index funds are the default: VTI (US total market), VXUS (international), BND (bonds). Avoid individual stock picking.',
        tag: 'No limits',
        tagColor: 'sky',
      },
    ],
  },

  retirement_drawdown: {
    summary: 'At this stage, the focus shifts from building wealth to sustaining it.',
    isDrawdown: true,
    tips: [
      { icon: '📅', title: 'RMDs (Required Minimum Distributions)', body: 'At age 73, the IRS requires you to withdraw a minimum amount from traditional 401k and IRA accounts each year. Missing an RMD triggers a 25% penalty. A financial advisor or your brokerage can calculate your required amount.' },
      { icon: '💧', title: 'Safe withdrawal rate', body: 'Research suggests withdrawing 3–4% of your portfolio per year is sustainable across most 30-year retirement periods. At 4%, a $1M portfolio supports $40k/year in withdrawals.' },
      { icon: '🏦', title: 'Sequence of withdrawals', body: 'Generally: spend taxable accounts first, then traditional IRA/401k, and let Roth accounts grow last (no RMDs on Roth IRA during your lifetime).' },
      { icon: '🛡️', title: 'Keep cash accessible', body: '1–2 years of expenses in a HYSA or money market lets you avoid selling investments during market downturns. Don\'t be forced to sell low.' },
    ],
  },

  emergency: {
    summary: 'Your emergency fund is insurance, not an investment. Keep it liquid and boring.',
    tips: [
      { icon: '🏦', title: 'Where to keep it', body: 'High Yield Savings Account (HYSA). Current rates: 4–5% APY. Try Ally, Marcus by Goldman Sachs, or SoFi. Never keep it in a regular bank savings account earning 0.01%.' },
      { icon: '📏', title: 'How much', body: '3 months = minimum (stable W-2 job, no dependents). 6 months = recommended (family, mortgage, average job security). 12 months = self-employed, commission-based, or volatile industry.' },
      { icon: '🚫', title: 'What counts as an emergency', body: 'Job loss, medical bills, essential car repairs, emergency home repairs. Not: vacations, sales, planned expenses. Having a separate "sinking fund" for expected irregular costs (car maintenance, holidays) keeps you from raiding the emergency fund.' },
      { icon: '🔄', title: 'After you use it', body: 'Replenish it before resuming extra debt payments or investments. The emergency fund always comes first.' },
    ],
  },

  house: {
    summary: 'Time is the main variable. Every month you save consistently gets you there faster than you think.',
    tips: [
      { icon: '🎯', title: 'The target', body: '20% down avoids PMI, which costs 0.5–1.5% of your loan per year ($1,000–$3,000/yr on a $200k loan). On a $400k home, 20% down = $80k.' },
      { icon: '🏦', title: 'Where to save it', body: 'HYSA for money you\'ll need within 1–2 years. If your timeline is 3–5 years, consider a mix of HYSA and short-term Treasury bills (4–5% with no state tax). Don\'t invest a down payment in the stock market — too risky over short horizons.' },
      { icon: '📋', title: 'Don\'t forget closing costs', body: 'Budget an additional 2–5% of the home price for closing costs, inspections, moving, and immediate repairs. First-time buyers often get surprised by this.' },
      { icon: '🔑', title: 'First-time buyer programs', body: 'Many states offer down payment assistance, reduced PMI, or below-market rates for first-time buyers. HUD.gov has a state-by-state directory. Some programs only require 3–5% down.' },
    ],
  },

  debt: {
    summary: 'High-interest debt is a guaranteed negative return. Paying it off beats most investments.',
    tips: [
      { icon: '⚡', title: 'Avalanche method', body: 'Pay minimums on everything, throw every extra dollar at the highest interest rate debt first. Mathematically optimal — saves the most money.' },
      { icon: '🏔️', title: 'Snowball method', body: 'Pay off the smallest balance first regardless of rate. Less optimal mathematically, but the psychological wins keep people on track. If avalanche feels overwhelming, use this.' },
      { icon: '🚫', title: 'Stop adding to it', body: 'Paying off $5k in credit card debt while still using the card is like bailing out a boat with a hole in it. Temporarily freeze the card or remove it from digital wallets while in paydown mode.' },
      { icon: '📞', title: 'Negotiate your rates', body: 'Call and ask for a lower interest rate — it works roughly 70% of the time for customers in good standing. A 5-minute call can save hundreds per year.' },
    ],
  },

  travel: {
    summary: 'Automate this so you don\'t have to "find" the money — it\'s already set aside.',
    tips: [
      { icon: '🏦', title: 'Dedicated account', body: 'Open a separate HYSA labeled "Travel" and auto-transfer this amount every paycheck. When you book a trip, transfer from that account. No guilt, no budget math.' },
      { icon: '✈️', title: 'Travel credit cards', body: 'A travel rewards card (Chase Sapphire, Amex Gold, Capital One Venture) can 2–3x the value of your travel spending through points. Only worth it if you pay the balance in full every month — interest destroys the benefit.' },
      { icon: '📅', title: 'Book early (or late)', body: 'Flights are cheapest 1–3 months out for domestic, 2–6 months for international. Last-minute deals exist but are unreliable. The cheapest days to fly: Tuesday, Wednesday, Saturday.' },
    ],
  },

  discretionary: {
    summary: 'This is your life — spend it on things that actually make you happy, not just things that are convenient.',
    tips: [
      { icon: '📋', title: 'Audit your subscriptions', body: 'The average American has 4–5 subscriptions they forgot about. Go through your bank statement line by line once a quarter and cancel anything you haven\'t used in 30 days.' },
      { icon: '⏸️', title: 'The 24-hour rule', body: 'For any unplanned purchase over $50, wait 24 hours. Impulse purchases lose 80% of their appeal by the next day. This alone can save $100–$300/month.' },
      { icon: '📈', title: 'Lifestyle inflation', body: 'When your income increases, it\'s tempting to upgrade everything. Instead, direct 50% of any raise to savings/investments before adjusting your lifestyle. You won\'t miss what you never had.' },
      { icon: '😊', title: 'Spend on experiences', body: 'Research consistently shows experiences deliver more lasting happiness than things. A weekend trip > a new gadget of equal cost, for most people.' },
    ],
  },
};
