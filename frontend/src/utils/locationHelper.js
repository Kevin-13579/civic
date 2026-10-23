// Detailed coordinates of key Coimbatore hubs for high-accuracy proximity detection
export const COIMBATORE_LOCALITY_COORDS = [
  { name: "Eachanari", lat: 10.9275, lon: 76.9806 },
  { name: "Gandhipuram", lat: 11.0168, lon: 76.9678 },
  { name: "Peelamedu", lat: 11.0287, lon: 77.0142 },
  { name: "RS Puram", lat: 11.0116, lon: 76.9483 },
  { name: "Ukkadam", lat: 10.9935, lon: 76.9602 },
  { name: "Saravanampatti", lat: 11.0772, lon: 77.0004 },
  { name: "Singanallur", lat: 11.0028, lon: 77.0255 },
  { name: "Kuniyamuthur", lat: 10.9634, lon: 76.9582 },
  { name: "Saibaba Colony", lat: 11.0264, lon: 76.9450 },
  { name: "Ganapathy", lat: 11.0366, lon: 76.9782 },
  { name: "Town Hall", lat: 10.9984, lon: 76.9634 },
  { name: "Kovaipudur", lat: 10.9381, lon: 76.9387 },
  { name: "Thudiyalur", lat: 11.0827, lon: 76.9497 },
  { name: "Ramanathapuram", lat: 10.9961, lon: 76.9930 },
  { name: "Vadavalli", lat: 11.0245, lon: 76.9054 },
  { name: "Sundarapuram", lat: 10.9472, lon: 76.9745 },
  { name: "Podanur", lat: 10.9625, lon: 76.9995 },
  { name: "Hopes College", lat: 11.0205, lon: 77.0305 },
  { name: "Ondipudur", lat: 11.0012, lon: 77.0512 },
  { name: "Kalapatti", lat: 11.0728, lon: 77.0425 },
  { name: "Perur", lat: 10.9702, lon: 76.9142 },
  { name: "Kavundampalayam", lat: 11.0456, lon: 76.9362 }
];

/**
 * Calculates distance in kilometers between two GPS coordinates using the Haversine formula.
 */
function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // Radius of Earth in km
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) *
      Math.cos(lat2 * (Math.PI / 180)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Finds the closest Coimbatore locality to the user's GPS position.
 */
export function findNearestCoimbatoreLocality(lat, lon) {
  let closest = null;
  let minDistance = Infinity;

  for (const loc of COIMBATORE_LOCALITY_COORDS) {
    const dist = calculateDistance(lat, lon, loc.lat, loc.lon);
    if (dist < minDistance) {
      minDistance = dist;
      closest = loc;
    }
  }

  return { locality: closest?.name, distanceKm: minDistance };
}

/**
 * Enhanced browser location detector.
 * Detects specific neighborhoods such as Eachanari, Gandhipuram, Peelamedu, etc.
 * Combines high-resolution reverse geocoding with proximity matching.
 */
export const getCityFromBrowser = () => {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      return reject("Geolocation is not supported by your browser");
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;

        // 1. First, check proximity against Coimbatore locality hubs
        const nearest = findNearestCoimbatoreLocality(latitude, longitude);

        // If coordinates fall within Coimbatore boundary (approx < 15km from nearest hub)
        const isCoimbatoreArea =
          latitude >= 10.75 && latitude <= 11.25 &&
          longitude >= 76.75 && longitude <= 77.25;

        // 2. Query OpenStreetMap Nominatim for exact address details (suburb, neighbourhood)
        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=18&addressdetails=1`,
            { headers: { 'Accept-Language': 'en' } }
          );
          if (res.ok) {
            const data = await res.json();
            const addr = data.address || {};
            const subLocality = addr.suburb || addr.neighbourhood || addr.residential || addr.quarter || addr.subdistrict;
            const city = addr.city || addr.town || addr.village || addr.county || "Coimbatore";

            if (subLocality) {
              return resolve(`${subLocality}, ${city}`);
            }
          }
        } catch (err) {
          console.warn("Nominatim reverse geocode failed, falling back to proximity/BigDataCloud:", err);
        }

        // 3. Proximity match if within Coimbatore bounds and within 6km of a known hub
        if (isCoimbatoreArea && nearest.locality && nearest.distanceKm <= 6.0) {
          return resolve(`${nearest.locality}, Coimbatore`);
        }

        // 4. Fallback to BigDataCloud
        try {
          const res = await fetch(
            `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=en`
          );
          const data = await res.json();

          let subArea = null;
          if (data.localityInfo && Array.isArray(data.localityInfo.informative)) {
            const found = data.localityInfo.informative.find(
              info => info.name && COIMBATORE_LOCALITY_COORDS.some(c => c.name.toLowerCase() === info.name.toLowerCase())
            );
            if (found) subArea = found.name;
          }

          if (subArea) {
            return resolve(`${subArea}, Coimbatore`);
          }

          const city = data.city || data.locality || (nearest.locality ? `${nearest.locality}, Coimbatore` : "Coimbatore");
          resolve(city);
        } catch (err) {
          if (nearest.locality && nearest.distanceKm <= 10.0) {
            resolve(`${nearest.locality}, Coimbatore`);
          } else {
            reject("Could not resolve location address");
          }
        }
      },
      (err) => {
        reject("Geolocation permission denied or timed out. Please select your locality from the list.");
      },
      { timeout: 10000, enableHighAccuracy: true }
    );
  });
};