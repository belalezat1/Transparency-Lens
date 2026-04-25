const STEPS = [
  {
    icon: '🔌',
    title: 'Transparent Proxy (Raspberry Pi)',
    description:
      'A Pi running mitmproxy sits between your device and the router, silently intercepting DNS and HTTP/S traffic — no app installation required.',
  },
  {
    icon: '🤖',
    title: 'Local Gemma 4 AI Analysis',
    description:
      'Each intercepted hostname is classified by Gemma 4 running locally via Ollama. No data leaves your network. The AI generates plain-English privacy explanations in real time.',
  },
  {
    icon: '📡',
    title: 'Live Dashboard (Socket.io + MongoDB + Snowflake)',
    description:
      'Tracker events stream to this dashboard via Socket.io, are stored in MongoDB Atlas for the current session, and written to Snowflake for cross-session intelligence.',
  },
]

export default function HowItWorks() {
  return (
    <section className="border-t border-slate-200 bg-white px-6 py-6 shrink-0">
      <p className="text-center text-xs font-semibold text-slate-500 uppercase tracking-widest mb-5">
        How It Works
      </p>
      <div className="max-w-4xl mx-auto grid grid-cols-3 gap-6">
        {STEPS.map((step, i) => (
          <div key={i} className="text-center">
            <div className="text-2xl mb-2">{step.icon}</div>
            <div className="flex items-center justify-center gap-2 mb-1.5">
              <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-700 text-[10px] font-bold flex items-center justify-center shrink-0">
                {i + 1}
              </span>
              <p className="font-semibold text-slate-800 text-xs text-left">{step.title}</p>
            </div>
            <p className="text-[11px] text-slate-400 leading-relaxed">{step.description}</p>
          </div>
        ))}
      </div>
    </section>
  )
}
