/** Decorative Jaipur-inspired facade, not a sensor map or measured chart. */
export function CityLandmark() {
  return (
    <svg
      className="city-landmark"
      viewBox="0 0 600 400"
      fill="none"
      aria-hidden="true"
    >
      <defs>
        <linearGradient
          id="palace-fill"
          x1="300"
          y1="80"
          x2="300"
          y2="370"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="#ecd3b9" />
          <stop offset="1" stopColor="#f6ece0" />
        </linearGradient>
      </defs>
      <ellipse cx="300" cy="360" rx="234" ry="24" fill="#142b4010" />
      <path
        d="M40 347h520M80 330V219h54v-49h53v-43h57V91h112v36h57v43h53v49h54v111Z"
        fill="url(#palace-fill)"
        stroke="#b98765"
        strokeWidth="1.5"
      />
      <path
        d="M80 246h440M80 288h440M134 204h332M187 161h226M244 121h112"
        stroke="#bd906e"
      />
      {[105, 160, 215, 270, 325, 380, 435, 490].map((x) => (
        <g key={x} stroke="#ac7b59" strokeWidth="1.4">
          <path d={`M${x - 9} 327v-20q9-18 18 0v20z`} fill="#c49b791c" />
          <path d={`M${x - 9} 280v-17q9-16 18 0v17z`} />
          <path d={`M${x - 9} 239v-12q9-16 18 0v12z`} />
        </g>
      ))}
      {[160, 215, 270, 325, 380, 435].map((x) => (
        <path
          key={x}
          d={`M${x - 9} 197v-13q9-16 18 0v13z`}
          stroke="#ac7b59"
          strokeWidth="1.4"
        />
      ))}
      {[215, 270, 325, 380].map((x) => (
        <path
          key={x}
          d={`M${x - 9} 154v-12q9-16 18 0v12z`}
          stroke="#ac7b59"
          strokeWidth="1.4"
        />
      ))}
      {[270, 325].map((x) => (
        <path
          key={x}
          d={`M${x - 8} 115v-10q8-14 16 0v10z`}
          stroke="#ac7b59"
          strokeWidth="1.4"
        />
      ))}
      <path
        d="M235 91h130M254 91q0-29 20-29q20 0 20 29M306 91q0-29 20-29q20 0 20 29M274 62v-14M326 62v-14M130 170q0-19 13-19q13 0 13 19M444 170q0-19 13-19q13 0 13 19"
        stroke="#ac7b59"
        strokeWidth="1.5"
      />
      <path d="M285 330v-26q15-26 30 0v26" fill="#b9876540" stroke="#ac7b59" />
      <path
        d="M54 345v-45m-12 12q-15-24 12-28q27 4 12 28M546 345v-45m-12 12q-15-24 12-28q27 4 12 28"
        stroke="#839a84"
        strokeWidth="2"
      />
    </svg>
  );
}
