import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { 
  Zap, 
  Car, 
  ShoppingBag, 
  TrendingDown, 
  Trash2, 
  PlusCircle, 
  AlertCircle, 
  CheckCircle,
  HelpCircle,
  Activity
} from 'lucide-react';

function Dashboard({ token, onLogout }) {
  // Data State
  const [history, setHistory] = useState([]);
  const [analytics, setAnalytics] = useState({
    totalEmissions: 0,
    breakdown: { utility: 0, transportation: 0, consumption: 0 }
  });
  
  // Form State
  const [activityType, setActivityType] = useState('utility');
  const [kwh, setKwh] = useState('');
  const [gasTherms, setGasTherms] = useState('');
  const [miles, setMiles] = useState('');
  const [flightMiles, setFlightMiles] = useState('');
  const [meatServings, setMeatServings] = useState('');
  const [wasteKg, setWasteKg] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);

  // UI States
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [carbonBudget, setCarbonBudget] = useState(500);
  
  // A11y Live Region Message State
  const [srAnnouncement, setSrAnnouncement] = useState('Dashboard loaded. No carbon data logged yet.');

  // Ref to skip link/main section to focus if required
  const mainFormRef = useRef(null);

  useEffect(() => {
    fetchData();
  }, [token]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const headers = { Authorization: `Bearer ${token}` };
      const [historyRes, analyticsRes] = await Promise.all([
        axios.get('/api/footprint', { headers }),
        axios.get('/api/footprint/analytics', { headers })
      ]);

      const histData = historyRes.data?.data || historyRes.body?.data || [];
      const analyticsData = analyticsRes.data?.data || analyticsRes.body?.data || {
        totalEmissions: 0,
        breakdown: { utility: 0, transportation: 0, consumption: 0 }
      };

      setHistory(histData);
      setAnalytics(analyticsData);

      // Set screen reader notification
      const announceText = `Data loaded. Your total carbon footprint is ${analyticsData.totalEmissions} kilograms. Utility accounts for ${analyticsData.breakdown.utility} kg, transportation for ${analyticsData.breakdown.transportation} kg, and consumption for ${analyticsData.breakdown.consumption} kg.`;
      setSrAnnouncement(announceText);
    } catch (err) {
      console.error(err);
      setErrorMsg('Failed to load carbon footprint data.');
    } finally {
      setLoading(false);
    }
  };

  const handleLogSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');
    
    // Compile parameters based on activityType
    let parameters = {};
    if (activityType === 'utility') {
      const kValue = parseFloat(kwh);
      const gValue = parseFloat(gasTherms);
      if (isNaN(kValue) && isNaN(gValue)) {
        setErrorMsg('Please specify at least one utility parameter (kWh or Gas Therms).');
        return;
      }
      if (kValue < 0 || gValue < 0) {
        setErrorMsg('Values cannot be negative.');
        return;
      }
      parameters = { kwh: kValue || 0, gasTherms: gValue || 0 };
    } else if (activityType === 'transportation') {
      const mValue = parseFloat(miles);
      const fValue = parseFloat(flightMiles);
      if (isNaN(mValue) && isNaN(fValue)) {
        setErrorMsg('Please specify at least one transportation parameter (Miles or Flight Miles).');
        return;
      }
      if (mValue < 0 || fValue < 0) {
        setErrorMsg('Values cannot be negative.');
        return;
      }
      parameters = { miles: mValue || 0, flightMiles: fValue || 0 };
    } else if (activityType === 'consumption') {
      const mtValue = parseFloat(meatServings);
      const wValue = parseFloat(wasteKg);
      if (isNaN(mtValue) && isNaN(wValue)) {
        setErrorMsg('Please specify at least one consumption parameter (Meat servings or Waste kg).');
        return;
      }
      if (mtValue < 0 || wValue < 0) {
        setErrorMsg('Values cannot be negative.');
        return;
      }
      parameters = { meatServings: mtValue || 0, wasteKg: wValue || 0 };
    }

    setSubmitting(true);
    try {
      const headers = { Authorization: `Bearer ${token}` };
      const res = await axios.post('/api/footprint', {
        activityType,
        parameters,
        date
      }, { headers });

      const newLog = res.data?.data || res.body?.data;
      setSuccessMsg(`Successfully logged activity. Added ${newLog.carbonEmissionsKg} kg of CO2 emissions.`);
      
      // Clear inputs
      setKwh('');
      setGasTherms('');
      setMiles('');
      setFlightMiles('');
      setMeatServings('');
      setWasteKg('');

      // Refresh data
      await fetchData();
    } catch (err) {
      const msg = err.response?.data?.message || err.response?.data?.errors?.[0]?.message || 'Failed to submit footprint log.';
      setErrorMsg(msg);
      // Screen reader announcement on failure
      setSrAnnouncement(`Error: ${msg}`);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id, emissionsKg) => {
    setErrorMsg('');
    setSuccessMsg('');
    try {
      const headers = { Authorization: `Bearer ${token}` };
      await axios.delete(`/api/footprint/${id}`, { headers });
      setSuccessMsg('Log entry successfully deleted.');
      await fetchData();
    } catch (err) {
      console.error(err);
      setErrorMsg('Failed to delete log entry.');
    }
  };

  // Recommendations Logic based on values
  const getInsights = () => {
    const { utility, transportation, consumption } = analytics.breakdown;
    const total = analytics.totalEmissions || 0;

    if (total === 0) {
      return [{
        id: 'low',
        type: 'good',
        category: 'General',
        text: 'Excellent work! Your emissions are tracking well below regional thresholds. Keep up your active preservation and smart climate choices!'
      }];
    }

    let highestCat = 'utility';
    let highestValue = utility;
    let heading = 'Utilities & Energy';
    let advice = 'Your utility emissions are your highest contributor. Adjust thermostat settings, turn off idle appliances, and transition to LED lighting to reduce energy waste.';

    if (transportation > highestValue) {
      highestCat = 'transportation';
      highestValue = transportation;
      heading = 'Transportation';
      advice = 'Your transportation emissions represent your highest impact area. Try walking, cycling, or utilizing public transport to lower this weight.';
    }

    if (consumption > highestValue) {
      highestCat = 'consumption';
      highestValue = consumption;
      heading = 'Consumption & Diet';
      advice = 'Your diet and consumption habits are your primary emission drivers. Consider adding plant-based alternatives and actively sorting waste to minimize organic garbage.';
    }

    return [{
      id: 'high-contributor',
      type: 'high',
      category: heading,
      text: advice
    }];
  };

  const getUnlockedBadges = () => {
    const badges = [];
    const { utility, transportation, consumption } = breakd;

    if (history.length > 0 && utility > 0 && utility < 100) {
      badges.push({
        id: 'clean_energy',
        name: 'Energy Conservator',
        icon: '⚡',
        desc: 'Utility emissions kept under 100 kg.',
        color: 'border-amber-500/30 bg-amber-950/20 text-amber-300'
      });
    }

    if (history.length > 0 && transportation > 0 && transportation < 150) {
      badges.push({
        id: 'low_commuter',
        name: 'Eco-Commuter',
        icon: '🚲',
        desc: 'Transportation emissions kept under 150 kg.',
        color: 'border-sky-500/30 bg-sky-950/20 text-sky-300'
      });
    }

    if (history.length > 0 && consumption > 0 && consumption < 50) {
      badges.push({
        id: 'conscious_consumer',
        name: 'Conscious Eater',
        icon: '🥗',
        desc: 'Diet & consumption kept under 50 kg.',
        color: 'border-emerald-500/30 bg-emerald-950/20 text-emerald-300'
      });
    }

    if (history.length > 0 && total < 300) {
      badges.push({
        id: 'carbon_savior',
        name: 'Climate Guardian',
        icon: '🌍',
        desc: 'Overall emissions maintained under 300 kg CO₂.',
        color: 'border-green-500/30 bg-green-950/20 text-green-300'
      });
    }

    return badges;
  };

  const total = analytics.totalEmissions || 0;
  const breakd = analytics.breakdown || { utility: 0, transportation: 0, consumption: 0 };
  const utilityPct = total > 0 ? ((breakd.utility / total) * 100).toFixed(0) : 0;
  const transPct = total > 0 ? ((breakd.transportation / total) * 100).toFixed(0) : 0;
  const consPct = total > 0 ? ((breakd.consumption / total) * 100).toFixed(0) : 0;

  const renderHighestEmissionsTips = () => {
    const { utility, transportation, consumption } = breakd;

    if (utility === 0 && transportation === 0 && consumption === 0) {
      return (
        <div className="mt-6 p-4 rounded-xl border border-slate-800 bg-slate-900/40 text-center">
          <p className="text-sm text-green-400 font-medium">
            🌱 Your carbon footprint is currently zero! Keep logging your daily activities to track your environmental impact.
          </p>
        </div>
      );
    }

    let highestCategory = 'utility';
    let highestValue = utility;

    if (transportation > highestValue) {
      highestCategory = 'transportation';
      highestValue = transportation;
    }
    if (consumption > highestValue) {
      highestCategory = 'consumption';
      highestValue = consumption;
    }

    const tips = {
      utility: [
        'Unplug vampire devices (electronics on standby mode) to reduce idle electricity load by up to 10%.',
        'Switch to LED lightbulbs which use 75% less energy and last 25 times longer than incandescent lighting.',
        'Adjust your thermostat by just 2°F (lower in winter, higher in summer) to save on HVAC emissions.'
      ],
      transportation: [
        'Opt for public transit, cycling, or walking for trips under 3 miles to eliminate direct vehicle exhaust emissions.',
        'Ensure vehicle tires are properly inflated and engine oil is clean to optimize fuel efficiency by 3%.',
        'Consolidate multiple short errands into one single trip to avoid cold-starts which consume more fuel.'
      ],
      consumption: [
        'Substitute beef or lamb with poultry or plant-based proteins to cut diet emissions by up to 50%.',
        'Plan meals ahead to reduce solid organic waste and compost scraps to prevent landfill methane generation.',
        'Buy local, seasonal produce to minimize food miles and emission overheads from long-distance transit.'
      ]
    };

    const categoryNames = {
      utility: 'Utilities & Energy',
      transportation: 'Transportation & Air Travel',
      consumption: 'Consumption & Diet'
    };

    const categoryColors = {
      utility: 'text-amber-400',
      transportation: 'text-sky-400',
      consumption: 'text-emerald-400'
    };

    return (
      <div className="mt-6 p-5 rounded-xl border border-slate-800/85 bg-slate-900/50">
        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
          Targeted Reduction Tips for your Highest Contributor:{' '}
          <span className={categoryColors[highestCategory]}>{categoryNames[highestCategory]}</span>
        </h4>
        <ul className="space-y-2.5 text-sm text-slate-300">
          {tips[highestCategory].map((tip, idx) => (
            <li key={idx} className="flex items-start space-x-2">
              <span className="text-green-500 font-bold mt-0.5" aria-hidden="true">•</span>
              <span>{tip}</span>
            </li>
          ))}
        </ul>
      </div>
    );
  };


  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full flex flex-col space-y-8">
      
      {/* 1. Aria-Live Announcement Zone - Visually Hidden */}
      <div 
        className="sr-only" 
        role="status" 
        aria-live="polite" 
        aria-atomic="true"
      >
        {srAnnouncement}
      </div>

      {/* Main Title Section */}
      <section className="flex flex-col md:flex-row md:items-center justify-between border-b border-slate-800 pb-6 gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight sm:text-4xl">
            Environmental Impact Dashboard
          </h1>
          <p className="text-slate-400 mt-2">
            Track your activities and gain live insights into your carbon footprint.
          </p>
        </div>
        <div className="flex items-center space-x-3 bg-slate-900 border border-slate-800 px-4 py-2.5 rounded-xl self-start md:self-center">
          <Activity className="h-5 w-5 text-green-400" />
          <span className="text-sm font-semibold text-slate-300">
            Carbon Standard: 2026 IPCC Factors
          </span>
        </div>
      </section>

      {/* Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Side: Input Form (5 cols) */}
        <section className="lg:col-span-5" aria-labelledby="form-section-title">
          <div className="bg-[#0f172a]/95 border border-slate-800/80 rounded-2xl p-6 shadow-xl backdrop-blur-xl relative overflow-hidden h-full">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-green-500 to-emerald-500" />
            
            <header className="mb-6">
              <h2 id="form-section-title" className="text-xl font-bold text-white flex items-center space-x-2">
                <PlusCircle className="h-5 w-5 text-green-400" />
                <span>Daily Activity Log</span>
              </h2>
              <p className="text-xs text-slate-400 mt-1">
                Enter your data below. Empty values will count as zero.
              </p>
            </header>

            {errorMsg && (
              <div 
                className="mb-4 p-3.5 bg-red-950/40 border border-red-500/30 rounded-xl text-red-300 text-sm flex items-start space-x-2"
                role="alert"
                id="form-validation-error"
              >
                <AlertCircle className="h-5 w-5 flex-shrink-0 mt-0.5" />
                <span>{errorMsg}</span>
              </div>
            )}

            {successMsg && (
              <div 
                className="mb-4 p-3.5 bg-green-950/40 border border-green-500/30 rounded-xl text-green-300 text-sm flex items-start space-x-2" 
                role="alert"
              >
                <CheckCircle className="h-5 w-5 flex-shrink-0 mt-0.5" />
                <span>{successMsg}</span>
              </div>
            )}

            <form onSubmit={handleLogSubmit} className="space-y-5" ref={mainFormRef}>
              <div>
                <label htmlFor="activityType" className="block text-sm font-semibold text-slate-300 mb-1.5">
                  Activity Category
                </label>
                <select
                  id="activityType"
                  value={activityType}
                  onChange={(e) => {
                    setActivityType(e.target.value);
                    setErrorMsg('');
                    setSuccessMsg('');
                  }}
                  className="w-full bg-slate-900 border border-slate-700/80 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-600 focus:ring-offset-slate-900 transition duration-200"
                >
                  <option value="utility">Utility & Energy</option>
                  <option value="transportation">Transportation & Flights</option>
                  <option value="consumption">Food & Consumption</option>
                </select>
              </div>

              {/* Utility Parameters Inputs */}
              {activityType === 'utility' && (
                <div className="space-y-4" data-testid="utility-inputs">
                  <div>
                    <label htmlFor="kwh-input" className="block text-sm font-semibold text-slate-300 mb-1">
                      Electricity Usage (kWh)
                    </label>
                    <input
                      id="kwh-input"
                      type="number"
                      step="any"
                      min="0"
                      value={kwh}
                      onChange={(e) => setKwh(e.target.value)}
                      placeholder="e.g., 120"
                      className="w-full bg-slate-900 border border-slate-700/80 rounded-xl px-3.5 py-2 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-600 focus:ring-offset-slate-900 transition duration-200"
                    />
                  </div>
                  <div>
                    <label htmlFor="gasTherms-input" className="block text-sm font-semibold text-slate-300 mb-1">
                      Gas Usage (Therms)
                    </label>
                    <input
                      id="gasTherms-input"
                      type="number"
                      step="any"
                      min="0"
                      value={gasTherms}
                      onChange={(e) => setGasTherms(e.target.value)}
                      placeholder="e.g., 12"
                      className="w-full bg-slate-900 border border-slate-700/80 rounded-xl px-3.5 py-2 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-600 focus:ring-offset-slate-900 transition duration-200"
                    />
                  </div>
                </div>
              )}

              {/* Transportation Parameters Inputs */}
              {activityType === 'transportation' && (
                <div className="space-y-4" data-testid="transportation-inputs">
                  <div>
                    <label htmlFor="miles-input" className="block text-sm font-semibold text-slate-300 mb-1">
                      Vehicle Travel (Miles)
                    </label>
                    <input
                      id="miles-input"
                      type="number"
                      step="any"
                      min="0"
                      value={miles}
                      onChange={(e) => setMiles(e.target.value)}
                      placeholder="e.g., 45"
                      className="w-full bg-slate-900 border border-slate-700/80 rounded-xl px-3.5 py-2 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-600 focus:ring-offset-slate-900 transition duration-200"
                    />
                  </div>
                  <div>
                    <label htmlFor="flightMiles-input" className="block text-sm font-semibold text-slate-300 mb-1">
                      Air Travel (Flight Miles)
                    </label>
                    <input
                      id="flightMiles-input"
                      type="number"
                      step="any"
                      min="0"
                      value={flightMiles}
                      onChange={(e) => setFlightMiles(e.target.value)}
                      placeholder="e.g., 350"
                      className="w-full bg-slate-900 border border-slate-700/80 rounded-xl px-3.5 py-2 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-600 focus:ring-offset-slate-900 transition duration-200"
                    />
                  </div>
                </div>
              )}

              {/* Consumption Parameters Inputs */}
              {activityType === 'consumption' && (
                <div className="space-y-4" data-testid="consumption-inputs">
                  <div>
                    <label htmlFor="meatServings-input" className="block text-sm font-semibold text-slate-300 mb-1">
                      Meat Servings Consumed
                    </label>
                    <input
                      id="meatServings-input"
                      type="number"
                      step="any"
                      min="0"
                      value={meatServings}
                      onChange={(e) => setMeatServings(e.target.value)}
                      placeholder="e.g., 2"
                      className="w-full bg-slate-900 border border-slate-700/80 rounded-xl px-3.5 py-2 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-600 focus:ring-offset-slate-900 transition duration-200"
                    />
                  </div>
                  <div>
                    <label htmlFor="wasteKg-input" className="block text-sm font-semibold text-slate-300 mb-1">
                      General Solid Waste (kg)
                    </label>
                    <input
                      id="wasteKg-input"
                      type="number"
                      step="any"
                      min="0"
                      value={wasteKg}
                      onChange={(e) => setWasteKg(e.target.value)}
                      placeholder="e.g., 5.5"
                      className="w-full bg-slate-900 border border-slate-700/80 rounded-xl px-3.5 py-2 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-600 focus:ring-offset-slate-900 transition duration-200"
                    />
                  </div>
                </div>
              )}

              <div>
                <label htmlFor="date" className="block text-sm font-semibold text-slate-300 mb-1.5">
                  Activity Date
                </label>
                <input
                  id="date"
                  type="date"
                  required
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700/80 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-600 focus:ring-offset-slate-900 transition duration-200"
                />
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full flex items-center justify-center space-x-2 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 disabled:from-slate-700 disabled:to-slate-700 text-white font-semibold py-3 rounded-xl transition duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-600 focus:ring-offset-slate-900 shadow-md shadow-green-950/20"
              >
                <span>{submitting ? 'Calculating emissions...' : 'Save Activity Entry'}</span>
              </button>
            </form>
          </div>
        </section>

        {/* Right Side: Analytics, Charts, Recommendations (7 cols) */}
        <div className="lg:col-span-7 flex flex-col space-y-8">
          
          {/* Real-time Analytics Panel */}
          <section className="bg-[#0f172a]/95 border border-slate-800/80 rounded-2xl p-6 shadow-xl backdrop-blur-xl relative overflow-hidden" aria-labelledby="analytics-title">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-green-500 via-emerald-500 to-teal-500" />
            
            <header className="mb-6 flex justify-between items-center">
              <h2 id="analytics-title" className="text-xl font-bold text-white">Emissions Summary</h2>
              <span className="text-xs bg-green-500/10 text-green-400 border border-green-500/20 px-2.5 py-1 rounded-full font-semibold">
                Updated Real-Time
              </span>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              {/* Total Carbon Card */}
              <div className="md:col-span-3 bg-gradient-to-b from-slate-900 to-slate-900/40 border border-slate-800 rounded-2xl p-6 flex flex-col items-center justify-center text-center">
                <span className="text-sm font-semibold tracking-wider uppercase text-slate-400">Total Carbon Output</span>
                <span className="text-5xl font-extrabold text-white mt-2 mb-1 tracking-tight" data-testid="total-emissions">
                  {total.toLocaleString()}
                </span>
                <span className="text-sm text-green-400 font-medium flex items-center space-x-1">
                  <span>kg CO₂ equivalent</span>
                </span>
              </div>
            </div>

            {/* Progress breakdown */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-wider">Breakdown by Category</h3>
              
              {/* Utility Row */}
              <div>
                <div className="flex justify-between text-sm mb-1.5">
                  <span className="text-slate-300 font-medium flex items-center space-x-2">
                    <Zap className="h-4 w-4 text-amber-400 flex-shrink-0" />
                    <span>Utilities & Energy</span>
                  </span>
                  <span className="text-slate-100 font-semibold" data-testid="utility-emissions">
                    {breakd.utility} kg ({utilityPct}%)
                  </span>
                </div>
                <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                  <div className="bg-amber-400 h-full rounded-full transition-all duration-500" style={{ width: `${utilityPct}%` }} />
                </div>
              </div>

              {/* Transportation Row */}
              <div>
                <div className="flex justify-between text-sm mb-1.5">
                  <span className="text-slate-300 font-medium flex items-center space-x-2">
                    <Car className="h-4 w-4 text-sky-400 flex-shrink-0" />
                    <span>Transportation & Air Travel</span>
                  </span>
                  <span className="text-slate-100 font-semibold" data-testid="transportation-emissions">
                    {breakd.transportation} kg ({transPct}%)
                  </span>
                </div>
                <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                  <div className="bg-sky-400 h-full rounded-full transition-all duration-500" style={{ width: `${transPct}%` }} />
                </div>
              </div>

              {/* Consumption Row */}
              <div>
                <div className="flex justify-between text-sm mb-1.5">
                  <span className="text-slate-300 font-medium flex items-center space-x-2">
                    <ShoppingBag className="h-4 w-4 text-emerald-400 flex-shrink-0" />
                    <span>Consumption & Diet</span>
                  </span>
                  <span className="text-slate-100 font-semibold" data-testid="consumption-emissions">
                    {breakd.consumption} kg ({consPct}%)
                  </span>
                </div>
                <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                  <div className="bg-emerald-400 h-full rounded-full transition-all duration-500" style={{ width: `${consPct}%` }} />
                </div>
              </div>
            </div>

            {renderHighestEmissionsTips()}

            {/* Premium Budget & Gamification Panel */}
            <div className="mt-8 bg-slate-900/60 border border-slate-800/80 rounded-2xl p-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
                <div>
                  <h3 className="text-sm font-semibold tracking-wider uppercase text-slate-400">Carbon Budget & Rewards</h3>
                  <p className="text-xs text-slate-500 mt-0.5">Define your monthly target and unlock climate badges.</p>
                </div>
                
                {/* Budget Editor */}
                <div className="flex items-center space-x-2">
                  <label htmlFor="budget-input" className="text-xs font-semibold text-slate-400">Limit:</label>
                  <input
                    id="budget-input"
                    type="number"
                    min="10"
                    value={carbonBudget}
                    onChange={(e) => setCarbonBudget(Number(e.target.value) || 100)}
                    className="w-20 bg-slate-950 border border-slate-800 rounded-lg px-2 py-1 text-xs text-center font-bold text-white focus:outline-none focus:ring-2 focus:ring-green-600 focus:ring-offset-slate-900"
                  />
                  <span className="text-xs text-slate-400 font-bold">kg</span>
                </div>
              </div>

              {/* Progress and Score */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center mb-6">
                <div>
                  <div className="flex justify-between text-xs font-bold text-slate-400 mb-1.5">
                    <span>Target Limit Usage</span>
                    <span className={total > carbonBudget ? 'text-red-400' : 'text-green-400'}>
                      {((total / carbonBudget) * 100).toFixed(0)}%
                    </span>
                  </div>
                  <div className="w-full bg-slate-950 h-3 border border-slate-800 rounded-full overflow-hidden">
                    <div 
                      className={`h-full rounded-full transition-all duration-500 ${
                        total > carbonBudget ? 'bg-red-500' : 'bg-gradient-to-r from-green-500 to-emerald-500'
                      }`} 
                      style={{ width: `${Math.min(100, (total / carbonBudget) * 100)}%` }} 
                    />
                  </div>
                  <p className="text-[10px] text-slate-500 mt-1.5">
                    {total > carbonBudget 
                      ? '⚠️ Budget exceeded! Consider reviewing reduction tips below.' 
                      : `🌱 You have ${(carbonBudget - total).toFixed(1)} kg remaining allowance.`}
                  </p>
                </div>

                {/* Eco Score Card */}
                <div className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-3.5 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Eco Points Accumulator</span>
                    <span className="text-2xl font-black text-green-400 tracking-tight">
                      {Math.max(0, Math.round((carbonBudget - total) * 10)).toLocaleString()}
                    </span>
                  </div>
                  <div className="p-2.5 bg-green-500/10 border border-green-500/20 text-green-400 rounded-lg">
                    <TrendingDown className="h-5 w-5" />
                  </div>
                </div>
              </div>

              {/* Badges Display */}
              <div>
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-3">Earned Achievements</span>
                {getUnlockedBadges().length === 0 ? (
                  <p className="text-xs text-slate-500 italic py-2">Add activity logs keeping emissions low to unlock conservation achievements.</p>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {getUnlockedBadges().map(badge => (
                      <div key={badge.id} className={`flex items-center space-x-3 p-3 rounded-xl border ${badge.color} transition duration-200`}>
                        <span className="text-2xl" role="img" aria-label={badge.name}>{badge.icon}</span>
                        <div>
                          <h4 className="text-xs font-bold">{badge.name}</h4>
                          <p className="text-[10px] opacity-80 mt-0.5">{badge.desc}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </section>

          {/* Dynamic Climate Insights Section */}
          <section className="bg-[#0f172a]/95 border border-slate-800/80 rounded-2xl p-6 shadow-xl backdrop-blur-xl relative overflow-hidden" aria-labelledby="insights-title">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-500 to-teal-500" />
            <h2 id="insights-title" className="text-xl font-bold text-white mb-4 flex items-center space-x-2">
              <TrendingDown className="h-5 w-5 text-emerald-400" />
              <span>Smart Carbon Reduction Insights</span>
            </h2>
            <div className="space-y-4">
              {getInsights().map((insight) => (
                <article 
                  key={insight.id} 
                  className={`p-4 rounded-xl border ${
                    insight.type === 'high' 
                      ? 'bg-amber-950/20 border-amber-500/20 text-amber-200' 
                      : 'bg-emerald-950/20 border-emerald-500/20 text-emerald-200'
                  } transition duration-200`}
                >
                  <h3 className="text-sm font-bold uppercase tracking-wider mb-1">
                    {insight.category} Trend detected
                  </h3>
                  <p className="text-sm opacity-90 leading-relaxed">
                    {insight.text}
                  </p>
                </article>
              ))}
            </div>
          </section>

        </div>
      </div>

      {/* History Log Section */}
      <section className="bg-[#0f172a]/95 border border-slate-800/80 rounded-2xl p-6 shadow-xl backdrop-blur-xl relative overflow-hidden" aria-labelledby="history-title">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-green-500 to-teal-500" />
        
        <header className="mb-6 flex justify-between items-center">
          <div>
            <h2 id="history-title" className="text-xl font-bold text-white">Activity Log History</h2>
            <p className="text-xs text-slate-400 mt-1">Review and delete recorded emission logs.</p>
          </div>
        </header>

        {loading ? (
          <div className="text-center py-12 text-slate-400">
            <span className="inline-block animate-pulse">Retrieving historical records...</span>
          </div>
        ) : history.length === 0 ? (
          <div className="text-center py-12 text-slate-500 border-2 border-dashed border-slate-800 rounded-xl">
            <HelpCircle className="h-8 w-8 mx-auto mb-2 text-slate-600" />
            <p className="text-sm font-semibold">No carbon footprint entries logged yet.</p>
            <p className="text-xs mt-1 text-slate-600">Select an activity category and submit data above to get started.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-800 text-xs uppercase tracking-wider text-slate-400 font-semibold">
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4">Parameters Submitted</th>
                  <th className="py-3 px-4">Emissions</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-sm text-slate-300">
                {history.map((item) => (
                  <tr key={item._id} className="hover:bg-slate-900/40 transition duration-150">
                    <td className="py-3.5 px-4 font-medium">
                      {new Date(item.date).toLocaleDateString(undefined, { 
                        year: 'numeric', 
                        month: 'short', 
                        day: 'numeric' 
                      })}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className={`inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-xs font-semibold uppercase ${
                        item.activityType === 'utility' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' :
                        item.activityType === 'transportation' ? 'bg-sky-500/10 text-sky-400 border border-sky-500/20' :
                        'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                      }`}>
                        {item.activityType === 'utility' ? <Zap className="h-3 w-3 mr-0.5" /> :
                         item.activityType === 'transportation' ? <Car className="h-3 w-3 mr-0.5" /> :
                         <ShoppingBag className="h-3 w-3 mr-0.5" />}
                        {item.activityType}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-mono text-xs text-slate-400">
                      {Object.entries(item.parameters || {})
                        .map(([k, v]) => `${k}: ${v}`)
                        .join(', ')}
                    </td>
                    <td className="py-3.5 px-4 font-bold text-slate-100">
                      {item.carbonEmissionsKg} kg
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={() => handleDelete(item._id, item.carbonEmissionsKg)}
                        className="p-2 text-slate-500 hover:text-red-400 hover:bg-slate-800 rounded-lg transition duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-600 focus:ring-offset-slate-900"
                        aria-label={`Delete ${item.activityType} log entry from ${new Date(item.date).toLocaleDateString()}`}
                      >
                        <Trash2 className="h-4.5 w-4.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

    </div>
  );
}

export default Dashboard;
