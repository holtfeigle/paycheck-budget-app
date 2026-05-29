import { useState, useEffect } from 'react';
import { toMonthly, calcCustomBuckets } from '../utils/budgetCalc';
import { BUCKET_INSIGHTS } from '../utils/bucketInsights';

const COLOR_MAP = {
  blue:    'bg-blue-100 text-blue-700 border-blue-200',
  purple:  'bg-purple-100 text-purple-700 border-purple-200',
  green:   'bg-green-100 text-green-700 border-green-200',
  emerald: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  yellow:  'bg-yellow-100 text-yellow-800 border-yellow-200',
  orange:  'bg-orange-100 text-orange-700 border-orange-200',
  red:     'bg-red-100 text-red-700 border-red-200',
  sky:     'bg-sky-100 text-sky-700 border-sky-200',
  pink:    'bg-pink-100 text-pink-700 border-pink-200',
};

const TAG_COLOR = {
  yellow:  'bg-yellow-200 text-yellow-800',
  green:   'bg-green-200 text-green-800',
  blue:    'bg-blue-200 text-blue-800',
  emerald: 'bg-emerald-200 text-emerald-800',
  purple:  'bg-purple-200 text-purple-800',
  sky:     'bg-sky-200 text-sky-800',
};

function fmt(n) {
  return n.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });
}

function fmtProjection(n) {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000)     return `$${Math.round(n / 1_000)}K`;
  return `$${Math.round(n)}`;
}

function ProjectionPanel({ projection }) {
  return (
    <div className="mt-3 pt-3 border-t border-black/10">
      <p className="text-xs font-semibold opacity-70 uppercase tracking-wide mb-2">
        At 65 · {fmt(projection.monthlyAmount)}/mo for {projection.years} yrs
      </p>
      <div className="space-y-1.5">
        {projection.scenarios.map(s => (
          <div key={s.rate} className="flex justify-between items-center">
            <span className="text-xs opacity-75">{s.label} · {Math.round(s.rate * 100)}%/yr avg</span>
            <span className="text-base font-bold">{fmtProjection(s.value)}</span>
          </div>
        ))}
      </div>
      <p className="text-xs opacity-50 mt-2 leading-relaxed">
        Inflation-adjusted returns. Assumes consistent contributions from today.
      </p>
    </div>
  );
}

function InsightPanel({ insight, projection }) {
  if (!insight) return null;

  if (insight.isLadder) {
    return (
      <div className="mt-3 pt-3 border-t border-black/10 space-y-3">
        <p className="text-xs font-semibold opacity-70 uppercase tracking-wide">Investment Priority Order</p>
        {insight.ladder.map((rung) => (
          <div key={rung.step} className="flex gap-3">
            <div className="flex flex-col items-center">
              <div className="w-6 h-6 rounded-full bg-white/60 flex items-center justify-center text-xs font-bold shrink-0">
                {rung.step}
              </div>
              {rung.step < insight.ladder.length && (
                <div className="w-px flex-1 bg-black/10 my-1" />
              )}
            </div>
            <div className="pb-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-sm font-semibold">{rung.icon} {rung.title}</span>
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${TAG_COLOR[rung.tagColor]}`}>
                  {rung.tag}
                </span>
              </div>
              <p className="text-xs opacity-75 mt-0.5 leading-relaxed">{rung.body}</p>
              {rung.link && (
                <a
                  href={rung.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  className="inline-block mt-2 text-xs font-semibold text-emerald-700 hover:text-emerald-900 underline underline-offset-2"
                >
                  {rung.linkLabel}
                </a>
              )}
            </div>
          </div>
        ))}
        {projection && <ProjectionPanel projection={projection} />}
      </div>
    );
  }

  return (
    <div className="mt-3 pt-3 border-t border-black/10 space-y-2.5">
      {insight.tips.map((tip) => (
        <div key={tip.title}>
          <p className="text-xs font-semibold">{tip.icon} {tip.title}</p>
          <p className="text-xs opacity-75 mt-0.5 leading-relaxed">{tip.body}</p>
          {tip.link && (
            <a
              href={tip.link}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="inline-block mt-2 text-xs font-semibold text-emerald-700 hover:text-emerald-900 underline underline-offset-2"
            >
              {tip.linkLabel}
            </a>
          )}
        </div>
      ))}
    </div>
  );
}

// ── Vehicle recommendations ──────────────────────────────────────────────────

const VEHICLES = [
  { name: 'Hyundai Elantra',    msrp: 15000, emoji: '🚗', type: 'Sedan (used)',    bg: 'from-blue-50 to-blue-100',    img: 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a4/2023_Hyundai_Elantra_Limited_in_Silver%2C_front_left%2C_04-04-2026.jpg/330px-2023_Hyundai_Elantra_Limited_in_Silver%2C_front_left%2C_04-04-2026.jpg' },
  { name: 'Toyota Corolla',     msrp: 17000, emoji: '🚗', type: 'Sedan (CPO)',     bg: 'from-blue-50 to-blue-100',    img: 'https://upload.wikimedia.org/wikipedia/commons/thumb/f/fe/Toyota_Corolla_Hybrid_%28E210%29_IMG_4338.jpg/330px-Toyota_Corolla_Hybrid_%28E210%29_IMG_4338.jpg' },
  { name: 'Honda Civic',        msrp: 18000, emoji: '🚗', type: 'Sedan (CPO)',     bg: 'from-indigo-50 to-indigo-100', img: 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/1a/Honda_Civic_e-HEV_Sport_%28XI%29_%E2%80%93_f_30062024.jpg/330px-Honda_Civic_e-HEV_Sport_%28XI%29_%E2%80%93_f_30062024.jpg' },
  { name: 'Kia Forte',          msrp: 20000, emoji: '🚗', type: 'Sedan',           bg: 'from-violet-50 to-violet-100', img: 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/62/Kia_K3_BD_FL_Snow_White_Pearl_%2813%29_%28cropped%29.jpg/330px-Kia_K3_BD_FL_Snow_White_Pearl_%2813%29_%28cropped%29.jpg' },
  { name: 'Nissan Sentra',      msrp: 21000, emoji: '🚗', type: 'Sedan',           bg: 'from-blue-50 to-blue-100',    img: 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/0c/2024_Nissan_Sentra_%28B18%29_DSC_3754.jpg/330px-2024_Nissan_Sentra_%28B18%29_DSC_3754.jpg' },
  { name: 'Toyota Corolla',     msrp: 24000, emoji: '🚗', type: 'Sedan (new)',     bg: 'from-sky-50 to-sky-100',      img: 'https://upload.wikimedia.org/wikipedia/commons/thumb/f/fe/Toyota_Corolla_Hybrid_%28E210%29_IMG_4338.jpg/330px-Toyota_Corolla_Hybrid_%28E210%29_IMG_4338.jpg' },
  { name: 'Honda Civic',        msrp: 25000, emoji: '🚗', type: 'Sedan (new)',     bg: 'from-cyan-50 to-cyan-100',    img: 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/1a/Honda_Civic_e-HEV_Sport_%28XI%29_%E2%80%93_f_30062024.jpg/330px-Honda_Civic_e-HEV_Sport_%28XI%29_%E2%80%93_f_30062024.jpg' },
  { name: 'Mazda3',             msrp: 25000, emoji: '🚗', type: 'Sedan',           bg: 'from-red-50 to-red-100',      img: 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/2a/Mazda3_SKYACTIV-G.jpg/330px-Mazda3_SKYACTIV-G.jpg' },
  { name: 'Subaru Outback',     msrp: 29000, emoji: '🚙', type: 'SUV/Wagon',       bg: 'from-emerald-50 to-emerald-100', img: 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/42/2023_Subaru_Outback_Premium%2C_front_right%2C_09-09-2023.jpg/330px-2023_Subaru_Outback_Premium%2C_front_right%2C_09-09-2023.jpg' },
  { name: 'Mazda CX-5',         msrp: 30000, emoji: '🚙', type: 'SUV',             bg: 'from-red-50 to-red-100',      img: 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a5/2024_Mazda_CX-5_2.5_S_Select_in_Platinum_Quartz_Metallic%2C_front_right.jpg/330px-2024_Mazda_CX-5_2.5_S_Select_in_Platinum_Quartz_Metallic%2C_front_right.jpg' },
  { name: 'Honda CR-V',         msrp: 31000, emoji: '🚙', type: 'SUV',             bg: 'from-red-50 to-red-100',      img: 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/1b/Honda_CR-V_e-HEV_Elegance_AWD_%28VI%29_%E2%80%93_f_14072024.jpg/330px-Honda_CR-V_e-HEV_Elegance_AWD_%28VI%29_%E2%80%93_f_14072024.jpg' },
  { name: 'Toyota RAV4',        msrp: 31000, emoji: '🚙', type: 'SUV',             bg: 'from-gray-50 to-gray-100',    img: 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/62/Toyota_RAV4_XLE_%28facelift%29_%28front%29.jpg/330px-Toyota_RAV4_XLE_%28facelift%29_%28front%29.jpg' },
  { name: 'Honda Accord',       msrp: 31000, emoji: '🚗', type: 'Sedan',           bg: 'from-red-50 to-red-100',      img: 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/26/2023_Honda_Accord_LX%2C_front_left%2C_07-13-2023.jpg/330px-2023_Honda_Accord_LX%2C_front_left%2C_07-13-2023.jpg' },
  { name: 'Toyota Camry',       msrp: 32000, emoji: '🚗', type: 'Sedan',           bg: 'from-gray-50 to-gray-100',    img: 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/ac/2018_Toyota_Camry_%28ASV70R%29_Ascent_sedan_%282018-08-27%29_01.jpg/330px-2018_Toyota_Camry_%28ASV70R%29_Ascent_sedan_%282018-08-27%29_01.jpg' },
  { name: 'Ford Explorer',      msrp: 37000, emoji: '🚙', type: 'SUV',             bg: 'from-blue-50 to-blue-100',    img: 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/23/Ford_Explorer_%28sixth_generation%29_IMG_6063.jpg/330px-Ford_Explorer_%28sixth_generation%29_IMG_6063.jpg' },
  { name: 'Toyota Tacoma',      msrp: 38000, emoji: '🛻', type: 'Truck',           bg: 'from-gray-50 to-gray-100',    img: 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/5d/Toyota_Tacoma_%28N300%29_TRD_1X7A2438.jpg/330px-Toyota_Tacoma_%28N300%29_TRD_1X7A2438.jpg' },
  { name: 'Jeep Grand Cherokee',msrp: 41000, emoji: '🚙', type: 'SUV',             bg: 'from-green-50 to-green-100',  img: 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/6c/2022_Jeep_Grand_Cherokee_Summit_Reserve_4x4_in_Bright_White%2C_Front_Left%2C_01-16-2022.jpg/330px-2022_Jeep_Grand_Cherokee_Summit_Reserve_4x4_in_Bright_White%2C_Front_Left%2C_01-16-2022.jpg' },
  { name: 'Tesla Model 3',      msrp: 43000, emoji: '⚡', type: 'EV Sedan',        bg: 'from-slate-50 to-slate-100',  img: 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/ab/Tesla_Model_3_%282023%29_Autofr%C3%BChling_Ulm_IMG_9282.jpg/330px-Tesla_Model_3_%282023%29_Autofr%C3%BChling_Ulm_IMG_9282.jpg' },
  { name: 'Tesla Model Y',      msrp: 47000, emoji: '⚡', type: 'EV SUV',          bg: 'from-slate-50 to-slate-100',  img: 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/bd/2022_Tesla_Model_Y_Long_Range_AWD_Front.jpg/330px-2022_Tesla_Model_Y_Long_Range_AWD_Front.jpg' },
  { name: 'BMW 3 Series',       msrp: 47000, emoji: '🏎️', type: 'Sedan',          bg: 'from-zinc-50 to-zinc-100',    img: 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/91/BMW_G20_%282022%29_IMG_7316_%282%29.jpg/330px-BMW_G20_%282022%29_IMG_7316_%282%29.jpg' },
  { name: 'BMW X3',             msrp: 48000, emoji: '🚙', type: 'SUV',             bg: 'from-zinc-50 to-zinc-100',    img: 'https://upload.wikimedia.org/wikipedia/commons/thumb/7/72/BMW_G45_20_IMG_3794.jpg/330px-BMW_G45_20_IMG_3794.jpg' },
  { name: 'Mercedes C-Class',   msrp: 52000, emoji: '🏎️', type: 'Sedan',          bg: 'from-stone-50 to-stone-100',  img: 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/be/Mercedes-Benz_W206_IMG_6380.jpg/330px-Mercedes-Benz_W206_IMG_6380.jpg' },
  { name: 'Acura MDX',          msrp: 53000, emoji: '🚙', type: 'SUV',             bg: 'from-red-50 to-red-100',      img: 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/5b/2022_Acura_MDX_Technology%2C_front_7.2.22.jpg/330px-2022_Acura_MDX_Technology%2C_front_7.2.22.jpg' },
  { name: 'BMW 5 Series',       msrp: 62000, emoji: '🏎️', type: 'Sedan',          bg: 'from-zinc-50 to-zinc-100',    img: 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/86/BMW_G60_520i_1X7A2443.jpg/330px-BMW_G60_520i_1X7A2443.jpg' },
  { name: 'Porsche Macan',      msrp: 70000, emoji: '🏎️', type: 'SUV',            bg: 'from-yellow-50 to-yellow-100', img: 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/3a/Porsche_Macan_4_IMG_2153.jpg/330px-Porsche_Macan_4_IMG_2153.jpg' },
  { name: 'Tesla Model S',      msrp: 75000, emoji: '⚡', type: 'EV Sedan',        bg: 'from-slate-50 to-slate-100',  img: 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/9e/Tesla_Model_S_%28Facelift_ab_04-2016%29_%28cropped%29.jpg/330px-Tesla_Model_S_%28Facelift_ab_04-2016%29_%28cropped%29.jpg' },
];

function VehicleCard({ name, msrp, emoji, type, bg, img, monthlyPayment }) {
  const [imgError, setImgError] = useState(false);
  return (
    <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
      <div className="h-[88px] overflow-hidden">
        {img && !imgError ? (
          <img
            src={img}
            alt={name}
            className="w-full h-full object-cover"
            onError={() => setImgError(true)}
          />
        ) : (
          <div className={`bg-gradient-to-br ${bg} flex items-center justify-center h-full`}>
            <span className="text-5xl">{emoji}</span>
          </div>
        )}
      </div>
      <div className="p-2.5">
        <p className="text-xs font-bold text-gray-800 leading-tight">{name}</p>
        <p className="text-xs text-gray-400">{type}</p>
        <div className="mt-1.5 flex items-baseline justify-between">
          <span className="text-xs font-semibold text-gray-600">{fmt(msrp)}</span>
          <span className="text-xs text-emerald-600 font-semibold">~{fmt(monthlyPayment)}/mo</span>
        </div>
      </div>
    </div>
  );
}

function VehicleRecommendations({ monthlyBudget }) {
  // ~50% of transport budget goes to car payment; rest is gas/insurance/maintenance
  const carPaymentBudget = monthlyBudget * 0.5;
  // Rough loan-to-payment conversion: 60-month loan at ~7% APR ≈ payment × 51
  const affordablePrice = Math.round(carPaymentBudget * 51);

  const picks = VEHICLES
    .filter(v => v.msrp <= affordablePrice * 1.15)
    .map(v => ({ ...v, monthlyPayment: Math.round(v.msrp / 51), diff: Math.abs(v.msrp - affordablePrice) }))
    .sort((a, b) => a.diff - b.diff)
    .slice(0, 4);

  if (!picks.length) return null;

  return (
    <div className="mt-3 pt-3 border-t border-black/10">
      <p className="text-xs font-semibold opacity-70 uppercase tracking-wide mb-2">
        Vehicles in your range · up to {fmt(affordablePrice)}
      </p>
      <div className="grid grid-cols-2 gap-2">
        {picks.map(v => <VehicleCard key={v.name + v.msrp} {...v} />)}
      </div>
      <p className="text-xs opacity-40 mt-2 leading-relaxed">
        Based on ~50% of transport budget for payment · 60-mo loan at ~7% APR · includes CPO/used options
      </p>
    </div>
  );
}

function BucketCard({ bucket, expanded, onToggle }) {
  const insight = BUCKET_INSIGHTS[bucket.id];
  const hasInsight = !!insight || bucket.id === 'transport';

  return (
    <div
      className={`rounded-2xl border-2 transition-all ${COLOR_MAP[bucket.color]} ${hasInsight ? 'cursor-pointer' : ''}`}
      onClick={hasInsight ? onToggle : undefined}
    >
      <div className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 min-w-0">
            <span className="text-xl shrink-0">{bucket.icon}</span>
            <span className="font-bold truncate">{bucket.label}</span>
            {bucket.wasScaled && (
              <span className="text-xs bg-black/10 text-current px-1.5 py-0.5 rounded-full font-medium shrink-0 opacity-70">adjusted</span>
            )}
          </div>
          <div className="flex items-center gap-2 shrink-0 ml-2">
            <span className="text-lg font-bold">
              {bucket.isRetired ? (
                <span className="text-sm font-semibold">Tap for guidance</span>
              ) : bucket.isTarget ? (
                <span className="text-sm font-semibold">Target: {fmt(bucket.target)}</span>
              ) : (
                <>{fmt(bucket.monthly)}<span className="text-sm font-normal opacity-60">/mo</span></>
              )}
            </span>
            {hasInsight && (
              <span className="text-sm opacity-50">{expanded ? '▲' : '▼'}</span>
            )}
          </div>
        </div>
        <p className="text-xs opacity-70 ml-8 mt-1">{bucket.description}</p>

        {expanded && insight && <InsightPanel insight={insight} projection={bucket.projection} />}
        {expanded && bucket.id === 'transport' && bucket.monthly && (
          <VehicleRecommendations monthlyBudget={bucket.monthly} />
        )}
      </div>
    </div>
  );
}

export default function BudgetBreakdown({ paychecks, profile, onBack, onRestart }) {
  const [expandedId, setExpandedId] = useState(null);
  useEffect(() => { window.scrollTo(0, 0); }, []);

  const monthlyGross = paychecks.reduce((s, p) => s + toMonthly(parseFloat(p.grossPay), p.frequency), 0);
  const monthlyNet   = paychecks.reduce((s, p) => s + toMonthly(parseFloat(p.netPay),   p.frequency), 0);
  const { buckets, wasScaled } = calcCustomBuckets(monthlyGross, monthlyNet, profile.age, profile.goals, profile.householdSize);

  const incomeNote = paychecks.length > 1
    ? `${paychecks.length} income sources combined`
    : (() => {
        const p = paychecks[0];
        const label = { weekly: 'week', biweekly: 'bi-weekly paycheck', monthly: 'month', yearly: 'year' }[p.frequency];
        return `Based on ${fmt(parseFloat(p.netPay))} per ${label}`;
      })();

  const toggle = (id) => setExpandedId((cur) => (cur === id ? null : id));

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Budget Breakdown</h2>
        <div className="grid grid-cols-2 gap-2 mt-3">
          <div className="bg-gray-50 rounded-xl px-3 py-2.5">
            <p className="text-xs text-gray-400 font-semibold uppercase tracking-wide">Monthly</p>
            <p className="text-xl font-bold text-gray-900 mt-0.5">{fmt(monthlyNet)}</p>
            <p className="text-xs text-gray-400">take-home · {fmt(monthlyGross)} gross</p>
          </div>
          <div className="bg-gray-50 rounded-xl px-3 py-2.5">
            <p className="text-xs text-gray-400 font-semibold uppercase tracking-wide">Yearly</p>
            <p className="text-xl font-bold text-gray-900 mt-0.5">{fmt(monthlyNet * 12)}</p>
            <p className="text-xs text-gray-400">take-home · {fmt(monthlyGross * 12)} gross</p>
          </div>
        </div>
        <p className="text-xs text-gray-400 mt-2">{incomeNote} · {profile.householdSize > 1 ? `${profile.householdSize}-person household · ` : ''}Tap any card for tips</p>
      </div>

      {wasScaled && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-sm text-amber-800">
          ⚖️ Some savings buckets were reduced to keep your budget balanced — essentials and a 5% spending buffer are always protected.
        </div>
      )}

      <div className="space-y-3">
        {buckets.map((b) => (
          <BucketCard
            key={b.id}
            bucket={b}
            expanded={expandedId === b.id}
            onToggle={() => toggle(b.id)}
          />
        ))}
      </div>

      <div className="flex gap-3">
        <button
          onClick={onBack}
          className="flex-none py-4 px-6 border-2 border-gray-200 text-gray-600 font-semibold rounded-xl hover:border-gray-300 transition-colors"
        >
          ← Edit
        </button>
        <button
          onClick={onRestart}
          className="flex-1 py-4 border-2 border-blue-200 text-blue-600 font-semibold rounded-xl hover:bg-blue-50 transition-colors"
        >
          Start Over
        </button>
      </div>
    </div>
  );
}
