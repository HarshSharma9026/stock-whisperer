// ─── ImpactModel ──────────────────────────────────────────

export function ImpactModel() {
  const metrics = [
    { label: "ET Markets Active Users", value: "3 Crore+", sub: "Total addressable base", icon: "👥" },
    { label: "Weekly Active Users", value: "15 Lakh", sub: "5% adoption estimate", icon: "📱" },
    { label: "Time Saved / User / Week", value: "22 Min", sub: "From 30 min → 8 min", icon: "⏱️" },
    { label: "Hours Saved Per Month", value: "22L hrs", sub: "Across all active users", icon: "🕐" },
    { label: "Time Value Created", value: "₹44 Cr/mo", sub: "At ₹200/hr avg value", icon: "💰" },
    { label: "New Prime Subscribers", value: "30,000/yr", sub: "2% conversion × ₹2,400", icon: "⭐" },
    { label: "Incremental Revenue", value: "₹7.2 Cr/yr", sub: "Subscription uplift", icon: "📈" },
    { label: "Tier-2/3 Unlock", value: "5–8 Crore", sub: "Via Hindi / Hinglish", icon: "🇮🇳" },
  ];

  return (
    <div className="space-y-5 max-w-5xl mx-auto">
      <div>
        <h2 className="text-xl font-semibold text-white mb-1">Business Impact Model</h2>
        <p className="text-gray-500 text-sm">Back-of-envelope estimates for ET Markets integration. All assumptions stated.</p>
      </div>

      {/* Metrics grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {metrics.map(({ label, value, sub, icon }) => (
          <div key={label} className="bg-[#0d1220] border border-white/5 rounded-2xl p-4 hover:border-blue-500/20 transition-colors">
            <div className="text-2xl mb-2">{icon}</div>
            <p className="text-blue-400 font-bold text-lg leading-tight font-mono">{value}</p>
            <p className="text-white text-xs font-medium mt-1">{label}</p>
            <p className="text-gray-600 text-[10px] mt-0.5">{sub}</p>
          </div>
        ))}
      </div>

      {/* Revenue scenarios */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {[
          { label: "Conservative Revenue Unlock", value: "₹8–15 Cr/yr", color: "text-amber-400", bg: "bg-amber-500/5 border-amber-500/15" },
          { label: "Optimistic Revenue Unlock", value: "₹25–40 Cr/yr", color: "text-emerald-400", bg: "bg-emerald-500/5 border-emerald-500/15" },
          { label: "Unique Competitive Moat", value: "NSE Backtest DB + Hindi AI", color: "text-blue-400", bg: "bg-blue-500/5 border-blue-500/15" },
        ].map(({ label, value, color, bg }) => (
          <div key={label} className={`${bg} border rounded-2xl p-4 text-center`}>
            <p className={`${color} font-bold text-xl font-mono`}>{value}</p>
            <p className="text-gray-500 text-xs mt-1">{label}</p>
          </div>
        ))}
      </div>

      {/* Assumptions */}
      <div className="bg-[#0d1220] border border-white/5 rounded-2xl p-5">
        <p className="text-xs text-gray-500 uppercase tracking-wider mb-3">Key Assumptions</p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          {[
            "5% weekly adoption of ET Markets' 3Cr user base",
            "Users currently spend 30 min/week on manual chart research",
            "Stock Whisperer reduces this to 8 min (AI delivers in <8 sec)",
            "Average Indian professional time value: ₹200/hr",
            "2% of engaged users convert to ET Prime at ₹2,400/yr",
            "Hindi/Hinglish unlocks 5–8 Cr Tier-2/3 users locked out by English",
          ].map((a, i) => (
            <div key={i} className="flex items-start gap-2 text-xs text-gray-500">
              <span className="text-blue-500 mt-0.5">→</span>
              <span>{a}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}