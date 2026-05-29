const GOALS = [
  { id: 'house', label: 'Buy a House', icon: '🏡' },
  { id: 'debt', label: 'Pay Off Debt', icon: '💳' },
  { id: 'security', label: 'Build Emergency Fund', icon: '🛡️' },
  { id: 'retire', label: 'Retire Early', icon: '🌴' },
  { id: 'travel', label: 'Travel More', icon: '✈️' },
  { id: 'invest', label: 'Grow Wealth', icon: '📈' },
];

export default function UserProfile({ data, onChange, onBack, onNext }) {
  const set = (field, val) => onChange({ ...data, [field]: val });

  const toggleGoal = (id) => {
    const goals = data.goals.includes(id)
      ? data.goals.filter((g) => g !== id)
      : [...data.goals, id];
    set('goals', goals);
  };

  const canContinue = data.age >= 18 && data.goals.length > 0;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">About You</h2>
        <p className="text-gray-500 mt-1">We'll tailor your budget to your situation</p>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-3">
          Your Age
          <span className="ml-2 text-blue-600 font-bold text-lg">{data.age}</span>
        </label>
        <input
          type="range"
          min="18"
          max="70"
          value={data.age}
          onChange={(e) => set('age', parseInt(e.target.value))}
          className="w-full accent-blue-600"
        />
        <div className="flex justify-between text-xs text-gray-400 mt-1">
          <span>18</span>
          <span>70+</span>
        </div>
        <p className="text-xs text-gray-400 mt-2">
          {data.age >= 50
            ? "⚡ Catch-up contributions available — we'll recommend higher savings rates"
            : data.age <= 30
            ? "🚀 Starting early — compound interest is your biggest asset"
            : "📊 Mid-career — balancing growth and protection"}
        </p>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-3">
          Household Size
          <span className="ml-2 text-blue-600 font-bold text-lg">{data.householdSize}</span>
          <span className="ml-1 text-gray-400 font-normal text-sm">
            {data.householdSize === 1 ? 'person' : 'people'}
          </span>
        </label>
        <div className="flex gap-2 flex-wrap">
          {[1, 2, 3, 4, 5, 6, 7, '8+'].map((n) => {
            const val = n === '8+' ? 8 : n;
            const selected = data.householdSize === val;
            return (
              <button
                key={n}
                onClick={() => set('householdSize', val)}
                className={`w-12 h-12 rounded-xl text-sm font-semibold border-2 transition-all ${
                  selected
                    ? 'border-blue-500 bg-blue-50 text-blue-700'
                    : 'border-gray-200 text-gray-600 hover:border-gray-300'
                }`}
              >
                {n}
              </button>
            );
          })}
        </div>
        <p className="text-xs text-gray-400 mt-2">
          {data.householdSize === 1
            ? 'Solo budget — all income goes toward your own goals'
            : data.householdSize === 2
            ? 'Two-person household — food and transport budgets adjusted'
            : `${data.householdSize}-person household — food budget scales up, other categories adjusted`}
        </p>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-3">
          Financial Goals <span className="text-gray-400">(pick all that apply)</span>
        </label>
        <div className="grid grid-cols-2 gap-2">
          {GOALS.map((g) => {
            const selected = data.goals.includes(g.id);
            return (
              <button
                key={g.id}
                onClick={() => toggleGoal(g.id)}
                className={`flex items-center gap-2 p-3 rounded-xl border-2 text-left transition-all ${
                  selected
                    ? 'border-blue-500 bg-blue-50 text-blue-700'
                    : 'border-gray-200 text-gray-600 hover:border-gray-300'
                }`}
              >
                <span className="text-xl">{g.icon}</span>
                <span className="text-sm font-medium">{g.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="flex gap-3">
        <button
          onClick={onBack}
          className="flex-none py-4 px-6 border-2 border-gray-200 text-gray-600 font-semibold rounded-xl hover:border-gray-300 transition-colors"
        >
          ← Back
        </button>
        <button
          onClick={onNext}
          disabled={!canContinue}
          className="flex-1 py-4 bg-blue-600 text-white font-semibold rounded-xl disabled:opacity-40 disabled:cursor-not-allowed hover:bg-blue-700 active:bg-blue-800 transition-colors text-lg"
        >
          See My Budget →
        </button>
      </div>
    </div>
  );
}
