// Geodesic and Solar Astronomy utilities for realistic threat map visualization

export interface LatLng {
  lat: number;
  lng: number;
}

/**
 * Calculates intermediate points along a Great Circle route between two coordinates
 */
export function getGreatCirclePoints(
  startLng: number,
  startLat: number,
  endLng: number,
  endLat: number,
  numPoints = 50
): [number, number][] { // returns [lng, lat][]
  const toRad = Math.PI / 180;
  const toDeg = 180 / Math.PI;

  const lat1 = startLat * toRad;
  const lon1 = startLng * toRad;
  const lat2 = endLat * toRad;
  const lon2 = endLng * toRad;

  const d = 2 * Math.asin(
    Math.sqrt(
      Math.pow(Math.sin((lat1 - lat2) / 2), 2) +
      Math.cos(lat1) * Math.cos(lat2) * Math.pow(Math.sin((lon1 - lon2) / 2), 2)
    )
  );

  if (d === 0) {
    return [[startLng, startLat]];
  }

  const points: [number, number][] = [];

  for (let i = 0; i <= numPoints; i++) {
    const f = i / numPoints;
    const A = Math.sin((1 - f) * d) / Math.sin(d);
    const B = Math.sin(f * d) / Math.sin(d);

    const x = A * Math.cos(lat1) * Math.cos(lon1) + B * Math.cos(lat2) * Math.cos(lon2);
    const y = A * Math.cos(lat1) * Math.sin(lon1) + B * Math.cos(lat2) * Math.sin(lon2);
    const z = A * Math.sin(lat1) + B * Math.sin(lat2);

    const lat = Math.atan2(z, Math.sqrt(x * x + y * y)) * toDeg;
    const lon = Math.atan2(y, x) * toDeg;

    points.push([lon, lat]);
  }

  return points;
}

/**
 * Calculates current Solar Terminator (Day/Night dividing line) coordinates
 */
export function calculateSolarTerminator(date = new Date()): [number, number][] {
  // Approximate solar declination and Greenwich Hour Angle
  const now = date.getTime();
  const startOfYear = new Date(date.getUTCFullYear(), 0, 1).getTime();
  const dayOfYear = (now - startOfYear) / (1000 * 60 * 60 * 24);

  // Solar declination (approximate in radians)
  const declination = 23.44 * Math.sin(((284 + dayOfYear) / 365) * 2 * Math.PI) * (Math.PI / 180);

  // Greenwich hour angle in radians
  const utcHours = date.getUTCHours() + date.getUTCMinutes() / 60 + date.getUTCSeconds() / 3600;
  const gha = (utcHours * 15 - 180) * (Math.PI / 180);

  const points: [number, number][] = [];
  const toDeg = 180 / Math.PI;

  for (let lonDeg = -180; lonDeg <= 180; lonDeg += 3) {
    const lonRad = lonDeg * (Math.PI / 180);
    const tau = lonRad + gha;
    
    // Latitude where solar elevation is 0
    let latRad = -Math.atan(Math.cos(tau) / Math.tan(declination));
    if (isNaN(latRad)) latRad = 0;
    const latDeg = Math.max(-85, Math.min(85, latRad * toDeg));
    points.push([lonDeg, latDeg]);
  }

  return points;
}

/**
 * Great circle distance between two points in kilometers
 */
export function getGreatCircleDistanceKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // Earth radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c);
}
