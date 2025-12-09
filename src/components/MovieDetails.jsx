import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect } from "react";
import "./MovieDetails.css";
import { useWatchlist } from "../context/WatchlistContext";
import { useFavorites } from "../context/FavoritesContext";
import { searchFullMovies } from "../api/youtube";

export const MovieDetails = ({ onBack, movieId, mediaType = "movie" }) => {
  const [movieData, setMovieData] = useState(null);
  const [trailers, setTrailers] = useState([]);
  const [cast, setCast] = useState([]);
  const [selectedTrailer, setSelectedTrailer] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("about");

  const [fullMovies, setFullMovies] = useState([]);
  const [selectedFullMovie, setSelectedFullMovie] = useState(null);
  const [loadingFullMovies, setLoadingFullMovies] = useState(false);

  const [localWatchlist, setLocalWatchlist] = useState(false);
  const [localFavorites, setLocalFavorites] = useState(false);

  const watchlistContext = useWatchlist();
  const favoritesContext = useFavorites();

  const watchlist = watchlistContext?.watchlist || [];
  const favorites = favoritesContext?.favorites || [];

  const isInWatchlist = watchlist.some((item) => item.movieId === movieId);
  const isInFavorites = favorites.some((item) => item.movieId === movieId);

  useEffect(() => {
    if (movieData) {
      setLocalWatchlist(isInWatchlist);
      setLocalFavorites(isInFavorites);
    }
  }, [movieData, isInWatchlist, isInFavorites]);

  // Fetch full movies when watch tab is active
  useEffect(() => {
    const controller = new AbortController();

    const fetchFullMovies = async () => {
      if (activeTab === "watch" && movieData && fullMovies.length === 0) {
        setLoadingFullMovies(true);
        try {
          const year =
            movieData.release_date?.split("-")[0] ||
            movieData.first_air_date?.split("-")[0];
          const title = movieData.title || movieData.name;
          const movies = await searchFullMovies(title, year, controller.signal);

          if (!controller.signal.aborted) {
            setFullMovies(movies);
            if (movies.length > 0) {
              setSelectedFullMovie(movies[0]);
            }
          }
        } catch (error) {
          if (error.name !== "AbortError") {
            console.error("Error fetching full movies:", error);
          }
        } finally {
          if (!controller.signal.aborted) {
            setLoadingFullMovies(false);
          }
        }
      }
    };

    fetchFullMovies();

    return () => controller.abort();
  }, [activeTab, movieData, fullMovies.length]);

  const handleWatchlistToggle = () => {
    setLocalWatchlist(!localWatchlist);
  };

  const handleFavoriteToggle = () => {
    setLocalFavorites(!localFavorites);
  };

  const handleWatchTrailer = () => {
    setActiveTab("trailers");
  };

  // ✅ FIXED: Fetch movie details with correct endpoint based on mediaType
  useEffect(() => {
    const controller = new AbortController();

    const fetchMovieData = async () => {
      if (!movieId) return;

      // Clear old data immediately
      setMovieData(null);
      setTrailers([]);
      setCast([]);
      setSelectedTrailer(null);
      setFullMovies([]);
      setSelectedFullMovie(null);
      setActiveTab("about");

      setLoading(true);

      try {
        // ✅ FIXED: Use correct endpoint based on mediaType
        const endpoint = mediaType === "tv" ? "tv" : "movie";

        // Fetch main data
        const movieResponse = await fetch(
          `https://api.themoviedb.org/3/${endpoint}/${movieId}?api_key=${
            import.meta.env.VITE_TMDB_API_KEY
          }&language=en-US`,
          { signal: controller.signal }
        );

        const movieData = await movieResponse.json();

        // ✅ FIXED: Fetch videos with correct endpoint
        const videosResponse = await fetch(
          `https://api.themoviedb.org/3/${endpoint}/${movieId}/videos?api_key=${
            import.meta.env.VITE_TMDB_API_KEY
          }&language=en-US`,
          { signal: controller.signal }
        );
        const videosData = await videosResponse.json();

        // ✅ FIXED: Fetch credits with correct endpoint
        const creditsResponse = await fetch(
          `https://api.themoviedb.org/3/${endpoint}/${movieId}/credits?api_key=${
            import.meta.env.VITE_TMDB_API_KEY
          }&language=en-US`,
          { signal: controller.signal }
        );
        const creditsData = await creditsResponse.json();

        const youtubeTrailers =
          videosData.results?.filter(
            (video) => video.site === "YouTube" && video.type === "Trailer"
          ) || [];

        const topCast = creditsData.cast?.slice(0, 12) || [];

        if (!controller.signal.aborted) {
          setMovieData(movieData);
          setTrailers(youtubeTrailers);
          setCast(topCast);
          setSelectedTrailer(youtubeTrailers[0] || null);
        }
      } catch (error) {
        if (error.name !== "AbortError") {
          console.error("Error fetching movie data:", error);
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    };

    fetchMovieData();

    return () => controller.abort();
  }, [movieId, mediaType]); // ✅ Added mediaType to dependencies

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

  // ✅ FIXED: Handle both movie and TV show data structure
  const title = movieData.title || movieData.name;
  const releaseDate = movieData.release_date || movieData.first_air_date;
  const runtime =
    movieData.runtime ||
    (movieData.episode_run_time && movieData.episode_run_time[0]) ||
    "N/A";

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
              alt={title}
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
                {title}
              </motion.h1>

              <motion.div
                className="movie-details-meta"
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.4, duration: 0.5 }}
              >
                <span>{new Date(releaseDate).getFullYear()}</span>
                <span>•</span>
                <span>
                  {runtime} {mediaType === "tv" ? "min/ep" : "min"}
                </span>
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

        {/* Navigation Tabs */}
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
                  <span>{new Date(releaseDate).toLocaleDateString()}</span>
                </div>
                {mediaType === "movie" && (
                  <>
                    <div className="detail-item">
                      <strong>Budget</strong>
                      <span>
                        ${movieData.budget?.toLocaleString() || "N/A"}
                      </span>
                    </div>
                    <div className="detail-item">
                      <strong>Revenue</strong>
                      <span>
                        ${movieData.revenue?.toLocaleString() || "N/A"}
                      </span>
                    </div>
                  </>
                )}
                {mediaType === "tv" && (
                  <>
                    <div className="detail-item">
                      <strong>Seasons</strong>
                      <span>{movieData.number_of_seasons || "N/A"}</span>
                    </div>
                    <div className="detail-item">
                      <strong>Episodes</strong>
                      <span>{movieData.number_of_episodes || "N/A"}</span>
                    </div>
                  </>
                )}
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

          {activeTab === "watch" && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="tab-content"
            >
              <div className="watch-section">
                <h3>🎬 Watch Full {mediaType === "tv" ? "Series" : "Movie"}</h3>
                <p className="watch-description">
                  Browse legally available full{" "}
                  {mediaType === "tv" ? "shows" : "movies"} on YouTube
                </p>

                {loadingFullMovies ? (
                  <div className="loading-full-movies">
                    <i className="fa-solid fa-spinner fa-spin"></i>
                    <p>Searching for available content...</p>
                  </div>
                ) : fullMovies.length > 0 ? (
                  <>
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

                    <div className="movies-list">
                      <h4>Available Content</h4>
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
                    <h4>No Full Content Available</h4>
                    <p>
                      No legally available full{" "}
                      {mediaType === "tv" ? "shows" : "movies"} found for this
                      title on YouTube.
                    </p>
                    <p className="suggestion">
                      Try searching for "{title}" directly on YouTube.
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
