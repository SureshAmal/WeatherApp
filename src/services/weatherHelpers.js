/**
 * @param {Object} weatherData
 * @param {Object} forecastData
 * @param {Object} airPollutionData
 * @returns {Object}
 */

export function processWeatherData(
  weatherData,
  forecastData,
  airPollutionData,
) {
  if (!weatherData || !forecastData || !airPollutionData) {
    return null;
  }

  return {
    current: getCurrentWeather(weatherData),
    forecast: getForecastData(forecastData),
    highlights: getTodayHighlights(weatherData, airPollutionData),
    hourly: getHourlyForecast(forecastData),
  };
}

function getCurrentWeather(weatherData) {
  const date = new Date();
  const weekday = getWeekdayName(date);

  return {
    temperature: kelvinToCelsius(weatherData.main.temp),
    description: weatherData.weather[0].description,
    icon: weatherData.weather[0].icon,
    date: formatDate(date),
    weekday,
    location: {
      city: weatherData.name,
      country: weatherData.sys.country,
    },
  };
}

function getForecastData(forecastData) {
  const dailyForecasts = {};

  forecastData.list.forEach((item) => {
    const date = new Date(item.dt * 1000);
    const day = date.toISOString().split("T")[0];

    const hour = date.getHours();
    if (hour >= 11 && hour <= 13) {
      dailyForecasts[day] = {
        date: formatDate(date),
        weekday: getWeekdayName(date),
        temperature: kelvinToCelsius(item.main.temp),
        description: item.weather[0].description,
        icon: item.weather[0].icon,
      };
    }
  });

  return Object.values(dailyForecasts).slice(0, 5);
}

function getTodayHighlights(weatherData, airPollutionData) {
  const aqi = airPollutionData.list[0].main.aqi;
  const components = airPollutionData.list[0].components;

  let aqiCategory;
  switch (aqi) {
    case 1:
      aqiCategory = "Good";
      break;
    case 2:
      aqiCategory = "Fair";
      break;
    case 3:
      aqiCategory = "Moderate";
      break;
    case 4:
      aqiCategory = "Poor";
      break;
    case 5:
      aqiCategory = "Very Poor";
      break;
    default:
      aqiCategory = "Unknown";
  }

  return {
    airQuality: {
      category: aqiCategory,
      value: aqi,
      components: {
        pm2_5: components.pm2_5,
        so2: components.so2,
        no2: components.no2,
        o3: components.o3,
      },
    },
    sunTime: {
      sunrise: formatTime(new Date(weatherData.sys.sunrise * 1000)),
      sunset: formatTime(new Date(weatherData.sys.sunset * 1000)),
    },
    humidity: {
      value: weatherData.main.humidity,
      unit: "%",
    },
    pressure: {
      value: weatherData.main.pressure,
      unit: "hPa",
    },
    visibility: {
      value: weatherData.visibility / 1000,
      unit: "km",
    },
    feelsLike: {
      value: kelvinToCelsius(weatherData.main.feels_like),
      unit: "°C",
    },
  };
}

function getHourlyForecast(forecastData) {
  const today = new Date().toISOString().split("T")[0];
  const tomorrow =
    new Date(new Date().setDate(new Date().getDate() + 1)).toISOString().split(
      "T",
    )[0];

  // Get all forecasts for today and tomorrow
  const hourlyData = forecastData.list
    .filter((item) => {
      const itemDate = new Date(item.dt * 1000).toISOString().split("T")[0];
      return itemDate === today || itemDate === tomorrow;
    })
    .slice(0, 8);

  const tempData = hourlyData.map((item) => {
    const date = new Date(item.dt * 1000);
    return {
      time: formatTime(date),
      temperature: kelvinToCelsius(item.main.temp),
      icon: item.weather[0].icon,
      description: item.weather[0].description,
    };
  });

  const windData = hourlyData.map((item) => {
    const date = new Date(item.dt * 1000);
    return {
      time: formatTime(date),
      speed: Math.round(item.wind.speed * 3.6),
      direction: item.wind.deg,
      icon: getWindDirectionIcon(item.wind.deg),
      gust: item.wind.gust ? Math.round(item.wind.gust * 3.6) : null,
    };
  });

  return {
    temperature: tempData,
    wind: windData,
  };
}

function getWindDirectionIcon(degrees) {
  if (degrees >= 337.5 || degrees < 22.5) return "north";
  if (degrees >= 22.5 && degrees < 67.5) return "northeast";
  if (degrees >= 67.5 && degrees < 112.5) return "east";
  if (degrees >= 112.5 && degrees < 157.5) return "southeast";
  if (degrees >= 157.5 && degrees < 202.5) return "south";
  if (degrees >= 202.5 && degrees < 247.5) return "southwest";
  if (degrees >= 247.5 && degrees < 292.5) return "west";
  if (degrees >= 292.5 && degrees < 337.5) return "northwest";
  return "unknown";
}

function kelvinToCelsius(kelvin) {
  return Math.round(kelvin - 273.15);
}

function formatDate(date) {
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

function formatTime(date) {
  return date.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
}

function getWeekdayName(date) {
  return date.toLocaleDateString("en-US", { weekday: "long" });
}
