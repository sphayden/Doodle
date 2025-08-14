/**
 * Utility functions for managing user data in localStorage
 */

const USER_STORAGE_KEY = 'doodle-game-user';

interface UserData {
  playerName: string;
  lastUsed: number;
}

/**
 * Save player name to localStorage
 */
export const savePlayerName = (playerName: string): void => {
  try {
    const userData: UserData = {
      playerName: playerName.trim(),
      lastUsed: Date.now()
    };
    localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(userData));
  } catch (error) {
    console.warn('Failed to save player name to localStorage:', error);
  }
};

/**
 * Get saved player name from localStorage
 * Returns empty string if no name is saved or if it's expired (older than 30 days)
 */
export const getSavedPlayerName = (): string => {
  try {
    const stored = localStorage.getItem(USER_STORAGE_KEY);
    if (!stored) return '';
    
    const userData: UserData = JSON.parse(stored);
    
    // Check if the stored name is older than 30 days
    const thirtyDaysAgo = Date.now() - (30 * 24 * 60 * 60 * 1000);
    if (userData.lastUsed < thirtyDaysAgo) {
      // Remove expired data
      clearSavedPlayerName();
      return '';
    }
    
    return userData.playerName || '';
  } catch (error) {
    console.warn('Failed to retrieve player name from localStorage:', error);
    return '';
  }
};

/**
 * Clear saved player name from localStorage
 */
export const clearSavedPlayerName = (): void => {
  try {
    localStorage.removeItem(USER_STORAGE_KEY);
  } catch (error) {
    console.warn('Failed to clear player name from localStorage:', error);
  }
};

/**
 * Check if a player name is currently saved
 */
export const hasSavedPlayerName = (): boolean => {
  return getSavedPlayerName().length > 0;
};