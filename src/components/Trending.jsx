import { useState, useEffect } from "react";
import { useWatchlist } from "../context/WatchlistContext";
import { useFavorites } from "../context/FavoritesContext";
import { fetchFromTMDB } from "../api/tmdb";
import { auth } from "../firebase/config"; // ✅ ADD THIS IMPORT
import "./Trending.css";

// Add this utility function at the top
const shortenDescription = (description, maxLength = 150) => {
  if (!description) return "No description available";
  if (description.length <= maxLength) return description;

  const shortened = description.substr(0, maxLength);
  const lastSpace = shortened.lastIndexOf(" ");

  return lastSpace > 0
    ? shortened.substr(0, lastSpace) + "..."
    : shortened + "...";
};

export const Trending = ({ activeCategory, movies, onMovieClick }) => {
  // ✅ Added onMovieClick prop
  const { watchlist, addToWatchlist, removeFromWatchlist, isInWatchlist } =
    useWatchlist();
  const { favorites, addToFavorites, removeFromFavorites, isFavorite } =
    useFavorites();

  const [genres, setGenres] = useState({});
  const [index, setIndex] = useState(0);
  const [textFade, setTextFade] = useState(false);

  // Fetch genres for both movies and TV
  useEffect(() => {
    const getGenres = async () => {
      // ✅ GET USER ADULT CONTENT PREFERENCE
      const currentUser = auth.currentUser;
      const userPreferences = JSON.parse(
        localStorage.getItem(`userPreferences_${currentUser?.uid}`)
      ) || { adultContent: false };

      const movieData = await fetchFromTMDB("/genre/movie/list", {
        includeAdult: userPreferences.adultContent, // ✅ PASS PREFERENCE
      });
      const tvData = await fetchFromTMDB("/genre/tv/list", {
        includeAdult: userPreferences.adultContent, // ✅ PASS PREFERENCE
      });

      const map = {};
      if (movieData?.genres)
        movieData.genres.forEach((g) => (map[g.id] = g.name));
      if (tvData?.genres) tvData.genres.forEach((g) => (map[g.id] = g.name));

      setGenres(map);
    };
    getGenres();
  }, []);

  // Reset index whenever category or movies change
  useEffect(() => {
    setIndex(0);
  }, [activeCategory, movies]);

  if (!movies || !movies.length)
    return (
      <div className="loading-spin">
        <i className="fa-solid fa-spinner fa-spin"></i>
        <span>Loading {activeCategory?.toLowerCase() || "movies"}...</span>
      </div>
    );

  const trendingMovie = movies[index];

  // FIX: Use name for TV shows, title for movies
  const movieTitle = trendingMovie.name || trendingMovie.title;
  const releaseYear =
    trendingMovie.first_air_date?.slice(0, 4) ||
    trendingMovie.release_date?.slice(0, 4) ||
    "----";

  // UPDATED: Use the new helper functions from contexts
  const isSaved = isInWatchlist(trendingMovie.id);
  const isLiked = isFavorite(trendingMovie.id);

  // FIXED: Create consistent movie item without the old 'image' field
  const createMovieItem = () => {
    return {
      id: trendingMovie.id,
      title: trendingMovie.title || trendingMovie.name,
      name: trendingMovie.name,
      // REMOVED: image field - we'll use poster_path and backdrop_path separately
      backdrop_path: trendingMovie.backdrop_path,
      poster_path: trendingMovie.poster_path,
      type: trendingMovie.title ? "movie" : "tv",
      year: releaseYear,
      genre_ids: trendingMovie.genre_ids,
      overview: trendingMovie.overview,
      vote_average: trendingMovie.vote_average,
      release_date: trendingMovie.release_date,
      first_air_date: trendingMovie.first_air_date,
    };
  };

  // UPDATED: Toggle watchlist (bookmark button)
  const toggleSave = () => {
    const watchlistItem = watchlist.find(
      (item) => item.movieId === trendingMovie.id
    );
    if (isSaved) {
      removeFromWatchlist(watchlistItem.id); // Use Firestore document ID
    } else {
      addToWatchlist(createMovieItem());
    }
  };

  // UPDATED: Toggle favorites (heart button)
  const toggleLike = () => {
    const favoriteItem = favorites.find(
      (fav) => fav.movieId === trendingMovie.id
    );
    if (isLiked) {
      removeFromFavorites(favoriteItem.id); // Use Firestore document ID
    } else {
      addToFavorites(createMovieItem());
    }
  };

  const handleNext = () => {
    setTextFade(true);
    setTimeout(() => {
      setIndex((prev) => (prev + 1) % movies.length);
      setTextFade(false);
    }, 300);
  };

  const handlePrev = () => {
    setTextFade(true);
    setTimeout(() => {
      setIndex((prev) => (prev - 1 + movies.length) % movies.length);
      setTextFade(false);
    }, 300);
  };

  // ✅ ADDED: Handle movie click
  const handleMovieClick = () => {
    if (onMovieClick) {
      onMovieClick(trendingMovie.id);
    }
  };

  const bgImage = `https://image.tmdb.org/t/p/w1280${trendingMovie.backdrop_path}`;
  const movieGenres =
    trendingMovie.genre_ids
      ?.map((id) => genres[id])
      .filter(Boolean)
      .slice(0, 2) || [];

  return (
    <section
      className="trending"
      style={{
        backgroundImage: `url(${bgImage})`,
        cursor: "pointer",
      }}
      onClick={handleMovieClick} // ✅ Added click handler to entire section
    >
      <div className="trending-grid">
        <div className={`first-grid ${textFade ? "text-fade" : ""}`}>
          <span>🔥 Now Trending</span>

          <div className="movieinfo">
            <div className="tags">
              {movieGenres.length > 0 && (
                <span className="genre">{movieGenres.join(", ")}</span>
              )}
              <span className="rating">
                ⭐ {trendingMovie.vote_average?.toFixed(1) || "N/A"}
              </span>
              <span className="year">{releaseYear}</span>
            </div>

            <h2 className="title">{movieTitle}</h2>

            <p className="desc">{shortenDescription(trendingMovie.overview)}</p>

            <div className="cta-buttons">
              <button className="primary">
                <i className="fa-solid fa-play"></i> Watch
              </button>

              <button
                className={`secondary ${isSaved ? "saved" : ""}`}
                onClick={(e) => {
                  e.stopPropagation(); // ✅ Prevent triggering movie click
                  toggleSave();
                }}
              >
                <i
                  className={`fa${isSaved ? "-solid" : "-regular"} fa-bookmark`}
                ></i>{" "}
                {isSaved ? "Saved" : "Save"}
              </button>

              <button
                className={`tertiary ${isLiked ? "liked" : ""}`}
                onClick={(e) => {
                  e.stopPropagation(); // ✅ Prevent triggering movie click
                  toggleLike();
                }}
              >
                <i className="fa-solid fa-heart"></i>
              </button>
            </div>
          </div>
        </div>

        <div className="second-grid">
          <button
            className="nav-btn prev"
            onClick={(e) => {
              e.stopPropagation(); // ✅ Prevent triggering movie click
              handlePrev();
            }}
          >
            <i className="fa-solid fa-chevron-left"></i>
          </button>
          <button
            className="nav-btn next"
            onClick={(e) => {
              e.stopPropagation(); // ✅ Prevent triggering movie click
              handleNext();
            }}
          >
            <i className="fa-solid fa-chevron-right"></i>
          </button>
        </div>
      </div>
    </section>
  );
};
