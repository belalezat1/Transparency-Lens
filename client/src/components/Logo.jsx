export default function Logo() {
  return (
    <div className="flex h-10 w-10 items-center justify-center rounded-lg" style={{ background: '#10252C', border: '1px solid #3D4D55' }}>
      <svg width="26" height="26" viewBox="0 0 26 26" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path
          d="M2 13 C5 7 21 7 24 13 C21 19 5 19 2 13 Z"
          stroke="#B58863"
          strokeWidth="1.6"
          strokeLinejoin="round"
          fill="#B58863"
          fillOpacity="0.08"
        />
        <circle cx="13" cy="13" r="4.5" stroke="#B58863" strokeWidth="1.5" fill="#B58863" fillOpacity="0.12"/>
        <circle cx="13" cy="13" r="2" fill="#B58863"/>
        <circle cx="14.2" cy="11.8" r="0.8" fill="white" fillOpacity="0.4"/>
        <line x1="8.5" y1="13" x2="17.5" y2="13" stroke="#B58863" strokeWidth="0.7" strokeOpacity="0.25"/>
      </svg>
    </div>
  )
}
