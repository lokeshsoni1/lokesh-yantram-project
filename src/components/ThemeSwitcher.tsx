
import React from 'react';

type ThemeOption = 'blue' | 'dark' | 'purple' | 'green' | 'cyberpunk' | 'neon';

interface ThemeSwitcherProps {
  currentTheme: ThemeOption;
  setTheme: (theme: ThemeOption) => void;
}

const ThemeSwitcher = ({ currentTheme, setTheme }: ThemeSwitcherProps) => {
  // Theme colors and visual representations
  const themes = [
    { id: 'blue', color: '#3b82f6', name: 'Blue' },
    { id: 'dark', color: '#1e293b', name: 'Dark' },
    { id: 'purple', color: '#8b5cf6', name: 'Purple' },
    { id: 'green', color: '#22c55e', name: 'Green' },
    { id: 'cyberpunk', color: '#ff00ff', name: 'Cyberpunk' },
    { id: 'neon', color: '#39ff14', name: 'Neon' }
  ];

  return (
    <div className="theme-switcher flex flex-wrap gap-2">
      {themes.map(theme => (
        <button 
          key={theme.id}
          className={`
            w-8 h-8 rounded-full transition-all duration-300
            ${currentTheme === theme.id ? 'ring-2 ring-offset-2 ring-white scale-110' : ''}
            hover:scale-110 hover:shadow-lg active:scale-90
          `}
          style={{ backgroundColor: theme.color }}
          onClick={() => setTheme(theme.id as ThemeOption)}
          aria-label={`${theme.name} theme`}
          type="button"
          title={theme.name}
        />
      ))}
    </div>
  );
};

export default ThemeSwitcher;
