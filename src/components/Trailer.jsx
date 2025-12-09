import "./Trailer.css";
import { useState, useEffect } from "react";
import { fetchFromTMDB } from "../api/tmdb";
import { auth } from "../firebase/config";

export const Trailer = ({ activeCategory = "Movies", onMovieClick }) => {
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState("Today");
  const [trailers, setTrailers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [movieMediaTypes, setMovieMediaTypes] = useState({});

  // Fetch trailers based on active category
  useEffect(() => {
    const fetchTrailers = async () => {
      setLoading(true);
      setError(null);

      try {
        let endpoint = "";
        let mediaType = "movie"; // ✅ Default media type

        if (activeCategory === "TV Series") {
          endpoint = "/trending/tv/week";
          mediaType = "tv"; // ✅ Set to tv
        } else if (activeCategory === "Animation") {
          endpoint = "/discover/movie?with_genres=16";
        } else if (activeCategory === "Mystery") {
          endpoint = "/discover/movie?with_genres=9648";
        } else if (activeCategory === "K-Drama") {
          endpoint = "/discover/tv?with_origin_country=KR";
          mediaType = "tv"; // ✅ Set to tv
        } else {
          endpoint = "/trending/movie/week";
        }

        const currentUser = auth.currentUser;
        const userPreferences = JSON.parse(
          localStorage.getItem(`userPreferences_${currentUser?.uid}`)
        ) || { adultContent: false };

        const data = await fetchFromTMDB(endpoint, {
          includeAdult: userPreferences.adultContent,
        });

        if (data && data.results) {
          const formattedTrailers = data.results.slice(0, 15).map((item) => ({
            id: item.id,
            title: item.title || item.name,
            genre: getGenres(item.genre_ids),
            image: item.backdrop_path
              ? `https://image.tmdb.org/t/p/w500${item.backdrop_path}`
              : item.poster_path
              ? `https://image.tmdb.org/t/p/w500${item.poster_path}`
              : "/fallback-image.jpg",
            mediaType: item.media_type || mediaType, // ✅ Use item's media_type or default
          }));

          setTrailers(formattedTrailers);

          // ✅ Store media types in state
          const types = {};
          formattedTrailers.forEach((t) => {
            types[t.id] = t.mediaType;
          });
          setMovieMediaTypes(types);
        } else {
          setError("No data received");
        }
      } catch (error) {
        setError("Failed to load trailers");
        console.error("Error fetching trailers:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchTrailers();
  }, [activeCategory, selected]);
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

  const handleSelect = (option) => {
    setSelected(option.trim());
    setOpen(false);
  };

  // Handle movie click
  const handleTrailerClick = (movieId) => {
    if (onMovieClick) {
      const mediaType = movieMediaTypes[movieId] || "movie"; // ✅ Get stored media type
      onMovieClick(movieId, mediaType);
    }
  };

  // === LOADING STATE ===
  if (loading) {
    return (
      <section className="new-trailers">
        <div className="section-header">
          <h2>🔥 New Trailers</h2>
          <div className="sort-dropdown">
            <p>Sort by:</p>
            <div className="drop-click">
              <p>{selected}</p>
              <i className="fa-solid fa-sort"></i>
            </div>
          </div>
        </div>
        <div className="loading-trailers">
          <i className="fa-solid fa-spinner fa-spin"></i>
          <p>Loading {activeCategory?.toLowerCase() || "movies"} trailers...</p>
        </div>
      </section>
    );
  }

  // === ERROR STATE ===
  if (error) {
    return (
      <section className="new-trailers">
        <div className="section-header">
          <h2>🔥 New Trailers</h2>
        </div>
        <div className="error-trailers">
          <i className="fa-solid fa-wifi-slash"></i>
          <p>{error}</p>
          <p className="error-subtext">Check your connection and try again</p>
        </div>
      </section>
    );
  }

  // === MAIN CONTENT ===
  return (
    <section className="new-trailers">
      <div className="section-header">
        <h2>🔥 New Trailers</h2>
        <div className="sort-dropdown">
          <p>Sort by:</p>
          <div className="drop-click" onClick={() => setOpen(!open)}>
            <p>{selected}</p>
            <i className="fa-solid fa-sort"></i>
          </div>
          {open && (
            <ul className="drop-menu">
              {["Today", "Week", "Month"].map((option) => (
                <li key={option} onClick={() => handleSelect(option)}>
                  ✨ {option}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <div className="trailer-grid">
        {trailers.map((trailer) => (
          <div
            key={trailer.id}
            className="trailer-card"
            style={{
              backgroundImage: `url(${trailer.image})`,
              cursor: "pointer",
            }}
            onClick={() => handleTrailerClick(trailer.id)}
          >
            <i className="fa-solid fa-play play-btn"></i>
            <div className="trailer-info">
              <h3>{trailer.title}</h3>
              <p>{trailer.genre}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};
