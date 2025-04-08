export const searchApi = {
  loading: false,

  suggestionCache: {},

  /**
   * @param {string} query 
   * @param {string} apiKey 
   * @returns {Promise<Array>}
   */
  async getCitySuggestions(query, apiKey) {
    if (!query || query.length < 2) {
      return [];
    }

    const cacheKey = query.toLowerCase();
    if (this.suggestionCache[cacheKey]) {
      return this.suggestionCache[cacheKey];
    }

    this.loading = true;

    try {
      const geocodingUrl = `https://api.openweathermap.org/geo/1.0/direct?q=${encodeURIComponent(query)}&limit=5&appid=${apiKey}`;
      const response = await fetch(geocodingUrl);

      if (!response.ok) {
        throw new Error('Failed to fetch city suggestions');
      }

      const data = await response.json();

      const suggestions = data.map(city => ({
        id: `${city.lat}_${city.lon}`,
        name: city.name,
        state: city.state || '',
        country: city.country,
        lat: city.lat,
        lon: city.lon,
        displayName: city.state
          ? `${city.name}, ${city.state}, ${city.country}`
          : `${city.name}, ${city.country}`
      }));

      this.suggestionCache[cacheKey] = suggestions;

      return suggestions;
    } catch (error) {
      console.error('Error fetching city suggestions:', error);
      return [];
    } finally {
      this.loading = false;
    }
  },

  clearCache() {
    this.suggestionCache = {};
  },

  /**
   * @param {Object} city 
   * @param {string} apiKey 
   * @returns {Promise<Object>} 
   */

  /**
   * Get user's current location using browser geolocation
   * @returns {Promise<Object>} - Coordinates and location name
   */
  async getCurrentLocation() {
    this.loading = true;

    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        this.loading = false;
        reject(new Error('Geolocation is not supported by your browser'));
        return;
      }

      navigator.geolocation.getCurrentPosition(
        async (position) => {
          try {
            const { latitude, longitude } = position.coords;

            const response = await fetch(
              `https://api.openweathermap.org/geo/1.0/reverse?lat=${latitude}&lon=${longitude}&limit=1&appid=${import.meta.env.VITE_OPEN_WEATHER_API_KEY}`
            );

            if (!response.ok) {
              throw new Error('Failed to get location name');
            }

            const data = await response.json();
            const locationData = data[0] || {};

            resolve({
              lat: latitude,
              lon: longitude,
              name: locationData.name || 'Current Location',
              country: locationData.country || '',
              state: locationData.state || ''
            });
          } catch (error) {
            reject(error);
          } finally {
            this.loading = false;
          }
        },
        (error) => {
          this.loading = false;
          let message = 'Unable to retrieve your location';

          switch (error.code) {
            case error.PERMISSION_DENIED:
              message = 'Location access was denied';
              break;
            case error.POSITION_UNAVAILABLE:
              message = 'Location information is unavailable';
              break;
            case error.TIMEOUT:
              message = 'Location request timed out';
              break;
          }

          reject(new Error(message));
        }
      );
    });
  }
};
