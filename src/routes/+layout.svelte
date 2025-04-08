<script>
  import { MediaQuery } from "svelte/reactivity";
  import { onMount } from "svelte";
  import { searchApi } from "../services/searchApi.js";
  import "../app.css";

  let { children } = $props();

  let loading = $state(false);
  let mobilescreen = new MediaQuery("(max-width: 550px)");
  let searchFocused = $state(false);
  let searchInput = $state(null);
  let searchQuery = $state("");
  let suggestions = $state([]);
  let selectedCity = $state(null);
  let showSuggestions = $state(false);
  let selectedIndex = $state(0);

  const apiKey = import.meta.env.VITE_OPEN_WEATHER_API_KEY;

  onMount(async () => {
    try {
      loading = true;
      const location = await searchApi.getCurrentLocation();
      selectedCity = location;
      dispatchCitySelectedEvent(location);
    } catch (error) {
      console.error("Error getting current location:", error);
    } finally {
      loading = false;
    }
  });

  function handleFocus() {
    searchFocused = true;
    showSuggestions = true;
  }

  function handleBlur() {
    setTimeout(() => {
      searchFocused = false;
      showSuggestions = false;
    }, 200);
  }

  function handleKeydown(event) {
    if (event.key === "Escape" && searchFocused) {
      searchFocused = false;
      showSuggestions = false;
      searchInput.blur();
    } else if (event.key === "Enter" && suggestions.length > 0) {
      selectCity(suggestions[selectedIndex]);
    } else if (event.key === "ArrowDown" && showSuggestions) {
      event.preventDefault();
      selectedIndex = (selectedIndex + 1) % suggestions.length;
    } else if (event.key === "ArrowUp" && showSuggestions) {
      event.preventDefault();
      selectedIndex =
        (selectedIndex - 1 + suggestions.length) % suggestions.length;
    }
  }

  let debounceTimer;
  async function handleSearchInput(event) {
    clearTimeout(debounceTimer);
    const query = event.target.value;
    searchQuery = query;

    if (query.length < 2) {
      suggestions = [];
      showSuggestions = false;
      return;
    }

    debounceTimer = setTimeout(async () => {
      loading = true;
      suggestions = await searchApi.getCitySuggestions(query, apiKey);
      loading = false;
      showSuggestions = suggestions.length > 0;
      selectedIndex = 0;
    }, 300);
  }

  function dispatchCitySelectedEvent(city) {
    const event = new CustomEvent("citySelected", {
      detail: city,
      bubbles: true,
      composed: true,
    });
    window.dispatchEvent(event);
  }

  function selectCity(city) {
    selectedCity = city;
    searchQuery = city.name;
    showSuggestions = false;
    searchFocused = false;

    dispatchCitySelectedEvent(city);
  }

  async function useCurrentLocation() {
    try {
      loading = true;
      const location = await searchApi.getCurrentLocation();
      selectedCity = location;
      searchQuery = location.name;
      dispatchCitySelectedEvent(location);
    } catch (error) {
      console.error("Error getting current location:", error);
    } finally {
      loading = false;
    }
  }
</script>

{#if searchFocused}
  <div
    class="fixed inset-0 backdrop-blur-md bg-black/5 z-10 transition-all duration-300"
  ></div>
{/if}

<header
  class="sticky top-0 px-4 py-3 backdrop-blur-sm border-black border-b-2 z-20"
>
  <nav class="flex justify-between flex-row items-center">
    <div class="flex items-center flex-row gap-2">
      <!-- Weather logo -->
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
      >
        <path d="M17.5 19H9a7 7 0 1 1 6.71-9h1.79a4.5 4.5 0 1 1 0 9Z" />
      </svg>
      <h1 class="text-md font-semibold">SkyCast</h1>
    </div>

    <!-- Search Bar -->
    {#if !mobilescreen.current}
      <!-- Desktop search -->
      <div
        class="flex items-center flex-row relative z-30 transition-all duration-300 ease-in-out"
        class:scale-container={searchFocused}
      >
        <input
          type="text"
          placeholder="Search city"
          class="pl-4 pr-10 py-2 rounded-md bg-slate-100 border border-gray-300 transition-all duration-300 ease-in-out w-full"
          bind:this={searchInput}
          bind:value={searchQuery}
          onfocus={handleFocus}
          onblur={handleBlur}
          onkeydown={handleKeydown}
          oninput={handleSearchInput}
        />

        <!-- Loading indicator or search button -->
        <div class="absolute right-3 transition-all duration-300">
          {#if loading}
            <svg
              id="Synchronize_Refresh_Arrow_1_24"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
              xmlns:xlink="http://www.w3.org/1999/xlink"
              ><rect
                width="24"
                height="24"
                stroke="none"
                fill="#000000"
                opacity="0"
              />

              <g transform="matrix(0.83 0 0 0.83 12 12)">
                <g style="">
                  <g transform="matrix(1 0 0 1 -8.25 -0.76)">
                    <path
                      style="stroke: rgb(0,0,0); stroke-width: 1; stroke-dasharray: none; stroke-linecap: round; stroke-dashoffset: 0; stroke-linejoin: round; stroke-miterlimit: 4; fill: none; fill-rule: nonzero; opacity: 1;"
                      transform=" translate(-3.75, -11.24)"
                      d="M 0.5 8.992 L 3.5 13.492 L 7 9.492"
                      stroke-linecap="round"
                    />
                  </g>
                  <g transform="matrix(1 0 0 1 1 0)">
                    <path
                      style="stroke: rgb(0,0,0); stroke-width: 1; stroke-dasharray: none; stroke-linecap: round; stroke-dashoffset: 0; stroke-linejoin: round; stroke-miterlimit: 4; fill: none; fill-rule: nonzero; opacity: 1;"
                      transform=" translate(-13, -12)"
                      d="M 13 21.5 C 18.246705123392537 21.5 22.5 17.246705123392537 22.5 12 C 22.5 6.7532948766074625 18.246705123392537 2.5 13 2.5 C 7.7532948766074625 2.5 3.5 6.753294876607461 3.5 11.999999999999998 L 3.5 13.494"
                      stroke-linecap="round"
                    />
                  </g>
                </g>
              </g>
            </svg>
          {:else}
            <button
              class="p-1 rounded-md transition-all duration-300"
              aria-label="search button"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
              >
                <circle cx="11" cy="11" r="8" />
                <path d="m21 21-4.3-4.3" />
              </svg>
            </button>
          {/if}
        </div>

        <!-- Suggestions dropdown with visual highlighting of keyboard selection -->
        {#if showSuggestions && suggestions.length > 0}
          <div
            class="absolute top-full left-0 right-0 mt-1 bg-white shadow-lg rounded-md max-h-64 overflow-y-auto z-40"
          >
            {#each suggestions as city, index}
              <button
                class="w-full text-left px-4 py-2 hover:bg-gray-100 border-b border-gray-100 last:border-0"
                class:bg-blue-100={index === selectedIndex}
                onclick={() => selectCity(city)}
              >
                {city.displayName}
              </button>
            {/each}
          </div>
        {/if}
      </div>
    {:else}
      <!-- Mobile search button that opens full-screen search -->
      <button onclick={handleFocus} class="p-2 rounded-md" aria-label="search">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
        >
          <circle cx="11" cy="11" r="8" />
          <path d="m21 21-4.3-4.3" />
        </svg>
      </button>
    {/if}
  </nav>

  <!-- Mobile full-screen search popup -->
  {#if mobilescreen.current && searchFocused}
    <div class="fixed inset-0 bg-white z-50 p-4">
      <div class="flex items-center gap-2 mb-4">
        <button
          aria-label="search"
          onclick={() => {
            searchFocused = false;
          }}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <path d="m18 6-12 12" />
            <path d="m6 6 12 12" />
          </svg>
        </button>
        <h2 class="text-lg font-medium">Search Location</h2>
      </div>

      <div class="relative top-2">
        <input
          type="text"
          placeholder="Search city"
          class="w-full pl-4 pr-10 py-3 rounded-md bg-gray-100 border border-gray-300"
          bind:value={searchQuery}
          onkeydown={handleKeydown}
          oninput={handleSearchInput}
        />

        {#if loading}
          <div class="absolute right-3 top-1/2 -translate-y-1/2 animate-spin">
            <svg
              id="Loading_24"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
              xmlns:xlink="http://www.w3.org/1999/xlink"
              ><rect
                width="24"
                height="24"
                stroke="none"
                fill="#000000"
                opacity="0"
              />

              <g transform="matrix(1 0 0 1 12 12)">
                <path
                  style="stroke: none; stroke-width: 1; stroke-dasharray: none; stroke-linecap: butt; stroke-dashoffset: 0; stroke-linejoin: miter; stroke-miterlimit: 4; fill: rgb(0,0,0); fill-rule: nonzero; opacity: 1;"
                  transform=" translate(-12, -11.99)"
                  d="M 4.069 11 C 4.564 7.06 7.928 4 12 4 C 16.072 4 19.436 7.0600000000000005 19.931 11 L 21.950000000000003 11 C 21.446 5.954 17.176 2 12 2 C 6.824000000000002 2 2.5540000000000003 5.954000000000001 2.051 11 L 4.069 11 z M 5.688 16.898 C 4.83 15.792 4.252 14.457 4.069 13 L 2.051 13 C 2.2510000000000003 15.008 3.055 16.837 4.268000000000001 18.317999999999998 L 5.688 16.898 z M 10.437 19.839 C 9.2 19.591 8.064 19.06 7.103 18.311 L 5.6819999999999995 19.732 C 6.9879999999999995 20.801 8.565 21.549 10.294 21.851 L 10.437 19.839 z M 15.13 19.351 C 14.294 19.708 13.385000000000002 19.927999999999997 12.432 19.98 L 12.289 21.986 C 13.661 21.947 14.959999999999999 21.622 16.14 21.083000000000002 L 15.13 19.351 z M 18.272 16.93 C 17.857999999999997 17.455 17.386 17.933 16.855999999999998 18.34 L 17.868 20.073999999999998 C 18.680999999999997 19.482999999999997 19.398999999999997 18.77 20.002 17.967 L 18.272 16.93 z"
                  stroke-linecap="round"
                />
              </g>
            </svg>
          </div>
        {/if}
      </div>

      <!-- Mobile suggestions list with visual highlighting of keyboard selection -->
      {#if suggestions.length > 0}
        <div class="mt-4">
          {#each suggestions as city, index}
            <button
              class="w-full text-left px-4 py-2 hover:bg-gray-100 border-b border-gray-100 last:border-0"
              class:bg-blue-100={index === selectedIndex}
              onclick={() => selectCity(city)}
            >
              {city.displayName}
            </button>
          {/each}
        </div>
      {:else if searchQuery.length > 1 && !loading}
        <div class="mt-4 text-center text-gray-500">
          No cities found. Try another search.
        </div>
      {/if}

      <!-- Current location button on mobile -->
      <button
        onclick={() => {
          useCurrentLocation();
          searchFocused = false;
        }}
        class="mt-4 flex items-center gap-2 w-full text-left px-4 py-3 hover:bg-gray-100 border border-gray-200 rounded-md"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
        >
          <circle cx="12" cy="12" r="10" />
          <path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20" />
          <path d="M2 12h20" />
        </svg>
        Use current location
      </button>
    </div>
  {/if}
</header>

{@render children()}

<style>
  .scale-container {
    transform: scale(1.05);
  }
</style>
