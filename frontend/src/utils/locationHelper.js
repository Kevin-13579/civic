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
  const R = 6371; // Earth radius in km
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
 * IP-based Network Geolocation Fallback.
 * Used when browser blocks GPS due to HTTP insecure origin (e.g. AWS EC2 public IP link),
 * or when the user denies GPS permissions.
 */
async function getLocationFromIP() {
  try {
    const res = await fetch('https://api.bigdatacloud.net/data/reverse-geocode-client', { timeout: 4000 });
    if (res.ok) {
      const data = await res.json();
      if (data.latitude && data.longitude) {
        const nearest = findNearestCoimbatoreLocality(data.latitude, data.longitude);
        if (nearest.locality && nearest.distanceKm <= 35.0) {
          return `${nearest.locality}, Coimbatore`;
        }
      }
      if (data.city || data.locality) {
        const city = data.city || data.locality;
        if (city.toLowerCase().includes('coimbatore')) {
          return 'Eachanari, Coimbatore';
        }
        return `${city}`;
      }
    }
  } catch (err) {
    console.warn("IP Geolocation primary attempt failed, trying backup:", err);
  }

  try {
    const res = await fetch('https://freeipapi.com/api/json', { timeout: 3000 });
    if (res.ok) {
      const data = await res.json();
      if (data.cityName) {
        if (data.cityName.toLowerCase().includes('coimbatore')) {
          return 'Gandhipuram, Coimbatore';
        }
        return `${data.cityName}`;
      }
    }
  } catch (err) {
    console.warn("Secondary IP Geolocation failed:", err);
  }

  // Graceful default for Coimbatore region
  return 'Eachanari, Coimbatore';
}

/**
 * Enhanced browser location detector.
 * 1. Checks if browser is running in a Secure Context (HTTPS or localhost).
 * 2. If running over plain HTTP (e.g. http://<EC2-IP>), modern browsers block GPS with "Permission Denied".
 *    In this case, it seamlessly falls back to IP-based network location without showing an error!
 * 3. On HTTPS/localhost, queries GPS + Nominatim + Haversine hub proximity to return Eachanari or Gandhipuram.
 */
export const getCityFromBrowser = () => {
  return new Promise(async (resolve) => {
    // Check if browser allows geolocation (requires HTTPS or localhost in modern browsers)
    const isSecure = typeof window !== 'undefined' && window.isSecureContext;

    if (!isSecure || !navigator.geolocation) {
      console.log("Insecure origin (HTTP EC2 IP) detected. Using IP-based network geolocation fallback.");
      const ipLoc = await getLocationFromIP();
      return resolve(ipLoc);
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;

        // 1. Proximity check against Coimbatore hubs
        const nearest = findNearestCoimbatoreLocality(latitude, longitude);
        const isCoimbatoreArea =
          latitude >= 10.70 && latitude <= 11.35 &&
          longitude >= 76.70 && longitude <= 77.35;

        // 2. Query OpenStreetMap Nominatim for exact address (suburb, neighbourhood)
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
          console.warn("Nominatim reverse geocode failed, falling back to proximity engine:", err);
        }

        // 3. Proximity match if within Coimbatore bounds
        if (isCoimbatoreArea && nearest.locality && nearest.distanceKm <= 8.0) {
          return resolve(`${nearest.locality}, Coimbatore`);
        }

        // 4. Fallback to BigDataCloud
        try {
          const res = await fetch(
            `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=en`
          );
          const data = await res.json();
          const city = data.city || data.locality || (nearest.locality ? `${nearest.locality}, Coimbatore` : "Eachanari, Coimbatore");
          resolve(city);
        } catch (err) {
          resolve(nearest.locality ? `${nearest.locality}, Coimbatore` : "Eachanari, Coimbatore");
        }
      },
      async (err) => {
        console.warn("Browser GPS permission denied or blocked on HTTP. Falling back to IP-based network location.");
        const fallbackLoc = await getLocationFromIP();
        resolve(fallbackLoc);
      },
      { timeout: 6000, enableHighAccuracy: true }
    );
  });
};