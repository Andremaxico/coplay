// Helper for Google Maps loading and reverse geocoding with resilient fallbacks

declare global {
  interface Window {
    google?: any;
    __googleMapsLoadingPromise?: Promise<any>;
  }
}

export const loadGoogleMaps = (apiKey?: string): Promise<any> => {
  if (typeof window === 'undefined') {
    return Promise.reject(new Error('Window is undefined'));
  }

  if (window.google?.maps) {
    return Promise.resolve(window.google);
  }

  if (window.__googleMapsLoadingPromise) {
    return window.__googleMapsLoadingPromise;
  }

  window.__googleMapsLoadingPromise = new Promise((resolve, reject) => {
    const existing = document.getElementById('google-maps-script') as HTMLScriptElement;
    if (existing) {
      if (window.google?.maps) {
        resolve(window.google);
        return;
      }
      existing.addEventListener('load', () => resolve(window.google));
      existing.addEventListener('error', (err) => reject(err));
      return;
    }

    const script = document.createElement('script');
    script.id = 'google-maps-script';
    const keyParam = apiKey ? `&key=${encodeURIComponent(apiKey)}` : '';
    script.src = `https://maps.googleapis.com/maps/api/js?libraries=places,geometry${keyParam}`;
    script.async = true;
    script.defer = true;

    script.onload = () => {
      if (window.google?.maps) {
        resolve(window.google);
      } else {
        reject(new Error('Google Maps script loaded, but window.google.maps is unavailable'));
      }
    };

    script.onerror = (e) => {
      window.__googleMapsLoadingPromise = undefined;
      reject(e);
    };

    document.head.appendChild(script);
  });

  return window.__googleMapsLoadingPromise;
};

// Extract best name / street representation from Google Geocoder Result
export const formatGoogleAddress = (result: any): string => {
  if (!result) return '';
  const components = result.address_components || [];
  let streetNumber = '';
  let route = '';
  let pointOfInterest = '';
  let locality = '';

  for (const c of components) {
    const types: string[] = c.types || [];
    if (types.includes('point_of_interest') || types.includes('premise') || types.includes('establishment')) {
      pointOfInterest = c.long_name;
    }
    if (types.includes('route')) {
      route = c.long_name;
    }
    if (types.includes('street_number')) {
      streetNumber = c.long_name;
    }
    if (types.includes('locality')) {
      locality = c.long_name;
    }
  }

  if (pointOfInterest && route) {
    const street = streetNumber ? `${route} ${streetNumber}` : route;
    return `${pointOfInterest}, ${street}`;
  }

  if (pointOfInterest) {
    return locality ? `${pointOfInterest}, ${locality}` : pointOfInterest;
  }

  if (route) {
    const street = streetNumber ? `${route} ${streetNumber}` : route;
    return locality ? `${street}, ${locality}` : street;
  }

  const parts = (result.formatted_address || '').split(',');
  if (parts.length >= 2) {
    return `${parts[0].trim()}, ${parts[1].trim()}`;
  }

  return result.formatted_address || '';
};

// Reverse geocode with fallback to Nominatim if Google geocoding quota/key fails
export const reverseGeocode = async (lat: number, lng: number): Promise<string> => {
  // 1. Try Google Maps Geocoder if loaded
  if (window.google?.maps?.Geocoder) {
    try {
      const geocoder = new window.google.maps.Geocoder();
      const response = await new Promise<any>((resolve, reject) => {
        geocoder.geocode({ location: { lat, lng } }, (results: any[], status: string) => {
          if (status === 'OK' && results && results[0]) {
            resolve(results[0]);
          } else {
            reject(new Error(status));
          }
        });
      });

      const formatted = formatGoogleAddress(response);
      if (formatted) return formatted;
    } catch (err) {
      console.warn('Google reverse geocode error or restricted, using fallback:', err);
    }
  }

  // 2. Resilient OpenStreetMap Nominatim fallback
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`,
      {
        headers: {
          'Accept-Language': 'uk,pl,en',
        },
      }
    );
    if (res.ok) {
      const data = await res.json();
      const addr = data.address || {};
      const poi = data.name || addr.amenity || addr.leisure || addr.building || '';
      const road = addr.road || addr.pedestrian || addr.footway || '';
      const houseNumber = addr.house_number || '';
      const city = addr.city || addr.town || addr.village || addr.suburb || '';

      const street = road ? (houseNumber ? `${road} ${houseNumber}` : road) : '';
      if (poi && street) return `${poi}, ${street}`;
      if (poi) return city ? `${poi}, ${city}` : poi;
      if (street) return city ? `${street}, ${city}` : street;

      return data.display_name ? data.display_name.split(',').slice(0, 2).join(',').trim() : '';
    }
  } catch (fallbackErr) {
    console.error('Nominatim reverse geocode error:', fallbackErr);
  }

  return `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
};

// Search address/place text
export const searchLocation = async (
  query: string
): Promise<{ lat: number; lng: number; label: string } | null> => {
  if (!query || !query.trim()) return null;

  // 1. Try Google Geocoder
  if (window.google?.maps?.Geocoder) {
    try {
      const geocoder = new window.google.maps.Geocoder();
      const response = await new Promise<any>((resolve, reject) => {
        geocoder.geocode({ address: query }, (results: any[], status: string) => {
          if (status === 'OK' && results && results[0]) {
            resolve(results[0]);
          } else {
            reject(new Error(status));
          }
        });
      });

      const loc = response.geometry?.location;
      if (loc) {
        const lat = typeof loc.lat === 'function' ? loc.lat() : loc.lat;
        const lng = typeof loc.lng === 'function' ? loc.lng() : loc.lng;
        return {
          lat,
          lng,
          label: formatGoogleAddress(response),
        };
      }
    } catch (err) {
      console.warn('Google search error, using fallback:', err);
    }
  }

  // 2. Fallback Nominatim Search
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=1`,
      {
        headers: {
          'Accept-Language': 'uk,pl,en',
        },
      }
    );
    if (res.ok) {
      const list = await res.json();
      if (list && list.length > 0) {
        const item = list[0];
        return {
          lat: parseFloat(item.lat),
          lng: parseFloat(item.lon),
          label: item.display_name ? item.display_name.split(',').slice(0, 2).join(',').trim() : query,
        };
      }
    }
  } catch (fallbackErr) {
    console.error('Nominatim search error:', fallbackErr);
  }

  return null;
};
