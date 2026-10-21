import React, { createContext, useContext } from 'react';

const ThemeContext = createContext();

export const useTheme = () => {
  return { theme: 'light', isDark: false, setTheme: () => {}, toggleTheme: () => {} };
};

export const ThemeProvider = ({ children }) => {
  return (
    <ThemeContext.Provider value={{ theme: 'light', isDark: false, setTheme: () => {}, toggleTheme: () => {} }}>
      {children}
    </ThemeContext.Provider>
  );
};
