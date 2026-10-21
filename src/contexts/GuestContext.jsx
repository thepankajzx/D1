import { createContext, useContext, useState, useCallback } from 'react';

const GuestContext = createContext({ isGuest: false, enterGuestMode: () => {}, exitGuestMode: () => {} });

export function useGuest() { return useContext(GuestContext); }

export function GuestProvider({ children }) {
  const [isGuest, setIsGuest] = useState(() => sessionStorage.getItem('definite_guest_mode') === '1');

  const enterGuestMode = useCallback(() => {
    sessionStorage.setItem('definite_guest_mode', '1');
    setIsGuest(true);
  }, []);

  const exitGuestMode = useCallback(() => {
    sessionStorage.removeItem('definite_guest_mode');
    setIsGuest(false);
  }, []);

  return (
    <GuestContext.Provider value={{ isGuest, enterGuestMode, exitGuestMode }}>
      {children}
    </GuestContext.Provider>
  );
}
