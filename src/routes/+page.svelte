<script>
  import { onMount } from "svelte";
  import { processWeatherData } from "../services/weatherHelpers.js";
  const api_key = import.meta.env.VITE_OPEN_WEATHER_API_KEY;
  let selectedCity = $state("rajkot");
  let forcastData = null;
  let weatherData = null;
  let cityData = null;
  let airPollutionData = null;
  let loading = $state(true);
  let error = $state(null);
  let processedData = $state(null);
  import { MessageCircle, Mail, Share2 } from 'lucide-svelte';

  async function fetchWeatherData(city) {
    loading = true;
    error = null;
    processedData = null;
    const cityName = typeof city === "object" ? city.name : city;
    const api_forcast_url = `https://api.openweathermap.org/data/2.5/forecast?q=${cityName}&appid=${api_key}`;
    const api_weather_url = `https://api.openweathermap.org/data/2.5/weather?q=${cityName}&appid=${api_key}`;
    const city_coordition_url = `https://api.openweathermap.org/geo/1.0/direct?q=${cityName}&limit=5&appid=${api_key}`;
    const air_pollution_url = `https://api.openweathermap.org/data/2.5/air_pollution?lat=`;
    try {
      const cityResponse = await fetch(city_coordition_url);
      if (!cityResponse.ok) throw new Error("Failed to fetch city data");
      cityData = await cityResponse.json();

      if (!cityData || cityData.length === 0) {
        throw new Error("City not found");
      }

      const [weatherResponse, forecastResponse, pollutionResponse] =
        await Promise.all([
          fetch(api_weather_url),
          fetch(api_forcast_url),
          fetch(
            `${air_pollution_url}${cityData[0].lat}&lon=${cityData[0].lon}&appid=${api_key}`,
          ),
        ]);
      if (
        !weatherResponse.ok ||
        !forecastResponse.ok ||
        !pollutionResponse.ok
      ) {
        throw new Error("One or more API requests failed");
      }
      weatherData = await weatherResponse.json();
      forcastData = await forecastResponse.json();
      airPollutionData = await pollutionResponse.json();
      processedData = processWeatherData(
        weatherData,
        forcastData,
        airPollutionData,
      );
    } catch (err) {
      error = err.message;
      console.error("Error fetching weather data:", err);
    } finally {
      loading = false;
    }
  }

  function handleCitySelected(event) {
    const city = event.detail;
    selectedCity = city;
    fetchWeatherData(city);
  }

  onMount(() => {
    fetchWeatherData(selectedCity);
    window.addEventListener("citySelected", handleCitySelected);
    return () => {
      window.removeEventListener("citySelected", handleCitySelected);
    };
  });

  function getWeatherIconUrl(iconCode) {
    return `https://openweathermap.org/img/wn/${iconCode}@2x.png`;
  }

  // Air quality color mapping
  function getAirQualityColor(category) {
    const colors = {
      Good: "bg-green-500",
      Moderate: "bg-yellow-500",
      Poor: "bg-orange-500",
      Unhealthy: "bg-red-500",
      "Very Unhealthy": "bg-purple-500",
      Hazardous: "bg-red-800",
    };
    return colors[category] || "bg-gray-500";
  }

  // Format the wind direction into compass direction
  function getWindDirection(degrees) {
    const directions = ["N", "NE", "E", "SE", "S", "SW", "W", "NW"];
    const index = Math.round(degrees / 45) % 8;
    return directions[index];
  }



  let showCityDropdown = $state(false);
  let selectCity = function (city) {
    selectedCity = city;
    showCityDropdown = false;
    fetchWeatherData(city);
  };

  function toggleCityDropdown() {
    showCityDropdown = !showCityDropdown;
  }

  function getCurrentWeatherMessage() {
  const currentCity = processedData ? processedData.current.location.city : "City";
  const currentTemp = processedData ? processedData.current.temperature : null;
  return `Current Temperature in ${currentCity}: ${currentTemp}°C.`;
}

function shareOnWhatsApp() {
  const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(getCurrentWeatherMessage())}`;
  window.open(whatsappUrl, "_blank");
}

function shareViaEmail() {
  const currentCity = processedData ? processedData.current.location.city : "City";
  const emailUrl = `mailto:?subject=Weather Update: ${currentCity}&body=${encodeURIComponent(getCurrentWeatherMessage())}`;
  window.location.href = emailUrl;
}

function shareOnTelegram() {
  const telegramUrl = `https://t.me/share/url?url=${encodeURIComponent(getCurrentWeatherMessage())}`;
  window.open(telegramUrl, "_blank");
}
</script>

<svelte:window on:citySelected={handleCitySelected} />

<main
  class="min-h-screen bg-gradient-to-br from-blue-100 to-blue-200 p-4 md:p-6"
>
 


  <div class="max-w-6xl">
    <!-- Loading state -->
    {#if loading}
      <div class="text-center py-10">
        <p>Loading weather data...</p>
      </div>
    {:else if error}
      <div class="text-center py-10 text-red-500">
        <p>Error: {error}</p>
      </div>
    {:else if processedData}
      <!-- Main content -->
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <!-- Current weather card -->
        <div class="max-w-9xl ">
          {#if loading}
            <div class="text-center py-10">
              <p>Loading weather data...</p>
            </div>
          {:else if error}
            <div class="text-center py-10 text-red-500">
              <p>Error: {error}</p>
            </div>
          {:else if processedData}
            <!-- Main content -->
  
              <div class="bg-white rounded-2xl shadow-md p-6 lg:col-span-1 ">
                <div class="flex flex-col items-center">
                  <div class="text-sm text-gray-500 mb-1">
                    {processedData.current.weekday}, {processedData.current.date}
                  </div>
                  <h2 class="text-xl font-semibold mb-2">
                    {processedData.current.location.city}, {processedData.current
                      .location.country}
                  </h2>
      
                  <img
                    src={getWeatherIconUrl(processedData.current.icon)}
                    alt={processedData.current.description}
                    class="w-24 h-20 my-2"
                  />
                  <div class="text-3xl font-bold mb-2">
                    {processedData.current.temperature}°C
                  </div>
                  <div class="text-gray-600 capitalize">
                    {processedData.current.description}
                  </div>
      
                  <div class="flex items-center mt-4 text-sm text-gray-700">
                    <span
                      >Feels like: {processedData.highlights.feelsLike.value}°C</span
                    >
                  </div>
      
                  <!-- Share Buttons -->
                  <div class="mt-6 space-x-4 flex lg:flex-row lg:space-x-6">
                    <!-- WhatsApp button with Lucide icon -->
                    <button
                      onclick={shareOnWhatsApp}
                      class="bg-green-500 flex flex-col items-center text-white px-2 py-1 rounded-md hover:bg-green-600 transition"
                    >
                      <MessageCircle class="w-5 h-5 mb-2" /> <!-- Icon at the top -->
                      <span class="text-xs">WhatsApp</span> <!-- Text at the bottom -->
                    </button>
                  
                    <!-- Email button with Lucide icon -->
                    <button
                      onclick={shareViaEmail}
                      class="bg-blue-500 flex flex-col items-center text-white px-4 py-2 rounded-md hover:bg-blue-600 transition"
                    >
                      <Mail class="w-5 h-5 mb-2" /> <!-- Icon at the top -->
                      <span class="text-xs">Email</span> <!-- Text at the bottom -->
                    </button>
                  
                    <!-- Telegram button with Lucide icon -->
                    <button
                      onclick={shareOnTelegram}
                      class="bg-blue-400 flex flex-col items-center text-white px-4 py-2 rounded-md hover:bg-blue-500 transition"
                    >
                      <Share2 class="w-5 h-5 mb-2" /> <!-- Icon at the top -->
                      <span class="text-xs">Telegram</span> <!-- Text at the bottom -->
                    </button>
                  </div>
                </div>
              </div>
            {/if}
            </div>
        <!-- 5 day forecast -->
        <div class="bg-white rounded-2xl shadow-md p-6 lg:col-span-2">
          <h2 class="text-lg font-semibold mb-4">5-Day Forecast</h2>
          <div class="grid grid-cols-2 sm:grid-cols-5 gap-4">
            {#each processedData.forecast as day}
              <div class="bg-blue-50 rounded-xl p-3 flex flex-col items-center">
                <div class="text-sm font-medium">{day.weekday}</div>
                <div class="text-xs text-gray-500">{day.date}</div>
                <img
                  src={getWeatherIconUrl(day.icon)}
                  alt={day.description}
                  class="w-12 h-12 my-1"
                />
                <div class="text-lg font-semibold">{day.temperature}°C</div>
                <div class="text-xs text-center text-gray-600 capitalize">
                  {day.description}
                </div>
              </div>
            {/each}
          </div>
        </div>

        <!-- Today's Highlights -->
        <div class="bg-white rounded-2xl shadow-md p-6 lg:col-span-3">
          <h2 class="text-lg font-semibold mb-4">Today's Highlights</h2>
          <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <!-- Air Quality -->
            <div class="bg-blue-50 rounded-xl p-4">
              <h3 class="text-gray-500 text-sm mb-2">Air Quality</h3>
              <div class="flex items-center justify-between">
                <div>
                  <div class="text-2xl font-bold">
                    {processedData.highlights.airQuality.value}
                  </div>
                  <div class="mt-1">
                    <span
                      class={`px-2 py-1 rounded-full text-white text-xs ${getAirQualityColor(processedData.highlights.airQuality.category)}`}
                    >
                      {processedData.highlights.airQuality.category}
                    </span>
                  </div>
                </div>
                <div class="text-xs grid grid-cols-2 gap-x-4 gap-y-1">
                  <span
                    >PM2.5: {processedData.highlights.airQuality.components
                      .pm2_5}</span
                  >
                  <span
                    >SO2: {processedData.highlights.airQuality.components
                      .so2}</span
                  >
                  <span
                    >NO2: {processedData.highlights.airQuality.components
                      .no2}</span
                  >
                  <span
                    >O3: {processedData.highlights.airQuality.components
                      .o3}</span
                  >
                </div>
              </div>
            </div>

            <!-- Sunrise & Sunset -->
            <div class="bg-blue-50 rounded-xl p-4">
              <h3 class="text-gray-500 text-sm mb-2">Sunrise & Sunset</h3>
              <div class="flex justify-between items-center">
                <div class="flex flex-col items-center">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    class="h-8 w-8 text-yellow-500"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"
                    />
                  </svg>
                  <div class="text-sm font-medium mt-1">Sunrise</div>
                  <div class="text-lg font-semibold">
                    {processedData.highlights.sunTime.sunrise}
                  </div>
                </div>
                <div class="flex flex-col items-center">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    class="h-8 w-8 text-orange-500"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2M12 3a4 4 0 100 8 4 4 0 000-8z"
                    />
                  </svg>
                  <div class="text-sm font-medium mt-1">Sunset</div>
                  <div class="text-lg font-semibold">
                    {processedData.highlights.sunTime.sunset}
                  </div>
                </div>
              </div>
            </div>

            <!-- Humidity -->
            <div class="bg-blue-50 rounded-xl p-4">
              <h3 class="text-gray-500 text-sm mb-2">Humidity</h3>
              <div class="flex items-center">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  class="h-8 w-8 text-blue-500 mr-3"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"
                  />
                </svg>
                <div>
                  <div class="text-2xl font-bold">
                    {processedData.highlights.humidity.value}{processedData
                      .highlights.humidity.unit}
                  </div>
                  <div class="text-sm text-gray-600">
                    {processedData.highlights.humidity.value < 30
                      ? "Low"
                      : processedData.highlights.humidity.value < 60
                        ? "Moderate"
                        : "High"}
                  </div>
                </div>
              </div>
            </div>

            <!-- Pressure -->
            <div class="bg-blue-50 rounded-xl p-4">
              <h3 class="text-gray-500 text-sm mb-2">Pressure</h3>
              <div class="flex items-center">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  class="h-8 w-8 text-purple-500 mr-3"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                  />
                </svg>
                <div>
                  <div class="text-2xl font-bold">
                    {processedData.highlights.pressure.value}
                    {processedData.highlights.pressure.unit}
                  </div>
                  <div class="text-sm text-gray-600">
                    {processedData.highlights.pressure.value < 1000
                      ? "Low"
                      : processedData.highlights.pressure.value > 1015
                        ? "High"
                        : "Normal"}
                  </div>
                </div>
              </div>
            </div>

            <!-- Visibility -->
            <div class="bg-blue-50 rounded-xl p-4">
              <h3 class="text-gray-500 text-sm mb-2">Visibility</h3>
              <div class="flex items-center">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  class="h-8 w-8 text-teal-500 mr-3"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                  />
                </svg>
                <div>
                  <div class="text-2xl font-bold">
                    {processedData.highlights.visibility.value}
                    {processedData.highlights.visibility.unit}
                  </div>
                  <div class="text-sm text-gray-600">
                    {processedData.highlights.visibility.value < 5
                      ? "Poor"
                      : processedData.highlights.visibility.value < 8
                        ? "Moderate"
                        : "Good"}
                  </div>
                </div>
              </div>
            </div>

            <!-- Feels Like -->
            <div class="bg-blue-50 rounded-xl p-4">
              <h3 class="text-gray-500 text-sm mb-2">Feels Like</h3>
              <div class="flex items-center">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  class="h-8 w-8 text-red-500 mr-3"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"
                  />
                </svg>
                <div>
                  <div class="text-2xl font-bold">
                    {processedData.highlights.feelsLike.value}{processedData
                      .highlights.feelsLike.unit}
                  </div>
                  <div class="text-sm text-gray-600">
                    {processedData.highlights.feelsLike.value >
                    processedData.current.temperature
                      ? "Warmer than actual"
                      : processedData.highlights.feelsLike.value <
                          processedData.current.temperature
                        ? "Cooler than actual"
                        : "Same as actual"}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Hourly Forecast -->
        <div class="bg-white rounded-2xl shadow-md p-6 lg:col-span-3">
          <h2 class="text-lg font-semibold mb-4">Hourly Forecast</h2>

          <!-- Temperature -->
          <div class="mb-6">
            <h3 class="text-gray-500 text-sm mb-2">Temperature</h3>
            <div class="overflow-x-auto pb-2">
              <div class="flex space-x-4 min-w-max">
                {#each processedData.hourly.temperature as hour}
                  <div class="flex flex-col items-center">
                    <div class="text-sm">{hour.time}</div>
                    <img
                      src={getWeatherIconUrl(hour.icon)}
                      alt={hour.description}
                      class="w-10 h-10 my-1"
                    />
                    <div class="text-lg font-semibold">
                      {hour.temperature}°C
                    </div>
                  </div>
                {/each}
              </div>
            </div>
          </div>

          <!-- Wind -->
          <div>
            <h3 class="text-gray-500 text-sm mb-2">Wind</h3>
            <div class="overflow-x-auto pb-2">
              <div class="flex space-x-4 min-w-max">
                {#each processedData.hourly.wind as hour}
                  <div class="flex flex-col items-center">
                    <div class="text-sm">{hour.time}</div>
                    <div
                      class="relative my-1 w-10 h-10 flex items-center justify-center"
                    >
                      <div
                        class="absolute inset-0 flex items-center justify-center"
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          class="h-8 w-8 text-blue-400"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            stroke-linecap="round"
                            stroke-linejoin="round"
                            stroke-width="2"
                            d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
                          />
                        </svg>
                      </div>
                      <div class="text-xs mt-1 font-semibold z-10">
                        {getWindDirection(hour.direction)}
                      </div>
                    </div>
                    <div class="text-lg font-semibold">{hour.speed} km/h</div>
                  </div>
                {/each}
              </div>
            </div>
          </div>
        </div>
      </div>

      <footer class="mt-8 text-center text-sm text-gray-500">
        <p>
          Weather data last updated: {processedData.current.date}
          {processedData.current.weekday}
        </p>
        <p class="mt-1">© 2025 Weather App</p>
      </footer>
    {/if}
  </div>
</main>
