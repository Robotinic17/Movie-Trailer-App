import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect } from "react";
import "./MovieDetails.css";
import { useWatchlist } from "../context/WatchlistContext";
import { useFavorites } from "../context/FavoritesContext";
import { searchFullMovies } from "../api/youtube"; // ✅ ADD THIS IMPORT

export const MovieDetails = ({ onBack, movieId }) => {
  const [movieData, setMovieData] = useState(null);
  const [trailers, setTrailers] = useState([]);
  const [cast, setCast] = useState([]);
  const [selectedTrailer, setSelectedTrailer] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("about");

  // ✅ NEW STATES FOR WATCH TAB
  const [fullMovies, setFullMovies] = useState([]);
  const [selectedFullMovie, setSelectedFullMovie] = useState(null);
  const [loadingFullMovies, setLoadingFullMovies] = useState(false);

  // Local state for visual toggles
  const [localWatchlist, setLocalWatchlist] = useState(false);
  const [localFavorites, setLocalFavorites] = useState(false);

  // Get watchlist and favorites context with safety defaults
  const watchlistContext = useWatchlist();
  const favoritesContext = useFavorites();

  const watchlist = watchlistContext?.watchlist || [];
  const favorites = favoritesContext?.favorites || [];

  // Check if movie is already saved with safety checks
  const isInWatchlist = watchlist.some((item) => item.movieId === movieId);
  const isInFavorites = favorites.some((item) => item.movieId === movieId);

  // Initialize local state with real data
  useEffect(() => {
    if (movieData) {
      setLocalWatchlist(isInWatchlist);
      setLocalFavorites(isInFavorites);
    }
  }, [movieData, isInWatchlist, isInFavorites]);

  // ✅ NEW: FETCH FULL MOVIES WHEN WATCH TAB IS ACTIVE
  useEffect(() => {
    const fetchFullMovies = async () => {
      if (activeTab === "watch" && movieData && fullMovies.length === 0) {
        setLoadingFullMovies(true);
        try {
          const year = movieData.release_date?.split("-")[0];
          const movies = await searchFullMovies(movieData.title, year);
          setFullMovies(movies);
          if (movies.length > 0) {
            setSelectedFullMovie(movies[0]);
          }
        } catch (error) {
          console.error("Error fetching full movies:", error);
        } finally {
          setLoadingFullMovies(false);
        }
      }
    };

    fetchFullMovies();
  }, [activeTab, movieData, fullMovies.length]);

  // Simple toggle functions
  const handleWatchlistToggle = () => {
    setLocalWatchlist(!localWatchlist);
  };

  const handleFavoriteToggle = () => {
    setLocalFavorites(!localFavorites);
  };

  // Simple scroll to trailers section
  const handleWatchTrailer = () => {
    setActiveTab("trailers");
  };

  // Fetch movie details, trailers, and cast
  useEffect(() => {
    const fetchMovieData = async () => {
      if (!movieId) return;

      setLoading(true);
      try {
        // Try movie endpoint first
        let movieResponse = await fetch(
          `https://api.themoviedb.org/3/movie/${movieId}?api_key=${
            import.meta.env.VITE_TMDB_API_KEY
          }&language=en-US`
        );

        let movieData = await movieResponse.json();

        // If movie endpoint fails (TV show), try TV endpoint
        if (movieData.success === false) {
          movieResponse = await fetch(
            `https://api.themoviedb.org/3/tv/${movieId}?api_key=${
              import.meta.env.VITE_TMDB_API_KEY
            }&language=en-US`
          );
          movieData = await movieResponse.json();
        }

        // Fetch videos (works for both movies and TV)
        const videosResponse = await fetch(
          `https://api.themoviedb.org/3/movie/${movieId}/videos?api_key=${
            import.meta.env.VITE_TMDB_API_KEY
          }&language=en-US`
        );
        const videosData = await videosResponse.json();

        // Fetch credits (works for both movies and TV)
        const creditsResponse = await fetch(
          `https://api.themoviedb.org/3/movie/${movieId}/credits?api_key=${
            import.meta.env.VITE_TMDB_API_KEY
          }&language=en-US`
        );
        const creditsData = await creditsResponse.json();

        const youtubeTrailers =
          videosData.results?.filter(
            (video) => video.site === "YouTube" && video.type === "Trailer"
          ) || [];

        const topCast = creditsData.cast?.slice(0, 12) || [];

        setMovieData(movieData);
        setTrailers(youtubeTrailers);
        setCast(topCast);
        setSelectedTrailer(youtubeTrailers[0] || null);
      } catch (error) {
        console.error("Error fetching movie data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchMovieData();
  }, [movieId]);

  if (loading) {
    return (
      <div className="movie-details-loading">
        <div className="loading-spinner"></div>
        <p>Loading movie magic...</p>
      </div>
    );
  }

  if (!movieData) {
    return (
      <div className="movie-details-error">
        <h2>Movie Not Found</h2>
        <h2>Check Your Internet Connection</h2>
        <button onClick={onBack}>Go Back</button>
      </div>
    );
  }

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key="movie-details-page"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        transition={{ duration: 0.3, ease: "easeOut" }}
        className="movie-details-page"
      >
        {/* Back Button */}
        <motion.button
          className="movie-details-back-button"
          onClick={onBack}
          initial={{ opacity: 0, x: -30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1, duration: 0.4 }}
          whileHover={{ x: -3, scale: 1.01 }}
          whileTap={{ scale: 0.95 }}
        >
          <motion.i
            className="fa-solid fa-chevron-left"
            animate={{ x: [0, -3, 0] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          />
          <span>Back</span>
          <div className="movie-details-button-shine"></div>
        </motion.button>

        {/* Hero Section */}
        <div
          className="movie-details-hero"
          style={{
            backgroundImage: `linear-gradient(rgba(0,0,0,0.6), rgba(0,0,0,0.8)), url(https://image.tmdb.org/t/p/w1280${movieData.backdrop_path})`,
          }}
        >
          <div className="movie-details-hero-content">
            <motion.img
              src={`https://image.tmdb.org/t/p/w300${movieData.poster_path}`}
              alt={movieData.title}
              className="movie-details-poster"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.2, duration: 0.5 }}
            />

            <div className="movie-details-hero-info">
              <motion.h1
                initial={{ y: 30, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.3, duration: 0.5 }}
              >
                {movieData.title}
              </motion.h1>

              <motion.div
                className="movie-details-meta"
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.4, duration: 0.5 }}
              >
                <span>{new Date(movieData.release_date).getFullYear()}</span>
                <span>•</span>
                <span>{movieData.runtime} min</span>
                <span>•</span>
                <span className="rating">
                  ⭐ {movieData.vote_average?.toFixed(1)}
                </span>
              </motion.div>

              <motion.div
                className="movie-details-genres"
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.5, duration: 0.5 }}
              >
                {movieData.genres?.map((genre) => (
                  <span key={genre.id} className="movie-genre-tag">
                    {genre.name}
                  </span>
                ))}
              </motion.div>

              <motion.div
                className="movie-details-actions"
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.6, duration: 0.5 }}
              >
                <button
                  className="action-btn watch-trailer-btn"
                  onClick={handleWatchTrailer}
                >
                  <i className="fa-solid fa-play"></i>
                  Watch Trailer
                </button>

                <button
                  className={`action-btn watchlist-btn ${
                    localWatchlist ? "active" : ""
                  }`}
                  onClick={handleWatchlistToggle}
                >
                  <i
                    className={`fa-solid ${
                      localWatchlist ? "fa-check" : "fa-bookmark"
                    }`}
                  ></i>
                  {localWatchlist ? "In Watchlist" : "Watchlist"}
                </button>

                <button
                  className={`action-btn favorite-btn ${
                    localFavorites ? "active" : ""
                  }`}
                  onClick={handleFavoriteToggle}
                >
                  <i
                    className={`fa-solid ${
                      localFavorites ? "fa-heart-circle-check" : "fa-heart"
                    }`}
                  ></i>
                  {localFavorites ? "Favorited" : "Favorite"}
                </button>
              </motion.div>
            </div>
          </div>
        </div>

        {/* Navigation Tabs - UPDATED WITH WATCH TAB */}
        <motion.div
          className="movie-details-tabs"
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.7, duration: 0.5 }}
        >
          <button
            className={`tab-btn ${activeTab === "about" ? "active" : ""}`}
            onClick={() => setActiveTab("about")}
          >
            About
          </button>
          <button
            className={`tab-btn ${activeTab === "trailers" ? "active" : ""}`}
            onClick={() => setActiveTab("trailers")}
          >
            Trailers ({trailers.length})
          </button>
          <button
            className={`tab-btn ${activeTab === "cast" ? "active" : ""}`}
            onClick={() => setActiveTab("cast")}
          >
            Cast
          </button>
          {/* ✅ NEW WATCH TAB */}
          <button
            className={`tab-btn ${activeTab === "watch" ? "active" : ""}`}
            onClick={() => setActiveTab("watch")}
          >
            <i className="fa-solid fa-play-circle"></i> Watch
          </button>
        </motion.div>

        {/* Tab Content */}
        <div className="movie-details-content">
          {activeTab === "about" && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="tab-content"
            >
              <h3>Overview</h3>
              <p className="movie-overview">{movieData.overview}</p>

              <div className="movie-details-grid">
                <div className="detail-item">
                  <strong>Release Date</strong>
                  <span>
                    {new Date(movieData.release_date).toLocaleDateString()}
                  </span>
                </div>
                <div className="detail-item">
                  <strong>Budget</strong>
                  <span>${movieData.budget?.toLocaleString() || "N/A"}</span>
                </div>
                <div className="detail-item">
                  <strong>Revenue</strong>
                  <span>${movieData.revenue?.toLocaleString() || "N/A"}</span>
                </div>
                <div className="detail-item">
                  <strong>Status</strong>
                  <span>{movieData.status}</span>
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === "trailers" && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="tab-content"
            >
              <div className="trailers-section">
                {trailers.length > 0 ? (
                  <>
                    <div className="main-trailer-player">
                      <h3>Featured Trailer</h3>
                      <div className="trailer-video-container">
                        <iframe
                          src={`https://www.youtube.com/embed/${selectedTrailer?.key}`}
                          title={selectedTrailer?.name || "Movie Trailer"}
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                          allowFullScreen
                          className="trailer-iframe"
                        ></iframe>
                      </div>
                      <h4 className="trailer-title">{selectedTrailer?.name}</h4>
                    </div>

                    {trailers.length > 1 && (
                      <div className="trailer-thumbnails">
                        <h4>More Trailers & Clips</h4>
                        <div className="thumbnails-grid">
                          {trailers.map((trailer) => (
                            <motion.div
                              key={trailer.id}
                              className={`thumbnail-card ${
                                selectedTrailer?.id === trailer.id
                                  ? "active"
                                  : ""
                              }`}
                              onClick={() => setSelectedTrailer(trailer)}
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                            >
                              <div className="thumbnail-image">
                                <img
                                  src={`https://img.youtube.com/vi/${trailer.key}/hqdefault.jpg`}
                                  alt={trailer.name}
                                />
                                <div className="play-overlay">
                                  <i className="fa-solid fa-play"></i>
                                </div>
                              </div>
                              <p className="thumbnail-title">{trailer.name}</p>
                            </motion.div>
                          ))}
                        </div>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="no-trailers">
                    <i className="fa-solid fa-film"></i>
                    <h3>No Trailers Available</h3>
                    <p>Check back later for trailer updates</p>
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {activeTab === "cast" && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="tab-content"
            >
              <h3>Cast & Crew</h3>

              {cast.length > 0 ? (
                <div className="cast-grid">
                  {cast.map((person) => (
                    <motion.div
                      key={person.id}
                      className="cast-card"
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <img
                        src={
                          person.profile_path
                            ? `https://image.tmdb.org/t/p/w200${person.profile_path}`
                            : "/placeholder-actor.jpg"
                        }
                        alt={person.name}
                        className="cast-photo"
                        onError={(e) => {
                          e.target.src =
                            "https://via.placeholder.com/200x300/333/fff?text=No+Image";
                        }}
                      />
                      <div className="cast-info">
                        <h4 className="cast-name">{person.name}</h4>
                        <p className="cast-character">{person.character}</p>
                      </div>
                    </motion.div>
                  ))}
                </div>
              ) : (
                <div className="no-cast">
                  <i className="fa-solid fa-users"></i>
                  <h4>No Cast Information</h4>
                  <p>Cast details not available for this movie</p>
                </div>
              )}
            </motion.div>
          )}

          {/* ✅ NEW WATCH TAB CONTENT */}
          {activeTab === "watch" && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="tab-content"
            >
              <div className="watch-section">
                <h3>🎬 Watch Full Movie</h3>
                <p className="watch-description">
                  Browse legally available full movies on YouTube
                </p>

                {loadingFullMovies ? (
                  <div className="loading-full-movies">
                    <i className="fa-solid fa-spinner fa-spin"></i>
                    <p>Searching for available movies...</p>
                  </div>
                ) : fullMovies.length > 0 ? (
                  <>
                    {/* Main Video Player */}
                    <div className="main-movie-player">
                      <div className="video-container">
                        <iframe
                          width="100%"
                          height="400"
                          src={`https://www.youtube.com/embed/${selectedFullMovie?.id.videoId}`}
                          title={selectedFullMovie?.snippet.title}
                          frameBorder="0"
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                          allowFullScreen
                        ></iframe>
                      </div>
                      <h4 className="detail-movie-title">
                        {selectedFullMovie?.snippet.title}
                      </h4>
                      <p className="movie-channel">
                        {selectedFullMovie?.snippet.channelTitle}
                      </p>
                    </div>

                    {/* Movie List */}
                    <div className="movies-list">
                      <h4>Available Movies</h4>
                      <div className="movies-grid">
                        {fullMovies.map((movie) => (
                          <div
                            key={movie.id.videoId}
                            className={`movie-thumbnail ${
                              selectedFullMovie?.id.videoId === movie.id.videoId
                                ? "active"
                                : ""
                            }`}
                            onClick={() => setSelectedFullMovie(movie)}
                          >
                            <img
                              src={movie.snippet.thumbnails.medium.url}
                              alt={movie.snippet.title}
                            />
                            <div className="movie-info">
                              <h5>{movie.snippet.title}</h5>
                              <p>{movie.snippet.channelTitle}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="no-full-movies">
                    <i className="fa-solid fa-film"></i>
                    <h4>No Full Movies Available</h4>
                    <p>
                      No legally available full movies found for this title on
                      YouTube.
                    </p>
                    <p className="suggestion">
                      Try searching for "{movieData?.title}" directly on
                      YouTube.
                    </p>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  );
};
