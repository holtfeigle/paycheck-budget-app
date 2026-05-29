import { useState } from 'react';
import { STATES, estimateNetPay } from '../utils/taxCalc';
import { toMonthly } from '../utils/budgetCalc';

const FREQUENCIES = [
  { value: 'yearly',   label: 'Yearly' },
  { value: 'monthly',  label: 'Monthly' },
  { value: 'biweekly', label: 'Bi-weekly' },
  { value: 'weekly',   label: 'Weekly' },
];

const PERIODS = { weekly: 52, biweekly: 26, monthly: 12, yearly: 1 };

const emptyDraft = { grossPay: '', netPay: '', frequency: 'yearly' };

function fmt(n) {
  return n.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });
}
function fmtFull(n) {
  return n.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 2 });
}

// ── Paycheck entry form ──────────────────────────────────────────────────────

function PaycheckForm({ draft, onChange, onSave }) {
  const [payType,      setPayType]      = useState('salary');
  const [hourlyRate,   setHourlyRate]   = useState('');
  const [hoursPerWeek, setHoursPerWeek] = useState('40');
  const [stateCode,    setStateCode]    = useState('');
  const [filing,       setFiling]       = useState('single');

  // Auto-compute net pay from the current inputs
  const calcNet = (gross, freq, fil, st) => {
    if (!gross || !freq || !st || parseFloat(gross) <= 0) return '';
    const r = estimateNetPay(parseFloat(gross), freq, fil, st);
    return { net: String(r.net), breakdown: r.breakdown };
  };

  const pushChange = (patch) => {
    const next = { ...draft, ...patch };
    const result = calcNet(next.grossPay, next.frequency, filing, stateCode);
    onChange({ ...next, netPay: result ? result.net : '' });
  };

  const pushChangeWithTaxParams = (gross, freq, fil, st) => {
    const result = calcNet(gross, freq, fil, st);
    onChange({ ...draft, grossPay: gross, frequency: freq, netPay: result ? result.net : '' });
  };

  const computeHourlyGross = (rate, hours, freq) => {
    const r = parseFloat(rate), h = parseFloat(hours);
    if (r > 0 && h > 0) return String(((r * h * 52) / PERIODS[freq]).toFixed(2));
    return '';
  };

  const handleGrossPay = (val) => pushChange({ grossPay: val });

  const handleHourlyRate = (val) => {
    setHourlyRate(val);
    const gross = computeHourlyGross(val, hoursPerWeek, draft.frequency);
    pushChangeWithTaxParams(gross, draft.frequency, filing, stateCode);
  };

  const handleHoursPerWeek = (val) => {
    setHoursPerWeek(val);
    const gross = computeHourlyGross(hourlyRate, val, draft.frequency);
    pushChangeWithTaxParams(gross, draft.frequency, filing, stateCode);
  };

  const handleState = (st) => {
    setStateCode(st);
    pushChangeWithTaxParams(draft.grossPay, draft.frequency, filing, st);
  };

  const handleFiling = (fil) => {
    setFiling(fil);
    pushChangeWithTaxParams(draft.grossPay, draft.frequency, fil, stateCode);
  };

  const handlePayType = (val) => {
    setPayType(val);
    if (val === 'salary') {
      setHourlyRate('');
      // Always land back on yearly for salary
      onChange({ ...draft, grossPay: '', frequency: 'yearly', netPay: '' });
    } else {
      // Hourly always uses biweekly (frequency is hidden)
      const gross = computeHourlyGross(hourlyRate, hoursPerWeek, 'biweekly');
      const result = calcNet(gross, 'biweekly', filing, stateCode);
      onChange({ ...draft, frequency: 'biweekly', grossPay: gross, netPay: result ? result.net : '' });
    }
  };

  const netResult = calcNet(draft.grossPay, draft.frequency, filing, stateCode);
  const draftValid = !!(draft.grossPay && draft.netPay && draft.frequency && stateCode);

  return (
    <div className="space-y-4">

      {/* Pay type */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Pay Type</label>
        <div className="flex gap-2">
          {[['salary', '💼 Salary'], ['hourly', '⏱️ Hourly']].map(([val, label]) => (
            <button
              key={val}
              onClick={() => handlePayType(val)}
              className={`flex-1 py-2.5 rounded-xl text-sm font-semibold border-2 transition-all ${
                payType === val
                  ? 'border-blue-500 bg-blue-50 text-blue-700'
                  : 'border-gray-200 text-gray-600 hover:border-gray-300'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Gross pay / hourly inputs */}
      {payType === 'hourly' ? (
        <>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Hourly Rate</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 font-medium">$</span>
                <input
                  type="number"
                  placeholder="0.00"
                  value={hourlyRate}
                  onChange={(e) => handleHourlyRate(e.target.value)}
                  className="w-full pl-8 pr-4 py-3 border border-gray-200 rounded-xl text-gray-900 text-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Hours / Week</label>
              <input
                type="number"
                placeholder="40"
                value={hoursPerWeek}
                onChange={(e) => handleHoursPerWeek(e.target.value)}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl text-gray-900 text-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
          {draft.grossPay && !netResult && (
            <div className="bg-gray-50 rounded-xl px-3 py-2 text-sm text-gray-600">
              Gross per paycheck: <span className="font-semibold text-gray-900">{fmt(parseFloat(draft.grossPay))}</span>
            </div>
          )}
        </>
      ) : (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {draft.frequency === 'yearly' ? 'Annual Salary (gross)' : 'Gross Pay (before taxes)'}
          </label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 font-medium">$</span>
            <input
              type="number"
              placeholder="0.00"
              value={draft.grossPay}
              onChange={(e) => handleGrossPay(e.target.value)}
              className="w-full pl-8 pr-4 py-3 border border-gray-200 rounded-xl text-gray-900 text-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
      )}

      {/* Tax fields — state + filing status */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">State</label>
          <select
            value={stateCode}
            onChange={(e) => handleState(e.target.value)}
            className="w-full px-3 py-3 border border-gray-200 rounded-xl text-sm text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Select…</option>
            {STATES.map((s) => (
              <option key={s.code} value={s.code}>{s.name}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Filing Status</label>
          <div className="flex gap-2 h-[46px]">
            {[['single', 'Single'], ['married', 'Married']].map(([val, label]) => (
              <button
                key={val}
                onClick={() => handleFiling(val)}
                className={`flex-1 rounded-xl text-sm font-medium border-2 transition-all ${
                  filing === val
                    ? 'border-blue-500 bg-blue-50 text-blue-700'
                    : 'border-gray-200 text-gray-600 hover:border-gray-300'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Auto-calculated take-home result */}
      {netResult ? (
        <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4">
          {payType === 'hourly' ? (() => {
            const monthlyGross = parseFloat(draft.grossPay) * 26 / 12;
            const yearlyGross  = parseFloat(draft.grossPay) * 26;
            const monthlyNet   = parseFloat(netResult.net) * 26 / 12;
            const yearlyNet    = parseFloat(netResult.net) * 26;
            return (
              <>
                <p className="text-sm font-semibold text-emerald-800 mb-2">Estimated take-home</p>
                <div className="grid grid-cols-2 gap-2 mb-3">
                  <div className="bg-white/60 rounded-xl px-3 py-2.5">
                    <p className="text-xs text-emerald-700 font-semibold uppercase tracking-wide">Monthly</p>
                    <p className="text-lg font-bold text-emerald-800">{fmt(monthlyNet)}</p>
                    <p className="text-xs text-emerald-600 opacity-70">{fmt(monthlyGross)} gross</p>
                  </div>
                  <div className="bg-white/60 rounded-xl px-3 py-2.5">
                    <p className="text-xs text-emerald-700 font-semibold uppercase tracking-wide">Yearly</p>
                    <p className="text-lg font-bold text-emerald-800">{fmt(yearlyNet)}</p>
                    <p className="text-xs text-emerald-600 opacity-70">{fmt(yearlyGross)} gross</p>
                  </div>
                </div>
              </>
            );
          })() : (
            <div className="flex items-baseline justify-between mb-2">
              <span className="text-sm font-semibold text-emerald-800">Estimated take-home</span>
              <span className="text-2xl font-bold text-emerald-700">{fmtFull(parseFloat(netResult.net))}</span>
            </div>
          )}
          <div className="pt-2 border-t border-emerald-100 flex flex-wrap gap-x-4 gap-y-0.5 text-xs text-emerald-700 opacity-80">
            <span>Federal {fmtFull(netResult.breakdown.federal)}</span>
            <span>SS {fmtFull(netResult.breakdown.ss)}</span>
            <span>Medicare {fmtFull(netResult.breakdown.medicare)}</span>
            {netResult.breakdown.noStateTax
              ? <span>No state tax 🎉</span>
              : <span>{netResult.breakdown.stateName} {fmtFull(netResult.breakdown.state)}</span>
            }
          </div>
          <p className="text-xs text-emerald-600 opacity-60 mt-2">
            Estimate — excludes 401k, health insurance, and other pre-tax deductions
          </p>
          <div className="mt-2 pt-2 border-t border-emerald-100">
            <a
              href="https://turbotax.intuit.com/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs font-semibold text-emerald-700 hover:text-emerald-900 underline underline-offset-2"
            >
              File your taxes with TurboTax →
            </a>
          </div>
        </div>
      ) : (
        draft.grossPay && !stateCode && (
          <p className="text-xs text-gray-400 text-center">Select your state to calculate take-home pay</p>
        )
      )}

      <button
        onClick={onSave}
        disabled={!draftValid}
        className="w-full py-3.5 bg-blue-600 text-white font-semibold rounded-xl disabled:opacity-30 disabled:cursor-not-allowed hover:bg-blue-700 active:bg-blue-800 transition-colors"
      >
        {draftValid ? '+ Add Income' : 'Complete the fields above to add'}
      </button>
    </div>
  );
}

// ── Main component ───────────────────────────────────────────────────────────

export default function PaycheckInput({ paychecks, onPaychecksChange, onNext }) {
  const [draft, setDraft] = useState(emptyDraft);

  const addDraft = () => {
    if (!draft.grossPay || !draft.netPay || !draft.frequency) return;
    onPaychecksChange([...paychecks, draft]);
    setDraft(emptyDraft);
  };

  const remove = (i) => onPaychecksChange(paychecks.filter((_, idx) => idx !== i));

  const handleContinue = () => {
    if (draft.grossPay && draft.netPay && draft.frequency) {
      onPaychecksChange([...paychecks, draft]);
    }
    onNext();
  };

  const draftValid = !!(draft.grossPay && draft.netPay && draft.frequency);
  const canContinue = draftValid || paychecks.length > 0;
  const totalCount = paychecks.length + (draftValid ? 1 : 0);

  const combinedMonthlyNet = paychecks.reduce(
    (sum, p) => sum + toMonthly(parseFloat(p.netPay), p.frequency), 0
  );

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Household Income</h2>
        <p className="text-gray-500 mt-1">Enter your income details to get started</p>
      </div>

      <PaycheckForm
        draft={draft}
        onChange={setDraft}
        onSave={addDraft}
      />

      {paychecks.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <div className="flex-1 h-px bg-gray-200" />
            <span className="text-xs font-semibold text-gray-400 uppercase tracking-wide">
              {paychecks.length === 1 ? 'Saved income' : 'Saved incomes'}
            </span>
            <div className="flex-1 h-px bg-gray-200" />
          </div>

          {paychecks.map((p, i) => (
            <div key={i} className="flex items-center justify-between bg-green-50 border border-green-200 rounded-xl px-4 py-3">
              <div className="flex items-center gap-3">
                <span className="text-green-500 text-lg">✓</span>
                <div>
                  <p className="text-sm font-semibold text-gray-800">
                    Income {i + 1} · {fmt(toMonthly(parseFloat(p.netPay), p.frequency))}/mo take-home
                  </p>
                  <p className="text-xs text-gray-400">
                    ${parseFloat(p.grossPay).toLocaleString()} gross · {FREQUENCIES.find(f => f.value === p.frequency)?.label}
                  </p>
                </div>
              </div>
              <button
                onClick={() => remove(i)}
                className="text-gray-300 hover:text-red-400 text-xl leading-none transition-colors ml-3"
                aria-label="Remove"
              >
                ×
              </button>
            </div>
          ))}

          {paychecks.length > 1 && (
            <div className="bg-blue-50 rounded-xl px-4 py-3 flex justify-between items-center">
              <span className="text-sm font-medium text-blue-700">Combined take-home</span>
              <span className="text-lg font-bold text-blue-700">{fmt(combinedMonthlyNet)}/mo</span>
            </div>
          )}
        </div>
      )}

      <button
        onClick={handleContinue}
        disabled={!canContinue}
        className="w-full py-4 bg-gray-900 text-white font-semibold rounded-xl disabled:opacity-30 disabled:cursor-not-allowed hover:bg-gray-800 active:bg-black transition-colors text-lg"
      >
        {canContinue
          ? `Continue with ${totalCount} income source${totalCount !== 1 ? 's' : ''} →`
          : 'Enter your income above to continue'}
      </button>
    </div>
  );
}
