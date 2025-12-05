import { createContext, useContext, useState, useEffect } from "react";
import {
  collection,
  addDoc,
  deleteDoc,
  doc,
  onSnapshot,
  query,
  where,
  getDocs,
} from "firebase/firestore";
import { db, auth } from "../firebase/config";

const WatchlistContext = createContext();

export const WatchlistProvider = ({ children }) => {
  const [watchlist, setWatchlist] = useState([]);
  const [loading, setLoading] = useState(true);

  // Fetch watchlist from Firestore when user logs in
  useEffect(() => {
    if (!auth.currentUser) {
      setWatchlist([]);
      setLoading(false);
      return;
    }

    const q = query(
      collection(db, "watchlist"),
      where("userId", "==", auth.currentUser.uid)
    );

    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const watchlistItems = [];
      querySnapshot.forEach((doc) => {
        watchlistItems.push({ id: doc.id, ...doc.data() });
      });
      setWatchlist(watchlistItems);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Add to watchlist (persist to Firestore)
  const addToWatchlist = async (movie) => {
    if (!auth.currentUser) return;

    try {
      await addDoc(collection(db, "watchlist"), {
        userId: auth.currentUser.uid,
        movieId: movie.id,
        title: movie.title,
        poster_path: movie.poster_path,
        backdrop_path: movie.backdrop_path,
        type: movie.type,
        year: movie.year,
        genre_ids: movie.genre_ids,
        overview: movie.overview,
        vote_average: movie.vote_average,
        addedAt: new Date(),
      });
    } catch (error) {
      console.error("Error adding to watchlist:", error);
    }
  };

  // Remove from watchlist (delete from Firestore)
  const removeFromWatchlist = async (watchlistId) => {
    try {
      await deleteDoc(doc(db, "watchlist", watchlistId));
    } catch (error) {
      console.error("Error removing from watchlist:", error);
    }
  };

  // Clear ALL watchlist from Firestore
  const clearWatchlist = async () => {
    if (!auth.currentUser) return;

    try {
      const q = query(
        collection(db, "watchlist"),
        where("userId", "==", auth.currentUser.uid)
      );

      const querySnapshot = await getDocs(q);
      const deletePromises = querySnapshot.docs.map((doc) =>
        deleteDoc(doc.ref)
      );

      await Promise.all(deletePromises);
      setWatchlist([]); // Clear local state immediately
    } catch (error) {
      console.error("Error clearing watchlist:", error);
      throw error;
    }
  };

  // Check if movie is in watchlist
  const isInWatchlist = (movieId) => {
    return watchlist.some((item) => item.movieId === movieId);
  };

  return (
    <WatchlistContext.Provider
      value={{
        watchlist,
        addToWatchlist,
        removeFromWatchlist,
        clearWatchlist, // ADDED THIS
        isInWatchlist,
        loading,
      }}
    >
      {children}
    </WatchlistContext.Provider>
  );
};

export const useWatchlist = () => useContext(WatchlistContext);
