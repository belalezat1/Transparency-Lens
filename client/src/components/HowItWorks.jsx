const STEPS = [
  {
    title: 'Transparent Proxy',
    subtitle: 'Raspberry Pi + mitmproxy',
    description:
      'A Pi running mitmproxy sits between your device and the router, silently intercepting DNS and HTTP/S traffic — no app installation required.',
  },
  {
    title: 'AI Classification',
    subtitle: 'Gemma 4 via Gemini API',
    description:
      'Each intercepted hostname is classified by Gemma 4. The model generates plain-English privacy explanations and assigns tracker categories in real time.',
  },
  {
    title: 'Live Intelligence',
    subtitle: 'Socket.io + MongoDB + Snowflake',
    description:
      'Tracker events stream to this dashboard via Socket.io, are stored in MongoDB Atlas for session history, and written to Snowflake for cross-session analytics.',
  },
]

export default function HowItWorks() {
  return (
    <section className="border-t border-slate-800 bg-slate-900 px-6 py-6 shrink-0">
      <p className="text-center text-[10px] font-semibold text-slate-500 uppercase tracking-widest mb-5">
        How It Works
      </p>
      <div className="max-w-4xl mx-auto grid grid-cols-3 gap-8">
        {STEPS.map((step, i) => (
          <div key={i} className="flex gap-3">
            <div className="w-6 h-6 rounded-full bg-cyan-950 border border-cyan-800 text-cyan-400 text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5">
              {i + 1}
            </div>
            <div>
              <p className="font-semibold text-slate-200 text-xs leading-tight">{step.title}</p>
              <p className="text-[10px] text-cyan-600 font-medium mb-1">{step.subtitle}</p>
              <p className="text-[11px] text-slate-500 leading-relaxed">{step.description}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}
