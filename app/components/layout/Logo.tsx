export function Logo() {
  // Original CellarTracker cellar shape path — a horizontal bottle with a
  // rectangular neck tab on the right and an organic curved tail at the bottom.
  // Source: cellartracker.com SVG (path 1), used here as a style reference.
  const cellarPath =
    "M73.7621 8.61539H62.6316C61.1642 4.41539 57.4779 1.4359 53.1832 1.4359H15.0316H12.1684H7.1579C4.00842 1.4359 1.43158 4.02051 1.43158 7.17949V12.2051V13.2821V18.3077C1.43158 21.4667 4.00842 24.0513 7.1579 24.0513H12.1684H15.0316H26.7347C30.1347 26.8154 34.7158 29.6513 40.2274 31.4821C41.8379 31.9846 42.9474 30.4769 41.9811 29.6154C39.6547 27.4974 38.2947 25.7026 37.4716 24.0513H53.1832C57.4779 24.0513 61.1642 21.0718 62.6316 16.8718H73.7621C75.5158 16.8718 76.9474 15.4359 76.9474 13.6769V11.7744C76.9474 10.0513 75.5158 8.61539 73.7621 8.61539Z";

  // Mini wine rack grid: 3 cols × 3 rows of bottle slot circles
  // Placed to the right of the bottle shape (bottle ends ~x=77)
  const slots = [
    { cx: 97,  cy: 40, fill: "#F4D03F", stroke: "#9E9A94" },
    { cx: 114, cy: 40, fill: "#C0392B", stroke: "#922B21" },
    { cx: 131, cy: 40, fill: "#DDDAD4", stroke: "#9E9A94" },
  ];

  return (
    <svg
      viewBox="0 0 148 50"
      width="148"
      height="50"
      aria-label="Cellar Organizer"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Cellar bottle shape */}
      <path d={cellarPath} fill="#94252B" />

      <text
        x="30"
        y="12.5"
        fontFamily="Inter,sans-serif"
        fontSize="16"
        fontWeight="600"
        fill="white"
        textAnchor="middle"
        dominantBaseline="central"
        textLength="38"
        lengthAdjust="spacingAndGlyphs"
      >
        cellar
      </text>

 

      {/* "organizer" text — to the left of the grid, no bubble */}
      <text
        x="15"
        y="40"
        fontFamily="Inter,sans-serif"
        fontSize="12"
        fontWeight="600"
        fill="#522524"
        textAnchor="start"
        dominantBaseline="central"
      >
        ORGANIZER
      </text>
      

      {/* Mini wine rack grid — 3×3 circles representing bottle slots */}
      {slots.map(({ cx, cy, fill, stroke }) => (
        <circle
          key={`${cx}-${cy}`}
          cx={cx}
          cy={cy}
          r="6"
          fill={fill}
          stroke={stroke}
          strokeWidth="1.5"
        />
      ))}
    </svg>
  );
}
