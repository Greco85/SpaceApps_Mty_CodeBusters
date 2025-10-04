export interface Exoplanet {
  id: string;
  name: string;
  discoveryYear: number;
  method: string;
  mass: number; // Earth masses
  radius: number; // Earth radii
  orbitalPeriod: number; // days
  distance: number; // light years
  temperature: number; // Kelvin
  habitable: boolean;
  coordinates: {
    rightAscension: number; // degrees
    declination: number; // degrees
  };
  starType: string;
  description: string;
}

export const sampleExoplanets: Exoplanet[] = [
  {
    id: "kepler-452b",
    name: "Kepler-452b",
    discoveryYear: 2015,
    method: "Transit",
    mass: 5.0,
    radius: 1.6,
    orbitalPeriod: 384.8,
    distance: 1400,
    temperature: 265,
    habitable: true,
    coordinates: {
      rightAscension: 283.34,
      declination: 44.87
    },
    starType: "G2V",
    description: "Known as 'Earth's cousin', this exoplanet orbits a Sun-like star and is located in the habitable zone."
  },
  {
    id: "proxima-b",
    name: "Proxima Centauri b",
    discoveryYear: 2016,
    method: "Radial Velocity",
    mass: 1.3,
    radius: 1.1,
    orbitalPeriod: 11.2,
    distance: 4.24,
    temperature: 234,
    habitable: true,
    coordinates: {
      rightAscension: 217.43,
      declination: -62.68
    },
    starType: "M5.5V",
    description: "The closest known exoplanet to Earth, orbiting the nearest star to our solar system."
  },
  {
    id: "trappist-1e",
    name: "TRAPPIST-1e",
    discoveryYear: 2017,
    method: "Transit",
    mass: 0.69,
    radius: 0.92,
    orbitalPeriod: 6.1,
    distance: 39.6,
    temperature: 251,
    habitable: true,
    coordinates: {
      rightAscension: 346.62,
      declination: -5.04
    },
    starType: "M8V",
    description: "Part of the TRAPPIST-1 system, this exoplanet is considered one of the most promising for habitability."
  },
  {
    id: "kepler-186f",
    name: "Kepler-186f",
    discoveryYear: 2014,
    method: "Transit",
    mass: 1.4,
    radius: 1.1,
    orbitalPeriod: 129.9,
    distance: 492,
    temperature: 188,
    habitable: true,
    coordinates: {
      rightAscension: 295.95,
      declination: 43.94
    },
    starType: "M1V",
    description: "The first Earth-size planet discovered in the habitable zone of another star."
  },
  {
    id: "hd-40307g",
    name: "HD 40307g",
    discoveryYear: 2012,
    method: "Radial Velocity",
    mass: 7.1,
    radius: 2.4,
    orbitalPeriod: 197.8,
    distance: 42.4,
    temperature: 279,
    habitable: true,
    coordinates: {
      rightAscension: 88.78,
      declination: -60.19
    },
    starType: "K2.5V",
    description: "A super-Earth located in the habitable zone of its star, with potential for liquid water."
  },
  {
    id: "kepler-22b",
    name: "Kepler-22b",
    discoveryYear: 2011,
    method: "Transit",
    mass: 36.0,
    radius: 2.4,
    orbitalPeriod: 289.9,
    distance: 620,
    temperature: 262,
    habitable: true,
    coordinates: {
      rightAscension: 290.67,
      declination: 47.89
    },
    starType: "G5V",
    description: "The first confirmed exoplanet found in the habitable zone of a Sun-like star."
  },
  {
    id: "gliese-581g",
    name: "Gliese 581g",
    discoveryYear: 2010,
    method: "Radial Velocity",
    mass: 3.1,
    radius: 1.5,
    orbitalPeriod: 36.6,
    distance: 20.2,
    temperature: 209,
    habitable: true,
    coordinates: {
      rightAscension: 229.86,
      declination: -7.72
    },
    starType: "M3V",
    description: "A potentially habitable exoplanet orbiting within the Gliese 581 planetary system."
  },
  {
    id: "wasp-17b",
    name: "WASP-17b",
    discoveryYear: 2009,
    method: "Transit",
    mass: 0.49,
    radius: 1.99,
    orbitalPeriod: 3.7,
    distance: 1330,
    temperature: 1740,
    habitable: false,
    coordinates: {
      rightAscension: 239.17,
      declination: -28.08
    },
    starType: "F6V",
    description: "A hot Jupiter with an unusual retrograde orbit, one of the largest exoplanets discovered."
  },
  {
    id: "hd-209458b",
    name: "HD 209458 b (Osiris)",
    discoveryYear: 1999,
    method: "Transit",
    mass: 220.0,
    radius: 14.8,
    orbitalPeriod: 3.5,
    distance: 154,
    temperature: 1130,
    habitable: false,
    coordinates: {
      rightAscension: 331.42,
      declination: 18.88
    },
    starType: "G0V",
    description: "The first exoplanet detected by the transit method and the first to have its atmosphere studied."
  },
  {
    id: "kepler-438b",
    name: "Kepler-438b",
    discoveryYear: 2015,
    method: "Transit",
    mass: 1.0,
    radius: 1.12,
    orbitalPeriod: 35.2,
    distance: 473,
    temperature: 276,
    habitable: true,
    coordinates: {
      rightAscension: 284.84,
      declination: 42.72
    },
    starType: "M1V",
    description: "A near-Earth-sized exoplanet with high potential for habitability."
  },
  {
    id: "trappist-1f",
    name: "TRAPPIST-1f",
    discoveryYear: 2017,
    method: "Transit",
    mass: 0.68,
    radius: 1.04,
    orbitalPeriod: 9.2,
    distance: 39.6,
    temperature: 219,
    habitable: true,
    coordinates: {
      rightAscension: 346.62,
      declination: -5.04
    },
    starType: "M8V",
    description: "Another potentially habitable world in the TRAPPIST-1 system."
  },
  {
    id: "trappist-1g",
    name: "TRAPPIST-1g",
    discoveryYear: 2017,
    method: "Transit",
    mass: 1.34,
    radius: 1.13,
    orbitalPeriod: 12.4,
    distance: 39.6,
    temperature: 199,
    habitable: true,
    coordinates: {
      rightAscension: 346.62,
      declination: -5.04
    },
    starType: "M8V",
    description: "A larger potentially habitable planet in the TRAPPIST-1 system."
  },
  {
    id: "lhs-1140b",
    name: "LHS 1140 b",
    discoveryYear: 2017,
    method: "Transit",
    mass: 6.6,
    radius: 1.4,
    orbitalPeriod: 24.7,
    distance: 41,
    temperature: 206,
    habitable: true,
    coordinates: {
      rightAscension: 0.23,
      declination: -15.26
    },
    starType: "M4.5V",
    description: "A super-Earth in the habitable zone of a nearby red dwarf star."
  },
  {
    id: "ross-128b",
    name: "Ross 128 b",
    discoveryYear: 2017,
    method: "Radial Velocity",
    mass: 1.35,
    radius: 1.1,
    orbitalPeriod: 9.9,
    distance: 11.0,
    temperature: 213,
    habitable: true,
    coordinates: {
      rightAscension: 176.92,
      declination: 0.80
    },
    starType: "M4V",
    description: "A potentially habitable exoplanet orbiting a quiet red dwarf star."
  },
  {
    id: "kepler-62e",
    name: "Kepler-62e",
    discoveryYear: 2013,
    method: "Transit",
    mass: 4.5,
    radius: 1.6,
    orbitalPeriod: 122.4,
    distance: 1200,
    temperature: 270,
    habitable: true,
    coordinates: {
      rightAscension: 283.34,
      declination: 44.87
    },
    starType: "K2V",
    description: "A super-Earth in the habitable zone of a Sun-like star."
  },
  {
    id: "kepler-62f",
    name: "Kepler-62f",
    discoveryYear: 2013,
    method: "Transit",
    mass: 2.8,
    radius: 1.4,
    orbitalPeriod: 267.3,
    distance: 1200,
    temperature: 208,
    habitable: true,
    coordinates: {
      rightAscension: 283.34,
      declination: 44.87
    },
    starType: "K2V",
    description: "The outermost potentially habitable planet in the Kepler-62 system."
  },
  {
    id: "hd-85512b",
    name: "HD 85512 b",
    discoveryYear: 2011,
    method: "Radial Velocity",
    mass: 3.6,
    radius: 1.4,
    orbitalPeriod: 58.4,
    distance: 36.4,
    temperature: 298,
    habitable: true,
    coordinates: {
      rightAscension: 148.15,
      declination: -43.50
    },
    starType: "K5V",
    description: "A super-Earth located in the habitable zone of its star."
  },
  {
    id: "kepler-442b",
    name: "Kepler-442b",
    discoveryYear: 2015,
    method: "Transit",
    mass: 2.3,
    radius: 1.3,
    orbitalPeriod: 112.3,
    distance: 1115,
    temperature: 233,
    habitable: true,
    coordinates: {
      rightAscension: 285.95,
      declination: 39.16
    },
    starType: "K5V",
    description: "A potentially habitable exoplanet with high Earth Similarity Index."
  },
  {
    id: "kepler-1638b",
    name: "Kepler-1638b",
    discoveryYear: 2016,
    method: "Transit",
    mass: 2.7,
    radius: 1.4,
    orbitalPeriod: 259.3,
    distance: 2495,
    temperature: 206,
    habitable: true,
    coordinates: {
      rightAscension: 290.67,
      declination: 47.89
    },
    starType: "G5V",
    description: "A potentially habitable super-Earth in a distant planetary system."
  },
  {
    id: "kepler-1649c",
    name: "Kepler-1649c",
    discoveryYear: 2020,
    method: "Transit",
    mass: 1.2,
    radius: 1.06,
    orbitalPeriod: 19.5,
    distance: 300,
    temperature: 234,
    habitable: true,
    coordinates: {
      rightAscension: 290.67,
      declination: 47.89
    },
    starType: "M5V",
    description: "A potentially habitable Earth-sized exoplanet discovered by Kepler."
  },
  {
    id: "gj-357d",
    name: "GJ 357 d",
    discoveryYear: 2019,
    method: "Transit",
    mass: 6.1,
    radius: 1.7,
    orbitalPeriod: 55.7,
    distance: 31,
    temperature: 219,
    habitable: true,
    coordinates: {
      rightAscension: 95.97,
      declination: -21.93
    },
    starType: "M2.5V",
    description: "A super-Earth in the habitable zone of a nearby red dwarf."
  },
  {
    id: "toi-700d",
    name: "TOI-700 d",
    discoveryYear: 2020,
    method: "Transit",
    mass: 1.7,
    radius: 1.2,
    orbitalPeriod: 37.4,
    distance: 101.4,
    temperature: 268,
    habitable: true,
    coordinates: {
      rightAscension: 97.09,
      declination: -65.06
    },
    starType: "M2.5V",
    description: "The first Earth-size planet in the habitable zone discovered by TESS."
  },
  {
    id: "k2-18b",
    name: "K2-18b",
    discoveryYear: 2015,
    method: "Transit",
    mass: 8.6,
    radius: 2.7,
    orbitalPeriod: 32.9,
    distance: 111,
    temperature: 265,
    habitable: true,
    coordinates: {
      rightAscension: 165.65,
      declination: 7.59
    },
    starType: "M2.5V",
    description: "A potentially habitable super-Earth with water vapor in its atmosphere."
  },
  {
    id: "kepler-452c",
    name: "Kepler-452c",
    discoveryYear: 2015,
    method: "Transit",
    mass: 15.0,
    radius: 2.9,
    orbitalPeriod: 832.3,
    distance: 1400,
    temperature: 198,
    habitable: true,
    coordinates: {
      rightAscension: 283.34,
      declination: 44.87
    },
    starType: "G2V",
    description: "A potentially habitable super-Earth in the same system as Kepler-452b."
  },
  {
    id: "proxima-c",
    name: "Proxima Centauri c",
    discoveryYear: 2019,
    method: "Radial Velocity",
    mass: 7.0,
    radius: 2.0,
    orbitalPeriod: 1928.0,
    distance: 4.24,
    temperature: 39,
    habitable: false,
    coordinates: {
      rightAscension: 217.43,
      declination: -62.68
    },
    starType: "M5.5V",
    description: "A super-Earth orbiting Proxima Centauri, but outside the habitable zone."
  },
  {
    id: "hd-40307f",
    name: "HD 40307f",
    discoveryYear: 2012,
    method: "Radial Velocity",
    mass: 5.2,
    radius: 1.9,
    orbitalPeriod: 51.8,
    distance: 42.4,
    temperature: 320,
    habitable: false,
    coordinates: {
      rightAscension: 88.78,
      declination: -60.19
    },
    starType: "K2.5V",
    description: "A super-Earth in the HD 40307 system, too close to its star for habitability."
  }
];

// Helper function to convert astronomical coordinates to galactic map coordinates
export const convertToMapCoordinates = (ra: number, dec: number) => {
  // Convert right ascension (0-360°) to longitude (-180 to 180)
  // Convert declination (-90 to 90°) to latitude (-90 to 90)
  const lng = (ra - 180) / 180 * 180; // Center RA around 0
  const lat = dec; // Use declination directly
  
  // Scale to create a better distributed galactic view
  const scale = 1.2;
  return [lat * scale, lng * scale]; // [lat, lng] format for Leaflet
};
