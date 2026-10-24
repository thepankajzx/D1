import { createContext, useContext, useState, useCallback } from 'react';

const GuestContext = createContext({ isGuest: false, enterGuestMode: () => {}, exitGuestMode: () => {} });

export function useGuest() { return useContext(GuestContext); }

export function GuestProvider({ children }) {
  const [isGuest, setIsGuest] = useState(() => {
    try {
      return localStorage.getItem('definite_guest_mode') === '1' || sessionStorage.getItem('definite_guest_mode') === '1';
    } catch (e) {
      return false;
    }
  });

  const enterGuestMode = useCallback(() => {
    try {
      localStorage.setItem('definite_guest_mode', '1');
      sessionStorage.setItem('definite_guest_mode', '1');
    } catch (e) {}
    setIsGuest(true);
  }, []);

  const exitGuestMode = useCallback(() => {
    try {
      localStorage.removeItem('definite_guest_mode');
      sessionStorage.removeItem('definite_guest_mode');
    } catch (e) {}
    setIsGuest(false);
  }, []);

  return (
    <GuestContext.Provider value={{ isGuest, enterGuestMode, exitGuestMode }}>
      {children}
    </GuestContext.Provider>
  );
}
