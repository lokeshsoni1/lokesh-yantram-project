
import React from 'react';

type ThemeOption = 'blue' | 'dark' | 'purple' | 'green';

interface ThemeSwitcherProps {
  currentTheme: ThemeOption;
  setTheme: (theme: ThemeOption) => void;
}

const ThemeSwitcher = ({ currentTheme, setTheme }: ThemeSwitcherProps) => {
  return (
    <div className="theme-switcher">
      <button 
        className={`theme-button theme-button-blue ${currentTheme === 'blue' ? 'active' : ''}`}
        onClick={() => setTheme('blue')}
        aria-label="Blue theme"
        type="button"
      />
      <button 
        className={`theme-button theme-button-dark ${currentTheme === 'dark' ? 'active' : ''}`}
        onClick={() => setTheme('dark')}
        aria-label="Dark theme"
        type="button"
      />
      <button 
        className={`theme-button theme-button-purple ${currentTheme === 'purple' ? 'active' : ''}`}
        onClick={() => setTheme('purple')}
        aria-label="Purple theme"
        type="button"
      />
      <button 
        className={`theme-button theme-button-green ${currentTheme === 'green' ? 'active' : ''}`}
        onClick={() => setTheme('green')}
        aria-label="Green theme"
        type="button"
      />
    </div>
  );
};

export default ThemeSwitcher;
