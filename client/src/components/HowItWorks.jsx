const STEPS = [
  {
    num: '01',
    title: 'Network Interception',
    sub: 'Raspberry Pi + mitmproxy',
    desc: 'A Pi running mitmproxy sits between your device and router, intercepting all DNS and HTTP/S traffic without any app installation.',
  },
  {
    num: '02',
    title: 'AI Classification',
    sub: 'Gemma 4 via Gemini API',
    desc: 'Each hostname is classified by Gemma 4, which generates a plain-English privacy impact summary and assigns a tracker category.',
  },
  {
    num: '03',
    title: 'Live Dashboard',
    sub: 'Socket.io + MongoDB + Snowflake',
    desc: 'Events stream to this dashboard in real time, stored in MongoDB for session history and Snowflake for cross-session intelligence.',
  },
]

export default function HowItWorks() {
  return (
    <section className="shrink-0 px-6 py-5" style={{ background: '#10252C', borderTop: '1px solid #3D4D55' }}>
      <div className="mx-auto grid max-w-5xl grid-cols-3 gap-8">
        {STEPS.map(step => (
          <div key={step.num} className="flex gap-4">
            <span className="mt-0.5 shrink-0 text-sm font-bold tabular-nums" style={{ color: '#3D4D55' }}>
              {step.num}
            </span>
            <div>
              <p className="text-xs font-semibold" style={{ color: '#D3C3B9' }}>{step.title}</p>
              <p className="mb-1 text-[10px] font-medium" style={{ color: '#B58863' }}>{step.sub}</p>
              <p className="text-[11px] leading-relaxed" style={{ color: '#A79E9C' }}>{step.desc}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}
