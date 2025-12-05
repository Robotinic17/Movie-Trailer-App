import { motion, AnimatePresence } from "framer-motion";
import "./search.css";
import { useState, useEffect } from "react";
import { fetchFromTMDB } from "../api/tmdb";
import { auth } from "../firebase/config";

// Simplified ImageWithFallback that uses existing CSS
const ImageWithFallback = ({
  src,
  alt,
  className,
  fallbackText = "Poster Not Available",
}) => {
  const [imageError, setImageError] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);

  if (imageError || !src) {
    return (
      <motion.div
        className={`search-movie-poster search-image-fallback ${className}`}
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
      >
        <motion.div
          className="search-fallback-icon"
          animate={{
            rotate: [0, -5, 5, -5, 0],
          }}
          transition={{ duration: 2, replace: Infinity, ease: "easeInOut" }}
        >
          <i className="fa-solid fa-film"></i>
        </motion.div>
        <motion.p
          initial={{ opacity: 0, y: 5 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          {fallbackText}
        </motion.p>
        <div className="search-fallback-shimmer"></div>
      </motion.div>
    );
  }

  return (
    <motion.img
      src={src}
      alt={alt}
      className={`search-movie-poster ${className}`}
      onError={() => setImageError(true)}
      onLoad={() => setImageLoaded(true)}
      initial={{ opacity: 0 }}
      animate={{ opacity: imageLoaded ? 1 : 0 }}
      transition={{ duration: 0.3 }}
    />
  );
};

export const Search = ({
  onBack,
  searchQuery,
  setSearchQuery,
  onMovieClick,
}) => {
  const [searchResults, setSearchResults] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  const searchSuggestions = [
    "Avengers: Endgame",
    "Spider-Man: No Way Home",
    "The Batman",
    "Stranger Things",
    "Breaking Bad",
    "Game of Thrones",
    "Black Panther",
    "The Mandalorian",
  ];

  useEffect(() => {
    const searchMovies = async () => {
      if (searchQuery.trim().length > 0) {
        setIsLoading(true);
        setHasSearched(true);

        try {
          // ✅ FIXED: Get current user safely
          const currentUser = auth.currentUser;
          const userPreferences = JSON.parse(
            localStorage.getItem(`userPreferences_${currentUser?.uid}`)
          ) || { adultContent: false };

          const data = await fetchFromTMDB(
            `/search/multi?query=${encodeURIComponent(searchQuery)}`,
            { includeAdult: userPreferences.adultContent }
          );
          setSearchResults(data?.results || []);
        } catch (error) {
          console.error("Search error:", error);
          setSearchResults([]);
        } finally {
          setIsLoading(false);
        }
      } else {
        setSearchResults([]);
        setHasSearched(false);
      }
    };

    const timeoutId = setTimeout(searchMovies, 500);
    return () => clearTimeout(timeoutId);
  }, [searchQuery]);

  const formatMovieData = (item) => {
    let imageUrl = "";

    if (item.backdrop_path) {
      imageUrl = `https://image.tmdb.org/t/p/w780${item.backdrop_path}`;
    } else if (item.poster_path) {
      imageUrl = `https://image.tmdb.org/t/p/w500${item.poster_path}`;
    }

    return {
      id: item.id,
      title: item.title || item.name,
      year:
        new Date(item.release_date || item.first_air_date).getFullYear() ||
        "N/A",
      type: item.media_type === "tv" ? "TV Series" : "Movie",
      rating: item.vote_average ? item.vote_average.toFixed(1) : "N/A",
      image: imageUrl,
    };
  };

  const showSuggestions = searchQuery.length === 0;
  const showResults = searchQuery.length > 0 && hasSearched;

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key="search-page"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        transition={{ duration: 0.3, ease: "easeOut" }}
        className="search-page"
      >
        {/* Spectacular Glass Back Button */}
        <motion.button
          className="search-glass-back-button"
          onClick={onBack}
          initial={{ opacity: 0, x: -30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1, duration: 0.4 }}
          whileHover={{
            x: -3,
            scale: 1.01,
            backgroundColor: "var(--accent-color)",
          }}
          whileTap={{ scale: 0.95 }}
        >
          <motion.i
            className="fa-solid fa-chevron-left"
            animate={{ x: [0, -3, 0] }}
            transition={{ duration: 2, replace: Infinity, ease: "easeInOut" }}
          />
          <div className="search-button-shine"></div>
        </motion.button>

        {/* Search Suggestions */}
        <AnimatePresence>
          {showSuggestions && (
            <motion.div
              className="search-suggestions"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              <h3>Popular Searches</h3>
              <div className="search-suggestions-grid">
                {searchSuggestions.map((suggestion, index) => (
                  <motion.div
                    key={suggestion}
                    className="search-suggestion-item"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 + index * 0.05 }}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setSearchQuery(suggestion)}
                  >
                    {suggestion}
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Search Results */}
        <AnimatePresence>
          {showResults && (
            <motion.div
              className="search-results"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
            >
              <h3>
                {isLoading
                  ? "Searching..."
                  : `Search Results for "${searchQuery}"`}
              </h3>

              {isLoading ? (
                <div className="search-loading-state">
                  <motion.div
                    className="search-loading-spinner"
                    animate={{ rotate: 360 }}
                    transition={{
                      duration: 1,
                      replace: Infinity,
                      ease: "linear",
                    }}
                  >
                    <i className="fa-solid fa-spinner"></i>
                  </motion.div>
                  <p>Finding the best matches...</p>
                </div>
              ) : searchResults.length > 0 ? (
                <div className="search-list-card">
                  {searchResults
                    .filter((item) => item.media_type !== "person")
                    .slice(0, 20)
                    .map((item, index) => {
                      const movie = formatMovieData(item);
                      return (
                        <motion.div
                          key={movie.id}
                          className="search-movie-card"
                          initial={{ opacity: 0, scale: 0.9 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ delay: index * 0.05 }}
                          whileHover={{ y: -6, scale: 1.02 }}
                          onClick={() => {
                            if (onMovieClick) {
                              onMovieClick(item.id);
                            }
                          }}
                          style={{ cursor: "pointer" }}
                        >
                          <ImageWithFallback
                            src={movie.image}
                            alt={movie.title}
                            className="search-movie-poster"
                            fallbackText="Poster Not Available"
                          />
                          <div className="search-movie-info">
                            <h4 className="search-movie-title">
                              {movie.title}
                            </h4>
                            <p>
                              {movie.year} • {movie.type} • ⭐{movie.rating}
                            </p>
                          </div>
                        </motion.div>
                      );
                    })}
                </div>
              ) : (
                <motion.div
                  className="search-no-results"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.2 }}
                >
                  <i className="fa-solid fa-search"></i>
                  <h4>No results found for "{searchQuery}"</h4>
                  <p>Try different keywords or check the spelling</p>
                </motion.div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </AnimatePresence>
  );
};
