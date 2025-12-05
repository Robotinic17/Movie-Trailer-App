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

const FavoritesContext = createContext();

export const FavoritesProvider = ({ children }) => {
  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading] = useState(true);

  // Fetch favorites from Firestore when user logs in
  useEffect(() => {
    if (!auth.currentUser) {
      setFavorites([]);
      setLoading(false);
      return;
    }

    const q = query(
      collection(db, "favorites"),
      where("userId", "==", auth.currentUser.uid)
    );

    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const favoritesList = [];
      querySnapshot.forEach((doc) => {
        favoritesList.push({ id: doc.id, ...doc.data() });
      });
      setFavorites(favoritesList);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Add to favorites (persist to Firestore)
  const addToFavorites = async (movie) => {
    if (!auth.currentUser) return;

    try {
      await addDoc(collection(db, "favorites"), {
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
      console.error("Error adding to favorites:", error);
    }
  };

  // Remove from favorites (delete from Firestore)
  const removeFromFavorites = async (favoriteId) => {
    try {
      await deleteDoc(doc(db, "favorites", favoriteId));
    } catch (error) {
      console.error("Error removing from favorites:", error);
    }
  };

  // Clear ALL favorites from Firestore
  const clearFavorites = async () => {
    if (!auth.currentUser) return;

    try {
      const q = query(
        collection(db, "favorites"),
        where("userId", "==", auth.currentUser.uid)
      );

      const querySnapshot = await getDocs(q);
      const deletePromises = querySnapshot.docs.map((doc) =>
        deleteDoc(doc.ref)
      );

      await Promise.all(deletePromises);
      setFavorites([]); // Clear local state immediately
    } catch (error) {
      console.error("Error clearing favorites:", error);
      throw error;
    }
  };

  // Check if movie is in favorites
  const isFavorite = (movieId) => {
    return favorites.some((fav) => fav.movieId === movieId);
  };

  return (
    <FavoritesContext.Provider
      value={{
        favorites,
        addToFavorites,
        removeFromFavorites,
        clearFavorites, // ADDED THIS
        isFavorite,
        loading,
      }}
    >
      {children}
    </FavoritesContext.Provider>
  );
};

export const useFavorites = () => useContext(FavoritesContext);
