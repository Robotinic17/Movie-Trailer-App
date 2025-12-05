import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { useWatchlist } from "../context/WatchlistContext";
import { useFavorites } from "../context/FavoritesContext";
import "./MyList.css";

export const MyList = ({ onMovieClick }) => {
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState("Date Added");
  const [activeFilter, setActiveFilter] = useState("All");

  const { watchlist, removeFromWatchlist } = useWatchlist();
  const { favorites, removeFromFavorites } = useFavorites();

  // Handle movie click for poster
  const handleMovieClick = (movieId) => {
    if (onMovieClick) {
      onMovieClick(movieId);
    }
  };

  // Handle watch trailer (same as movie click for now)
  const handleWatchTrailer = (movieId) => {
    if (onMovieClick) {
      onMovieClick(movieId);
    }
  };

  const handleSelect = (option) => {
    setSelected(option);
    setOpen(false);
  };

  // Combine watchlist and favorites (remove duplicates by movieId)
  const combinedList = [...watchlist, ...favorites].filter(
    (movie, index, self) =>
      index === self.findIndex((m) => m.movieId === movie.movieId)
  );

  // REAL SORTING AND FILTERING LOGIC
  const sortedAndFilteredList = useMemo(() => {
    let filtered = [...combinedList];

    // Apply filters
    if (activeFilter === "Movies") {
      filtered = filtered.filter((movie) => movie.type === "movie");
    } else if (activeFilter === "TV Series") {
      filtered = filtered.filter((movie) => movie.type === "tv");
    } else if (activeFilter === "Thrillers") {
      // Note: You'd need genre data for this to work properly
      filtered = filtered; // Placeholder - would filter by thriller genre
    }
    // "All" shows everything

    // Apply sorting
    switch (selected) {
      case "Date Added":
        // Sort by Firestore addedAt timestamp (newest first)
        filtered.sort(
          (a, b) =>
            new Date(b.addedAt?.toDate()) - new Date(a.addedAt?.toDate())
        );
        break;
      case "A-Z":
        filtered.sort((a, b) => a.title.localeCompare(b.title));
        break;
      case "Release Date":
        // Sort by year (newest first)
        filtered.sort((a, b) => parseInt(b.year) - parseInt(a.year));
        break;
      default:
        break;
    }

    return filtered;
  }, [combinedList, selected, activeFilter]);

  // UPDATED: Remove function that handles both watchlist and favorites
  const handleRemove = (movie) => {
    // Try to remove from favorites first
    const favoriteItem = favorites.find((fav) => fav.movieId === movie.movieId);
    if (favoriteItem) {
      removeFromFavorites(favoriteItem.id);
    }

    // Also try to remove from watchlist
    const watchlistItem = watchlist.find(
      (item) => item.movieId === movie.movieId
    );
    if (watchlistItem) {
      removeFromWatchlist(watchlistItem.id);
    }
  };

  // Scroll to top function
  const scrollToTop = () => {
    // Scroll the main content area (not the window)
    const mainElement = document.querySelector("main");
    if (mainElement) {
      mainElement.scrollTo({
        top: 0,
        behavior: "smooth",
      });
    } else {
      // Fallback to window scrolling
      window.scrollTo({
        top: 0,
        behavior: "smooth",
      });
    }
  };

  const filters = ["All", "Movies", "TV Series", "Thrillers"];

  // Calculate delay based on row position for scroll animation
  const calculateDelay = (index) => {
    const cardsPerRow = 5;
    const row = Math.floor(index / cardsPerRow);
    const positionInRow = index % cardsPerRow;
    return row * 0.2 + positionInRow * 0.05;
  };

  return (
    <motion.div
      className="mylist"
      id="top"
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
    >
      {/* Sort + Filter Section */}
      <motion.div
        className="sort-filter"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.6 }}
      >
        {/* Custom Dropdown */}
        <div className="sort-dropdown-alt">
          <p>Sort by:</p>
          <div className="drop-click-alt" onClick={() => setOpen(!open)}>
            <p>{selected}</p>
            <i className="fa-solid fa-sort"></i>
          </div>

          {open && (
            <ul className="drop-menu-alt">
              {["Date Added", "A-Z", "Release Date"].map((option) => (
                <li key={option} onClick={() => handleSelect(option)}>
                  ✨ {option}
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Filter Buttons */}
        <div className="filter-options">
          {filters.map((category) => (
            <motion.button
              key={category}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setActiveFilter(category)}
              className={
                activeFilter === category ? "filter-btn active" : "filter-btn"
              }
            >
              {category}
            </motion.button>
          ))}
        </div>
      </motion.div>
      {/* Cards with Scroll-Triggered Row Stagger */}
      <div className="list-card">
        {sortedAndFilteredList.length > 0 ? (
          sortedAndFilteredList.map((movie, index) => (
            <motion.div
              key={movie.movieId}
              className="movie-card"
              initial={{ y: 40, opacity: 0, scale: 0.96 }}
              whileInView={{ y: 0, opacity: 1, scale: 1 }}
              viewport={{ once: true, amount: 0.03 }}
              transition={{
                delay: calculateDelay(index),
                duration: 0.7,
                ease: "easeOut",
              }}
              whileHover={{
                scale: 1.03,
                boxShadow: "0 10px 25px rgba(0,0,0,0.25)",
              }}
            >
              <img
                src={
                  movie.backdrop_path
                    ? `https://image.tmdb.org/t/p/w300${movie.backdrop_path}`
                    : `https://image.tmdb.org/t/p/w300${movie.poster_path}`
                }
                alt={movie.title}
                className="movie-poster"
                onClick={() => handleMovieClick(movie.movieId)}
                style={{ cursor: "pointer" }}
                onError={(e) => {
                  e.target.src =
                    "https://via.placeholder.com/500x750/333/fff?text=No+Image";
                }}
              />
              <div className="movie-info">
                <h3 className="movie-title">{movie.title}</h3>
                <p className="movie-year">
                  {movie.year} • {movie.type || "Movie"}
                </p>
                <div className="movie-actions">
                  <button
                    className="btn btn-watch"
                    onClick={() => handleWatchTrailer(movie.movieId)}
                  >
                    Watch Trailer
                  </button>
                  <button
                    className="btn btn-remove"
                    onClick={() => handleRemove(movie)}
                  >
                    Remove
                  </button>
                </div>
              </div>
            </motion.div>
          ))
        ) : (
          <div className="empty-state">
            <div className="empty-icon">🎬</div>
            <h3>No movies found</h3>
            <p>
              Try changing your filters or add some movies to your collection
            </p>
          </div>
        )}
      </div>
      {sortedAndFilteredList.length > 0 && (
        <motion.a
          href="#top"
          className="scroll-to-top-btn"
          initial={{ opacity: 0, scale: 0 }}
          animate={{ opacity: 1, scale: 1 }}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          transition={{ duration: 0.3 }}
          onClick={(e) => {
            e.preventDefault();
            scrollToTop();
          }}
        >
          <i className="fa-solid fa-arrow-up"></i>
        </motion.a>
      )}
    </motion.div>
  );
};
