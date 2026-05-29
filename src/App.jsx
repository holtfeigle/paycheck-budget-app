import { useState } from 'react';
import PaycheckInput from './components/PaycheckInput';
import UserProfile from './components/UserProfile';
import BudgetBreakdown from './components/BudgetBreakdown';
import './index.css';

const STEPS = ['Income', 'About You', 'Your Budget'];

const defaultProfile = { age: 28, goals: [], householdSize: 1 };

export default function App() {
  const [step, setStep] = useState(0);
  const [paychecks, setPaychecks] = useState([]);
  const [profile, setProfile] = useState(defaultProfile);

  const restart = () => {
    setPaychecks([]);
    setProfile(defaultProfile);
    setStep(0);
  };

  return (
    <div className="min-h-dvh flex flex-col bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-100 px-4 py-4 sticky top-0 z-10">
        <div className="max-w-md mx-auto">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h1 className="text-xl font-bold text-gray-900 m-0">PaySplit</h1>
              <p className="text-xs text-gray-400 m-0">Paycheck → Budget in 60 seconds</p>
            </div>
            <div className="text-2xl">💰</div>
          </div>
          <div className="flex items-center gap-1">
            {STEPS.map((label, i) => (
              <div key={i} className="flex items-center gap-1 flex-1 last:flex-none">
                <div className={`flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold transition-all shrink-0 ${
                  i < step ? 'bg-blue-600 text-white'
                  : i === step ? 'bg-blue-600 text-white ring-4 ring-blue-100'
                  : 'bg-gray-200 text-gray-400'
                }`}>
                  {i < step ? '✓' : i + 1}
                </div>
                <span className={`text-xs font-medium ${i === step ? 'text-blue-600' : 'text-gray-400'}`}>
                  {label}
                </span>
                {i < STEPS.length - 1 && (
                  <div className={`flex-1 h-0.5 rounded-full mx-1 ${i < step ? 'bg-blue-600' : 'bg-gray-200'}`} />
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="flex-1 px-4 py-6">
        <div className="max-w-md mx-auto">
          {step === 0 && (
            <PaycheckInput
              paychecks={paychecks}
              onPaychecksChange={setPaychecks}
              onNext={() => setStep(1)}
            />
          )}
          {step === 1 && (
            <UserProfile
              data={profile}
              onChange={setProfile}
              onBack={() => setStep(0)}
              onNext={() => setStep(2)}
            />
          )}
          {step === 2 && (
            <BudgetBreakdown
              paychecks={paychecks}
              profile={profile}
              onBack={() => setStep(1)}
              onRestart={restart}
            />
          )}
        </div>
      </div>

      <div className="text-center py-4 text-xs text-gray-300">
        No data stored · All calculations run locally
      </div>
    </div>
  );
}
