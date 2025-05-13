
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
            ${currentTheme === theme.id 
              ? 'ring-2 ring-offset-2 ring-primary shadow-lg scale-110' 
              : 'opacity-80 hover:opacity-100'}
            hover:scale-110 hover:shadow-lg active:scale-90
            ${theme.id === 'cyberpunk' ? 'bg-gradient-to-br from-fuchsia-600 to-cyan-500' : ''}
            ${theme.id === 'neon' ? 'bg-gradient-to-br from-green-400 to-blue-400' : ''}
          `}
          style={
            theme.id !== 'cyberpunk' && theme.id !== 'neon' 
              ? { backgroundColor: theme.color } 
              : {}
          }
          onClick={() => setTheme(theme.id as ThemeOption)}
          aria-label={`${theme.name} theme`}
          type="button"
          title={theme.name}
        >
          {currentTheme === theme.id && (
            <div className="flex items-center justify-center w-full h-full text-white text-xs">
              ✓
            </div>
          )}
        </button>
      ))}
    </div>
  );
};

export default ThemeSwitcher;
