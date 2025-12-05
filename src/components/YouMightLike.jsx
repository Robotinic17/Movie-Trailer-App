import "./YouMightLike.css";
import { useEffect, useState } from "react";
import { fetchFromTMDB } from "../api/tmdb";

export const YouMightLike = ({ activeCategory = "Movies", onMovieClick }) => {
  // ✅ Added onMovieClick prop
  const [suggestions, setSuggestions] = useState([]);
  const [isSpinning, setIsSpinning] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // ✅ ADDED: Handle movie click
  const handleMovieClick = (movieId) => {
    if (onMovieClick) {
      onMovieClick(movieId);
    }
  };

  // Fetch suggestions based on active category
  const fetchSuggestions = async () => {
    setLoading(true);
    setError(null);

    try {
      let endpoint = "";

      // Determine endpoint based on active category
      switch (activeCategory) {
        case "TV Series":
          endpoint = "/trending/tv/week";
          break;
        case "Animation":
          endpoint = "/discover/movie?with_genres=16";
          break;
        case "Mystery":
          endpoint = "/discover/movie?with_genres=9648";
          break;
        case "K-Drama":
          endpoint = "/discover/tv?with_origin_country=KR";
          break;
        default: // Movies
          endpoint = "/movie/popular";
          break;
      }

      const data = await fetchFromTMDB(endpoint);

      if (data && data.results) {
        const formattedSuggestions = data.results.slice(0, 12).map((item) => ({
          id: item.id,
          title: item.title || item.name,
          genre: getGenres(item.genre_ids),
          image: item.backdrop_path
            ? `https://image.tmdb.org/t/p/w500${item.backdrop_path}`
            : item.poster_path
            ? `https://image.tmdb.org/t/p/w500${item.poster_path}`
            : "/fallback-image.jpg",
        }));

        // Pick 4 random ones
        const shuffled = [...formattedSuggestions].sort(
          () => 0.5 - Math.random()
        );
        setSuggestions(shuffled.slice(0, 4));
      } else {
        setError("No data received");
      }
    } catch (error) {
      setError("Failed to load suggestions");
      console.error("Error fetching suggestions:", error);
    } finally {
      setLoading(false);
    }
  };

  // Simple genre mapping
  const getGenres = (genreIds) => {
    const genreMap = {
      28: "Action",
      12: "Adventure",
      16: "Animation",
      35: "Comedy",
      80: "Crime",
      18: "Drama",
      10751: "Family",
      14: "Fantasy",
      36: "History",
      27: "Horror",
      10402: "Music",
      9648: "Mystery",
      10749: "Romance",
      878: "Sci-Fi",
      10770: "TV Movie",
      53: "Thriller",
      10752: "War",
      37: "Western",
      10759: "Action & Adventure",
      10762: "Kids",
      10763: "News",
      10764: "Reality",
      10765: "Sci-Fi & Fantasy",
      10766: "Soap",
      10767: "Talk",
      10768: "War & Politics",
    };

    const genres = genreIds
      ?.slice(0, 2)
      .map((id) => genreMap[id] || "")
      .filter(Boolean);
    return genres.length > 0 ? genres.join(" · ") : "Entertainment";
  };

  // Shorten long titles
  const shortenTitle = (title, maxLength = 20) => {
    if (!title) return "Untitled";
    if (title.length <= maxLength) return title;
    return title.substr(0, maxLength).trim() + "...";
  };

  const handleRefresh = () => {
    setIsSpinning(true);
    fetchSuggestions();
    setTimeout(() => setIsSpinning(false), 500);
  };

  useEffect(() => {
    fetchSuggestions();

    // Refresh every 1 hour
    const interval = setInterval(() => {
      fetchSuggestions();
    }, 3600000);

    return () => clearInterval(interval);
  }, [activeCategory]); // Re-fetch when category changes

  // === LOADING STATE ===
  if (loading) {
    return (
      <section className="you-might-like">
        <div className="YML-header">
          <h2>You Might Also Like</h2>
          <button className="refresh-btn" disabled>
            <i className="fa-solid fa-rotate"></i> Refresh
          </button>
        </div>
        <div className="loading-suggestions">
          <i className="fa-solid fa-spinner fa-spin"></i>
          <p>Finding {activeCategory.toLowerCase()} suggestions...</p>
        </div>
      </section>
    );
  }

  // === ERROR STATE ===
  if (error) {
    return (
      <section className="you-might-like">
        <div className="YML-header">
          <h2>You Might Also Like</h2>
          <button onClick={handleRefresh} className="refresh-btn">
            <i className="fa-solid fa-rotate"></i> Try Again
          </button>
        </div>
        <div className="error-suggestions">
          <i className="fa-solid fa-triangle-exclamation"></i>
          <p>{error}</p>
        </div>
      </section>
    );
  }

  // === MAIN CONTENT ===
  return (
    <section className="you-might-like">
      <div className="YML-header">
        <h2>You Might Also Like</h2>
        <button onClick={handleRefresh} className="refresh-btn">
          <i className={`fa-solid fa-rotate ${isSpinning ? "spin" : ""}`}></i>{" "}
          Refresh
        </button>
      </div>

      <div className="suggestion-grid">
        {suggestions.map((movie, index) => (
          <div
            className="suggestion-card"
            key={movie.id || index}
            onClick={() => handleMovieClick(movie.id)} // ✅ Added click handler
            style={{ cursor: "pointer" }} // ✅ Added cursor pointer
          >
            <img src={movie.image} alt={movie.title} />
            <div className="suggestion-info">
              <span className="genre-tag">{movie.genre}</span>
              <h4 className="movie-title">{shortenTitle(movie.title)}</h4>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};
