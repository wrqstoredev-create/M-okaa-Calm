import React, { createContext, useContext, useState, useEffect } from 'react';

export interface FavoriteItem {
  id: string;
  title: string;
  price: number;
  old_price?: number | null;
  image_url?: string | null;
  image?: string | null;
  game_name?: string | null;
  robux_quantity?: number;
}

interface FavoritesContextType {
  favorites: FavoriteItem[];
  toggleFavorite: (product: any) => void;
  isFavorite: (productId: string) => boolean;
  removeFavorite: (productId: string) => void;
  clearFavorites: () => void;
  favoritesCount: number;
}

const FavoritesContext = createContext<FavoritesContextType | undefined>(undefined);

export function FavoritesProvider({ children }: { children: React.ReactNode }) {
  const [favorites, setFavorites] = useState<FavoriteItem[]>(() => {
    const saved = localStorage.getItem('favorites');
    try {
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    localStorage.setItem('favorites', JSON.stringify(favorites));
  }, [favorites]);

  const isFavorite = (productId: string) => {
    return favorites.some(item => item.id === productId);
  };

  const toggleFavorite = (product: any) => {
    if (!product || !product.id) return;
    
    setFavorites(current => {
      const exists = current.some(item => item.id === product.id);
      if (exists) {
        return current.filter(item => item.id !== product.id);
      } else {
        const itemToAdd: FavoriteItem = {
          id: product.id,
          title: product.title || product.name || '',
          price: Number(product.price || 0),
          old_price: product.old_price ? Number(product.old_price) : null,
          image_url: product.image_url || product.image || null,
          image: product.image || product.image_url || null,
          game_name: product.game_name || product.game || null,
          robux_quantity: product.robux_quantity,
        };
        return [...current, itemToAdd];
      }
    });
  };

  const removeFavorite = (productId: string) => {
    setFavorites(current => current.filter(item => item.id !== productId));
  };

  const clearFavorites = () => setFavorites([]);

  const favoritesCount = favorites.length;

  return (
    <FavoritesContext.Provider value={{
      favorites,
      toggleFavorite,
      isFavorite,
      removeFavorite,
      clearFavorites,
      favoritesCount
    }}>
      {children}
    </FavoritesContext.Provider>
  );
}

export function useFavorites() {
  const context = useContext(FavoritesContext);
  if (context === undefined) {
    throw new Error('useFavorites must be used within a FavoritesProvider');
  }
  return context;
}
