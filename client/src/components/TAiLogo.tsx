export const TAiLogo = ({ className = "h-16 w-auto" }: { className?: string }) => (
  <svg viewBox="0 0 200 100" className={className} fill="currentColor" xmlns="http://www.w3.org/2000/svg">
    <style>
      {`
        .serif { font-family: 'Didot', 'Bodoni MT', 'Playfair Display', serif; font-weight: bold; }
      `}
    </style>
    {/* T */}
    <text x="10" y="80" fontSize="90" className="serif" fill="currentColor">T</text>
    {/* A - Shifted left to overlap */}
    <text x="55" y="80" fontSize="90" className="serif" fill="currentColor">A</text>
    {/* i - Small, serif */}
    <text x="115" y="80" fontSize="90" className="serif" fill="currentColor">i</text>
    {/* Optional: The connecting line from the image if needed, but font overlap often suffices */}
  </svg>
);