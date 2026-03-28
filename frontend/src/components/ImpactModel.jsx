export function ImpactModel() {
  const metrics = [
    { label: "ET Markets Active Users", value: "3 Crore+", sub: "Total addressable base" },
    { label: "Weekly Active Users (5%)", value: "15 Lakh", sub: "Conservative adoption estimate" },
    { label: "Time Saved Per User/Week", value: "22 Minutes", sub: "From 30 min → 8 min research" },
    { label: "Hours Saved Per Month", value: "22 Lakh hrs", sub: "Across all active users" },
    { label: "Time Value Created", value: "₹44 Crore/mo", sub: "At ₹200/hr avg time value" },
    { label: "New Prime Subscribers", value: "30,000/yr", sub: "2% conversion at ₹2,400/yr" },
    { label: "Incremental Revenue", value: "₹7.2 Crore/yr", sub: "Subscription uplift alone" },
    { label: "Tier-2/3 Unlock", value: "5-8 Crore", sub: "New users via Hindi/Hinglish" },
  ]

  return (
    <div className="bg-gray-900 rounded-2xl border border-gray-800 p-6">
      <div className="mb-6">
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          📊 Business Impact Model
        </h2>
        <p className="text-gray-400 text-sm mt-1">
          Back-of-envelope estimates for ET Markets integration
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        {metrics.map(({ label, value, sub }) => (
          <div key={label} className="bg-gray-800 rounded-xl p-4">
            <p className="text-blue-400 font-bold text-lg">{value}</p>
            <p className="text-white text-xs font-medium mt-1">{label}</p>
            <p className="text-gray-500 text-xs mt-0.5">{sub}</p>
          </div>
        ))}
      </div>

      <div className="bg-blue-950 border border-blue-800 rounded-xl p-4">
        <p className="text-blue-200 text-sm font-medium mb-2">Key Assumptions</p>
        <ul className="text-blue-300 text-xs space-y-1">
          <li>• 5% weekly adoption of ET Markets 3Cr user base</li>
          <li>• Users currently spend 30 min/week on manual chart research</li>
          <li>• Stock Whisperer reduces this to 8 min (AI delivers in &lt;8 sec)</li>
          <li>• Average Indian professional time value: ₹200/hr</li>
          <li>• 2% of engaged users convert to ET Prime at ₹2,400/yr</li>
          <li>• Hindi/Hinglish unlocks 5-8Cr new Tier-2/3 users currently locked out by English</li>
        </ul>
      </div>

      <div className="mt-4 grid grid-cols-3 gap-3 text-center">
        {[
          { label: "Conservative Revenue Unlock", value: "₹8-15 Cr/yr" },
          { label: "Optimistic Revenue Unlock", value: "₹25-40 Cr/yr" },
          { label: "Unique Moat", value: "NSE Backtest DB + Hindi AI" },
        ].map(({ label, value }) => (
          <div key={label} className="bg-gray-800 rounded-xl p-3">
            <p className="text-green-400 font-bold text-sm">{value}</p>
            <p className="text-gray-400 text-xs mt-1">{label}</p>
          </div>
        ))}
      </div>
    </div>
  )
}