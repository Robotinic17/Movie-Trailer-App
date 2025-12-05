import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useFavorites } from "../context/FavoritesContext";
import { fetchFromTMDB } from "../api/tmdb";
import "./Recommendations.css";

export const Recommendations = ({ onMovieClick }) => {
  // ✅ Added onMovieClick prop
  const { favorites } = useFavorites();
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // ✅ ADDED: Handle movie click
  const handleMovieClick = (movieId) => {
    if (onMovieClick) {
      onMovieClick(movieId);
    }
  };

  // --- Stagger animation delay like MyList ---
  const calculateDelay = (index) => {
    const cardsPerRow = 5;
    const row = Math.floor(index / cardsPerRow);
    const pos = index % cardsPerRow;
    return row * 0.2 + pos * 0.05;
  };

  useEffect(() => {
    const getRecommendations = async () => {
      if (!favorites || favorites.length === 0) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError("");

        const allGenres = [];
        let hasTV = false;
        let hasKDrama = false;

        favorites.forEach((m) => {
          if (m.genre_ids && Array.isArray(m.genre_ids))
            allGenres.push(...m.genre_ids);
          if (m.media_type === "tv") hasTV = true;
          if (m.origin_country?.includes("KR")) hasKDrama = true;
        });

        const uniqueGenres = [
          ...new Set(allGenres.map((g) => Number(g))),
        ].filter(Boolean);

        const favoriteIds = favorites.map((f) => String(f.id));

        const endpointsToTry = [];

        if (hasTV) endpointsToTry.push("/trending/tv/week");
        if (hasKDrama)
          endpointsToTry.push("/discover/tv?with_origin_country=KR");

        if (uniqueGenres.length > 0) {
          const orQuery = uniqueGenres.join("|");
          endpointsToTry.push(
            `/discover/movie?with_genres=${orQuery}&sort_by=popularity.desc&vote_count.gte=10&page=1`
          );

          uniqueGenres.forEach((g) =>
            endpointsToTry.push(
              `/discover/movie?with_genres=${g}&sort_by=popularity.desc&vote_count.gte=10&page=1`
            )
          );
        }

        endpointsToTry.push("/movie/popular");
        endpointsToTry.push("/movie/top_rated");
        endpointsToTry.push("/trending/movie/week");

        let finalResults = [];

        for (const ep of endpointsToTry) {
          try {
            const data = await fetchFromTMDB(ep);
            const results = data?.results || [];

            const filtered = results.filter(
              (r) => !favoriteIds.includes(String(r.id))
            );

            finalResults = finalResults.concat(filtered);

            if (finalResults.length >= 36) break;
          } catch (err) {
            console.warn("Endpoint failed:", ep, err);
          }
        }

        // Dedupe
        const uniqueResults = [];
        const seenIds = new Set();
        for (const movie of finalResults) {
          if (!seenIds.has(movie.id)) {
            uniqueResults.push(movie);
            seenIds.add(movie.id);
          }
        }

        setRecommendations(uniqueResults.slice(0, 36));
      } catch (err) {
        console.error("Recommendations error:", err);
        setError("Failed to load recommendations");
      } finally {
        setLoading(false);
      }
    };

    getRecommendations();
  }, [favorites]);

  // ✅ ADDED: Scroll to top function
  const scrollToTop = () => {
    const element = document.getElementById("top-ac");
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <div className="recommendations" id="top-ac">
      <div className="recommendations-header">
        <h2>Recommended for You</h2>
        <p>Based on your saved favorites</p>
      </div>

      {loading && (
        <div className="loading-state">
          <div className="loading-spinner"></div>
          <p>Loading recommendations...</p>
        </div>
      )}

      {error && <p className="error-state">{error}</p>}

      {!loading && recommendations.length === 0 && (
        <div className="empty-state">
          <div className="empty-icon">🎬</div>
          <h3>Explore New Horizons!</h3>
          <p>No recommendations available yet.</p>
        </div>
      )}

      <div className="recommendations-grid-wrapper">
        <div className="recommendations-grid">
          {recommendations.map((movie, index) => (
            <motion.div
              key={movie.id}
              className="recommendation-card"
              initial={{ y: 40, opacity: 0, scale: 0.96 }}
              whileInView={{ y: 0, opacity: 1, scale: 1 }}
              viewport={{ once: true, amount: 0.1 }}
              transition={{
                delay: calculateDelay(index),
                duration: 0.7,
                ease: "easeOut",
              }}
              whileHover={{
                scale: 1.03,
                boxShadow: "0 10px 25px rgba(0,0,0,0.25)",
              }}
              onClick={() => handleMovieClick(movie.id)} // ✅ Added click handler
              style={{ cursor: "pointer" }} // ✅ Added cursor pointer
            >
              <img
                className="recommendation-poster"
                src={`https://image.tmdb.org/t/p/w500${movie.backdrop_path}`}
                alt={movie.title || movie.name}
              />
              <div className="recommendation-info">
                <p className="recommendation-title">
                  {movie.title || movie.name}
                </p>
                <p className="recommendation-year">
                  {movie.release_date?.slice(0, 4)}
                </p>
                <p className="recommendation-rating">
                  ⭐ {movie.vote_average?.toFixed(1)}
                </p>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Scroll to top */}
        <motion.a
          href="#top-ac"
          className="back-to-top-btn"
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
      </div>
    </div>
  );
};
