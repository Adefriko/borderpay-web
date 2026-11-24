"use client";

/**
 * Shared 3D fluid ocean glass backdrop matching Figma hero and light atmospheres.
 * Variant "ocean" renders high-contrast 3D cobalt curves behind translucent frosted glass;
 * variant "light" renders subtle ambient sky halos for dense data tables and checkout.
 */
export default function OceanBackdrop({ variant = "ocean" }) {
  return (
    <div className="fixed inset-0 pointer-events-none -z-10 bg-[#eef4f8] overflow-hidden">
      {variant === "ocean" ? (
        <>
          <div
            className="absolute top-0 inset-x-0 h-[470px] w-full"
            style={{
              background:
                "linear-gradient(180deg, #0b4c69 0%, #157393 22%, #2b97b7 48%, #5cbcd3 72%, #b5e4ef 89%, #eef4f8 100%)",
            }}
          />

          <svg
            className="absolute -top-12 left-1/2 -translate-x-1/2 w-[1600px] h-[520px] pointer-events-none"
            viewBox="0 0 1600 520"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            preserveAspectRatio="xMidYMid slice"
          >
            <path
              d="M-60 220 C 180 20, 460 360, 780 180 C 1060 20, 1280 290, 1660 110 L 1660 390 C 1280 490, 1020 270, 760 380 C 440 510, 180 220, -60 390 Z"
              fill="url(#figma-ribbon-cobalt)"
              opacity="0.92"
            />
            <path
              d="M80 90 C 320 260, 560 40, 860 230 C 1100 380, 1340 120, 1580 240"
              stroke="url(#figma-glass-fold)"
              strokeWidth="84"
              strokeLinecap="round"
              opacity="0.55"
            />
            <circle cx="240" cy="185" r="145" fill="url(#figma-orb-left)" opacity="0.82" />
            <circle cx="1320" cy="175" r="155" fill="url(#figma-orb-right)" opacity="0.78" />
            <path
              d="M120 112 C 360 18, 620 210, 920 98 C 1180 4, 1390 140, 1560 72"
              stroke="url(#figma-gold-rim)"
              strokeWidth="5"
              strokeLinecap="round"
              opacity="0.78"
            />
            <path
              d="M-40 245 C 220 110, 510 340, 810 195"
              stroke="rgba(255,255,255,0.45)"
              strokeWidth="2.5"
              strokeLinecap="round"
            />
            <defs>
              <linearGradient id="figma-ribbon-cobalt" x1="0" y1="60" x2="1550" y2="380" gradientUnits="userSpaceOnUse">
                <stop stopColor="#054e78" />
                <stop offset="0.32" stopColor="#0677a6" />
                <stop offset="0.62" stopColor="#1fa6cb" />
                <stop offset="1" stopColor="#085380" />
              </linearGradient>
              <linearGradient id="figma-glass-fold" x1="80" y1="90" x2="1580" y2="240" gradientUnits="userSpaceOnUse">
                <stop stopColor="#5eead4" stopOpacity="0.35" />
                <stop offset="0.45" stopColor="#38bdf8" stopOpacity="0.85" />
                <stop offset="1" stopColor="#1951FC" stopOpacity="0.45" />
              </linearGradient>
              <radialGradient id="figma-orb-left" cx="0" cy="0" r="1" gradientUnits="userSpaceOnUse" gradientTransform="translate(210 140) rotate(45) scale(210)">
                <stop stopColor="#67e8f9" />
                <stop offset="0.5" stopColor="#0284c7" />
                <stop offset="1" stopColor="#082f49" stopOpacity="0.2" />
              </radialGradient>
              <radialGradient id="figma-orb-right" cx="0" cy="0" r="1" gradientUnits="userSpaceOnUse" gradientTransform="translate(1280 130) rotate(50) scale(220)">
                <stop stopColor="#a5f3fc" />
                <stop offset="0.48" stopColor="#0ea5e9" />
                <stop offset="1" stopColor="#0c4a6e" stopOpacity="0.15" />
              </radialGradient>
              <linearGradient id="figma-gold-rim" x1="120" y1="70" x2="1500" y2="110" gradientUnits="userSpaceOnUse">
                <stop stopColor="#fde047" stopOpacity="0.1" />
                <stop offset="0.25" stopColor="#facc15" stopOpacity="0.9" />
                <stop offset="0.55" stopColor="#f59e0b" stopOpacity="0.65" />
                <stop offset="0.85" stopColor="#bae6fd" stopOpacity="0.8" />
                <stop offset="1" stopColor="#38bdf8" stopOpacity="0.1" />
              </linearGradient>
            </defs>
          </svg>
        </>
      ) : (
        <>
          <div
            className="absolute top-0 inset-x-0 h-[360px] w-full"
            style={{
              background:
                "radial-gradient(90% 100% at 25% 0%, rgba(165, 226, 242, 0.55) 0%, rgba(215, 240, 248, 0.45) 45%, rgba(238, 244, 248, 0) 100%)",
            }}
          />
          <div className="absolute -top-20 right-0 w-[620px] h-[340px] rounded-full bg-sky-200/45 blur-3xl" />
        </>
      )}
    </div>
  );
}
