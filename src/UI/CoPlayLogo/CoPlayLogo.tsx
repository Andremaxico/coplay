export function CoPlayLogo() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 200" width="100%" height="100%" fill="none">
      {/* Логотип: Іконка "C-Marker" */}
      <g transform="translate(20, 10)">
        {/* Зовнішнє бірюзове півколо-стрілка */}
        <path d="M 110,35 A 65,65 0 1,0 120,135" stroke="#00E5FF" strokeWidth="16" strokeLinecap="round" />
        <path d="M 60,150 C 95,150 140,120 150,105" stroke="#00E5FF" strokeWidth="10" strokeLinecap="round" />
        
        {/* Центральний маркер-геолокація у формі літери C */}
        <path d="M 100,55 A 25,25 0 0,0 75,80 L 75,95 L 100,125 L 125,95 L 125,80 A 25,25 0 0,0 100,55 Z" fill="#FFFFFF" />
        <circle cx="100" cy="80" r="10" fill="var(--background)" /> {/* Внутрішній виріз шпильки */}

        {/* Салатова крапка вгорі */}
        <circle cx="135" cy="40" r="10" fill="#99FF00" />

        {/* Волейбольний м'яч внизу справа */}
        <circle cx="145" cy="115" r="18" fill="none" stroke="#00E5FF" strokeWidth="4" />
        <path d="M 132,105 Q 145,115 158,125" stroke="#00E5FF" strokeWidth="3" />
        <path d="M 135,127 Q 145,115 155,103" stroke="#00E5FF" strokeWidth="3" />
      </g>

      {/* Текст COPLAY */}
      <text x="210" y="125" fill="#FFFFFF" fontFamily="Inter, Montserrat, sans-serif" fontSize="64" fontWeight="800" letterSpacing="2">
        COPLAY
      </text>
    </svg>
  );
}
