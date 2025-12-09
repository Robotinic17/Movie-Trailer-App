const API_BASE_URL = "https://api.themoviedb.org/3";

export const fetchFromTMDB = async (endpoint, options = {}) => {
  const API_KEY = import.meta.env.VITE_TMDB_API_KEY;

  // ✅ Get adult content preference (default to false for safety)
  const includeAdult = options.includeAdult || false;

  // ✅ FIXED: Extract abort signal from options
  const { signal } = options;

  try {
    // Fix: Check if endpoint already has '?' and use '&' instead
    const separator = endpoint.includes("?") ? "&" : "?";
    const url = `${API_BASE_URL}${endpoint}${separator}api_key=${API_KEY}&include_adult=${includeAdult}`;

    // ✅ FIXED: Pass abort signal to fetch
    const res = await fetch(url, { signal });

    if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
    return await res.json();
  } catch (error) {
    // ✅ FIXED: Don't log AbortError (expected when cancelling requests)
    if (error.name !== "AbortError") {
      console.error("TMDB API error:", error);
    }
    // Re-throw AbortError so component can handle it
    throw error;
  }
};
