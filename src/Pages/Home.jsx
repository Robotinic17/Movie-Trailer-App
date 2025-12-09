import { useState, useEffect } from "react";
import { Header } from "../components/Header";
import { Trailer } from "../components/Trailer";
import { Trending } from "../components/Trending";
import { Watchlist } from "../components/Watchlist";
import { YouMightLike } from "../components/YouMightLike";
import { Search } from "../components/search";
import { MovieDetails } from "../components/MovieDetails";
import { motion, AnimatePresence } from "framer-motion";
import { fetchFromTMDB } from "../api/tmdb";
import "./home.css";

export const Home = ({ activeCategory, setActiveCategory, user }) => {
  const [trendingData, setTrendingData] = useState([]);
  const [isSearchActive, setIsSearchActive] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // Movie Details States
  const [isMovieDetailsActive, setIsMovieDetailsActive] = useState(false);
  const [selectedMovieId, setSelectedMovieId] = useState(null);
  const [selectedMediaType, setSelectedMediaType] = useState("movie"); // ✅ NEW STATE

  // Remove duplicate movies function
  const removeDuplicateMovies = (movies) => {
    const seen = new Set();
    return movies.filter((movie) => {
      if (seen.has(movie.id)) {
        return false;
      }
      seen.add(movie.id);
      return true;
    });
  };

  useEffect(() => {
    const getData = async () => {
      let endpoint = "/trending/movie/week";

      if (activeCategory === "TV Series") endpoint = "/trending/tv/week";
      else if (activeCategory === "Animation")
        endpoint = "/discover/movie?with_genres=16";
      else if (activeCategory === "Mystery")
        endpoint = "/discover/movie?with_genres=9648";
      else if (activeCategory === "K-Drama")
        endpoint = "/discover/tv?with_origin_country=KR";

      const data = await fetchFromTMDB(endpoint);
      const uniqueMovies = removeDuplicateMovies(data?.results || []);
      setTrendingData(uniqueMovies);
    };

    getData();
  }, [activeCategory]);

  // Function to handle going back from search
  const handleBackFromSearch = () => {
    setIsSearchActive(false);
    setSearchQuery("");
  };

  // ✅ FIXED: Handle movie clicks from search and other components
  const handleMovieClick = (movieId, mediaType = "movie") => {
    setIsSearchActive(false);
    setSelectedMovieId(movieId);
    setSelectedMediaType(mediaType); // ✅ Store media type
    setIsMovieDetailsActive(true);
  };

  // Function to close movie details
  const handleBackFromMovieDetails = () => {
    setIsMovieDetailsActive(false);
    setSelectedMovieId(null);
    setSelectedMediaType("movie"); // ✅ Reset media type
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 40, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -40, scale: 0.98 }}
      transition={{
        duration: 0.8,
        ease: [0.25, 0.1, 0.25, 1],
      }}
      style={{
        width: "100%",
        height: "100%",
        overflow: "hidden",
      }}
    >
      <Header
        setActiveCategory={setActiveCategory}
        activeCategory={activeCategory}
        user={user}
        isSearchActive={isSearchActive}
        setIsSearchActive={setIsSearchActive}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
      />

      <AnimatePresence mode="wait">
        {isSearchActive ? (
          <Search
            onBack={handleBackFromSearch}
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            onMovieClick={handleMovieClick}
          />
        ) : isMovieDetailsActive ? (
          <MovieDetails
            onBack={handleBackFromMovieDetails}
            movieId={selectedMovieId}
            mediaType={selectedMediaType} // ✅ PASS MEDIA TYPE
          />
        ) : (
          <motion.section
            key="home-content"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            className="main-sec"
          >
            <div className="content-grid">
              <Trailer
                activeCategory={activeCategory}
                onMovieClick={handleMovieClick}
              />
              <Trending
                activeCategory={activeCategory}
                movies={trendingData}
                onMovieClick={handleMovieClick}
              />
            </div>

            <div className="content-grid">
              <Watchlist onMovieClick={handleMovieClick} />
              <YouMightLike
                activeCategory={activeCategory}
                onMovieClick={handleMovieClick}
              />
            </div>
          </motion.section>
        )}
      </AnimatePresence>
    </motion.div>
  );
};
