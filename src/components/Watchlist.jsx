import "./Watchlist.css";
import BG from "../assets/Bg.jpeg";
import { useWatchlist } from "../context/WatchlistContext";

export const Watchlist = ({ onMovieClick }) => {
  // ✅ Added onMovieClick prop
  const { watchlist, removeFromWatchlist } = useWatchlist();

  // ✅ ADDED: Handle movie click
  const handleMovieClick = (movieId) => {
    if (onMovieClick) {
      onMovieClick(movieId);
    }
  };

  return (
    <section className="watchlist-section">
      <div className="section-header">
        <h2>✨My Watchlist</h2>
      </div>

      {watchlist.length > 0 ? (
        <div className="watchlist-grid">
          {watchlist.map((movie) => (
            <div
              className="watch-card"
              key={movie.id}
              onClick={() => handleMovieClick(movie.movieId)} // ✅ Added click handler
              style={{ cursor: "pointer" }} // ✅ Added cursor pointer
            >
              <img
                src={
                  movie.backdrop_path
                    ? `https://image.tmdb.org/t/p/w300${movie.backdrop_path}`
                    : BG
                }
                alt={movie.title}
                onError={(e) => {
                  e.target.src = BG;
                }}
              />

              <div className="watch-info">
                <h4 className="movie-title">{movie.title}</h4>
              </div>
              <div className="saves">
                <button
                  className="remove-btn"
                  onClick={(e) => {
                    e.stopPropagation(); // ✅ Prevent triggering movie click
                    // Find the Firestore document ID to remove
                    const watchlistItem = watchlist.find(
                      (item) => item.movieId === movie.movieId
                    );
                    if (watchlistItem) {
                      removeFromWatchlist(watchlistItem.id);
                    }
                  }}
                >
                  ✕
                </button>
                <div className="book-fav">
                  <span>Saved</span>
                  <i className="fa-solid fa-heart"></i>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="empty-text">No movies yet... start adding some!🔥</p>
      )}
    </section>
  );
};
