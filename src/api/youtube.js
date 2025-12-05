const YOUTUBE_API_BASE = "https://www.googleapis.com/youtube/v3";

export const searchYouTubeVideos = async (query, options = {}) => {
  const API_KEY = import.meta.env.VITE_YOUTUBE_API_KEY;

  try {
    const params = new URLSearchParams({
      part: "snippet",
      q: query,
      type: "video",
      videoEmbeddable: "true",
      maxResults: options.maxResults || 10,
      key: API_KEY,
    });

    // Add optional parameters
    if (options.videoDuration)
      params.append("videoDuration", options.videoDuration);
    if (options.order) params.append("order", options.order);

    const response = await fetch(`${YOUTUBE_API_BASE}/search?${params}`);

    if (!response.ok) throw new Error(`YouTube API error: ${response.status}`);

    const data = await response.json();
    return data.items || [];
  } catch (error) {
    console.error("YouTube API error:", error);
    return [];
  }
};

// Specific search for full movies
export const searchFullMovies = async (movieTitle, year = null) => {
  const searchQueries = [
    `${movieTitle} ${year} full movie`,
    `${movieTitle} full movie`,
    `${movieTitle} ${year} free movie`,
    `${movieTitle} free movie`,
  ];

  const allResults = [];

  for (const query of searchQueries) {
    const results = await searchYouTubeVideos(query, {
      maxResults: 5,
      videoDuration: "long", // Only longer videos (likely full movies)
      order: "relevance",
    });
    allResults.push(...results);
  }

  // Remove duplicates and return
  const uniqueResults = allResults.filter(
    (video, index, self) =>
      index === self.findIndex((v) => v.id.videoId === video.id.videoId)
  );

  return uniqueResults.slice(0, 15); // Return top 15 unique results
};
