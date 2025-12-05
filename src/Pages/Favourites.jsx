import { FavHeader } from "../components/FavHeader";
import { motion, AnimatePresence } from "framer-motion";
import { MyList } from "../components/MyList";
import { WatchHistory } from "../components/WatchHistory";
import { Recommendations } from "../components/Recommendations";
import { MovieDetails } from "../components/MovieDetails"; // ✅ Import MovieDetails
import "./Favourites.css";
import { useState } from "react";

export const Favorites = () => {
  const [activeTab, setActiveTab] = useState("My List");

  // ✅ MOVIE DETAILS STATES
  const [isMovieDetailsActive, setIsMovieDetailsActive] = useState(false);
  const [selectedMovieId, setSelectedMovieId] = useState(null);

  // ✅ HANDLE MOVIE CLICKS
  const handleMovieClick = (movieId) => {
    setSelectedMovieId(movieId);
    setIsMovieDetailsActive(true);
  };

  // ✅ CLOSE MOVIE DETAILS
  const handleBackFromMovieDetails = () => {
    setIsMovieDetailsActive(false);
    setSelectedMovieId(null);
  };

  // Function to render the correct component based on active tab
  const renderActiveComponent = () => {
    switch (activeTab) {
      case "My List":
        return <MyList onMovieClick={handleMovieClick} />;
      case "Watch History":
        return <WatchHistory onMovieClick={handleMovieClick} />;
      case "Recommendations":
        return <Recommendations onMovieClick={handleMovieClick} />;
      default:
        return <MyList onMovieClick={handleMovieClick} />;
    }
  };

  return (
    <motion.div
      style={{
        width: "100%",
        height: "100%",
        overflow: "hidden",
      }}
    >
      <FavHeader activeTab={activeTab} setActiveTab={setActiveTab} />

      {/* ✅ MOVIE DETAILS OVERLAY */}
      <AnimatePresence mode="wait">
        {isMovieDetailsActive ? (
          <MovieDetails
            onBack={handleBackFromMovieDetails}
            movieId={selectedMovieId}
          />
        ) : (
          <section className="main-sec-1">{renderActiveComponent()}</section>
        )}
      </AnimatePresence>
    </motion.div>
  );
};
