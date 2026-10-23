// Coimbatore Localities GPS Coordinate Database
export const LOCALITY_COORDINATES = {
  "Eachanari": { lat: 10.9298, lon: 76.9818 },
  "Gandhipuram": { lat: 11.0176, lon: 76.9674 },
  "Peelamedu": { lat: 11.0267, lon: 77.0145 },
  "RS Puram": { lat: 11.0125, lon: 76.9458 },
  "Ukkadam": { lat: 10.9897, lon: 76.9602 },
  "Saravanampatti": { lat: 11.0772, lon: 76.9995 },
  "Singanallur": { lat: 10.9992, lon: 77.0264 },
  "Kuniyamuthur": { lat: 10.9575, lon: 76.9507 },
  "Saibaba Colony": { lat: 11.0305, lon: 76.9488 },
  "Ganapathy": { lat: 11.0366, lon: 76.9782 },
  "Town Hall": { lat: 10.9972, lon: 76.9628 },
  "Kovaipudur": { lat: 10.9328, lon: 76.9348 },
  "Thudiyalur": { lat: 11.0768, lon: 76.9385 },
  "Ramanathapuram": { lat: 10.9958, lon: 76.9855 },
  "Vadavalli": { lat: 11.0242, lon: 76.9022 },
  "Sundarapuram": { lat: 10.9496, lon: 76.9744 },
  "Podanur": { lat: 10.9634, lon: 76.9892 },
  "Hopes College": { lat: 11.0248, lon: 77.0094 },
  "Ondipudur": { lat: 10.9942, lon: 77.0543 },
  "Kalapatti": { lat: 11.0722, lon: 77.0375 },
  "Perur": { lat: 10.9702, lon: 76.9189 },
  "Kavundampalayam": { lat: 11.0458, lon: 76.9372 },
  "Coimbatore": { lat: 11.0168, lon: 76.9558 }
};

/**
 * Resolves precise latitude and longitude for a locality string.
 */
export const getCoordinatesForLocation = (locationName) => {
  if (!locationName) return LOCALITY_COORDINATES["Coimbatore"];

  const normalized = locationName.toLowerCase();
  for (const [key, coords] of Object.entries(LOCALITY_COORDINATES)) {
    if (normalized.includes(key.toLowerCase())) {
      return coords;
    }
  }
  return LOCALITY_COORDINATES["Coimbatore"];
};

/**
 * Builds an OpenStreetMap embed URL with a precise marker pin.
 * Unlike Google Maps iframes, OpenStreetMap never blocks embedding with X-Frame-Options!
 */
export const getOsmEmbedUrl = (lat, lon, delta = 0.012) => {
  const minLon = (lon - delta).toFixed(5);
  const minLat = (lat - delta).toFixed(5);
  const maxLon = (lon + delta).toFixed(5);
  const maxLat = (lat + delta).toFixed(5);
  return `https://www.openstreetmap.org/export/embed.html?bbox=${minLon}%2C${minLat}%2C${maxLon}%2C${maxLat}&layer=mapnik&marker=${lat.toFixed(5)}%2C${lon.toFixed(5)}`;
};

/**
 * Returns an external Google Maps search / navigation URL to open in a new tab.
 */
export const getGoogleMapsUrl = (locationName, lat, lon) => {
  if (lat && lon) {
    return `https://www.google.com/maps/search/?api=1&query=${lat},${lon}`;
  }
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(locationName || 'Coimbatore')}`;
};

/**
 * Returns a Google Maps turn-by-turn directions URL for field workers.
 */
export const getGoogleDirectionsUrl = (locationName, lat, lon) => {
  if (lat && lon) {
    return `https://www.google.com/maps/dir/?api=1&destination=${lat},${lon}`;
  }
  return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(locationName || 'Coimbatore')}`;
};
