import React from 'react';
import { useTheme } from '../context/ThemeContext';

/**
 * Global theme styles that apply theme colors to the entire app
 * Uses inline styles on the root div to override Tailwind defaults
 */
export const GlobalThemeStyles: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { currentTheme } = useTheme();

  return (
    <div
      style={{
        backgroundColor: currentTheme.colors.bgPrimary,
        color: currentTheme.colors.textPrimary,
        transition: 'background-color 0.3s ease, color 0.3s ease',
      }}
      className="w-full h-full"
    >
      <style>
        {`
          /* MAXIMUM PRIORITY - Override ALL tailwind colors */
          
          /* Root and base */
          :root {
            --theme-bg-primary: ${currentTheme.colors.bgPrimary};
            --theme-bg-secondary: ${currentTheme.colors.bgSecondary};
            --theme-bg-tertiary: ${currentTheme.colors.bgTertiary};
            --theme-text-primary: ${currentTheme.colors.textPrimary};
            --theme-text-secondary: ${currentTheme.colors.textSecondary};
            --theme-border: ${currentTheme.colors.borderColor};
            --theme-accent: ${currentTheme.colors.accentPrimary};
          }
          
          /* Everything gets theme colors */
          html, body, main, section, article, aside, nav, header, footer, div {
            color: inherit;
          }
          
          html, body { 
            background-color: ${currentTheme.colors.bgPrimary} !important; 
            color: ${currentTheme.colors.textPrimary} !important; 
          }

          main, section { background-color: ${currentTheme.colors.bgPrimary} !important; }
          header { 
            background-color: ${currentTheme.colors.bgPrimary} !important; 
            border-bottom-color: ${currentTheme.colors.borderColor} !important; 
          }

          /* GRAY BACKGROUNDS - Super specific targeting */
          .bg-gray-50 { background-color: ${currentTheme.colors.bgPrimary} !important; }
          .bg-gray-100 { background-color: ${currentTheme.colors.bgPrimary} !important; }
          .bg-gray-200 { background-color: ${currentTheme.colors.bgSecondary} !important; }
          .bg-gray-300 { background-color: ${currentTheme.colors.bgSecondary} !important; }
          .bg-gray-400 { background-color: ${currentTheme.colors.bgTertiary} !important; }
          .bg-gray-500 { background-color: ${currentTheme.colors.bgHover} !important; }
          .bg-gray-600 { background-color: ${currentTheme.colors.bgTertiary} !important; }
          .bg-gray-700 { background-color: ${currentTheme.colors.bgTertiary} !important; }
          .bg-gray-800 { background-color: ${currentTheme.colors.bgSecondary} !important; }
          .bg-gray-900 { background-color: ${currentTheme.colors.bgPrimary} !important; }

          /* GRAY WITH OPACITY */
          .bg-gray-50\/50, .bg-gray-100\/50 { background-color: ${currentTheme.colors.bgPrimary} !important; }
          .bg-gray-200\/50, .bg-gray-300\/50 { background-color: ${currentTheme.colors.bgSecondary}80 !important; }
          .bg-gray-600\/50 { background-color: ${currentTheme.colors.bgTertiary}80 !important; }
          .bg-gray-700\/50 { background-color: ${currentTheme.colors.bgTertiary}80 !important; }
          .bg-gray-800\/50 { background-color: ${currentTheme.colors.bgSecondary}80 !important; }
          .bg-gray-900\/50 { background-color: ${currentTheme.colors.bgSecondary}80 !important; }
          .bg-gray-900\/20 { background-color: ${currentTheme.colors.bgSecondary}40 !important; }

          /* PURPLE/INDIGO BACKGROUNDS */
          .bg-blue-50, .bg-indigo-50 { background-color: ${currentTheme.colors.bgPrimary} !important; }
          .bg-blue-100, .bg-indigo-100 { background-color: ${currentTheme.colors.bgSecondary} !important; }
          .bg-blue-200, .bg-indigo-200 { background-color: ${currentTheme.colors.bgTertiary} !important; }
          .bg-blue-300, .bg-indigo-300 { background-color: ${currentTheme.colors.bgHover} !important; }
          .bg-blue-400, .bg-blue-500, .bg-blue-600, .bg-blue-700, .bg-indigo-500, .bg-indigo-600 { 
            background-color: ${currentTheme.colors.buttonPrimary} !important; 
          }
          .bg-blue-800, .bg-blue-900, .bg-indigo-800, .bg-indigo-900 { 
            background-color: ${currentTheme.colors.bgPrimary} !important; 
          }
          .bg-blue-400\/20, .bg-blue-500\/20, .bg-blue-600\/20, .bg-blue-600\/30 { 
            background-color: ${currentTheme.colors.buttonPrimary}25 !important; 
          }
          .bg-blue-900\/20, .bg-blue-900\/30 { 
            background-color: ${currentTheme.colors.bgSecondary}40 !important; 
          }

          /* GREEN BACKGROUNDS */
          .bg-green-50, .bg-green-100 { background-color: ${currentTheme.colors.bgPrimary} !important; }
          .bg-green-200 { background-color: ${currentTheme.colors.bgSecondary} !important; }
          .bg-green-300 { background-color: ${currentTheme.colors.bgTertiary} !important; }
          .bg-green-400, .bg-green-500, .bg-green-600, .bg-green-700 { 
            background-color: ${currentTheme.colors.accentSuccess} !important; 
          }
          .bg-green-600\/20 { background-color: ${currentTheme.colors.accentSuccess}25 !important; }

          /* RED BACKGROUNDS */
          .bg-red-600, .bg-red-700, .bg-red-800 { background-color: ${currentTheme.colors.accentError} !important; }
          .bg-red-600\/50, .bg-red-800\/50 { background-color: ${currentTheme.colors.accentError}80 !important; }

          /* YELLOW BACKGROUNDS */
          .bg-yellow-600\/20 { background-color: ${currentTheme.colors.accentWarning}25 !important; }

          /* TEXT COLORS */
          .text-gray-50, .text-gray-100, .text-gray-200, .text-gray-300 { 
            color: ${currentTheme.colors.textPrimary} !important; 
          }
          .text-gray-400, .text-gray-500, .text-gray-600 { 
            color: ${currentTheme.colors.textMuted} !important; 
          }
          .text-gray-700, .text-gray-800, .text-gray-900, .text-white { 
            color: ${currentTheme.colors.textPrimary} !important; 
          }

          .text-blue-200, .text-blue-300, .text-blue-400 { 
            color: ${currentTheme.colors.accentPrimary} !important; 
          }
          .text-green-200, .text-green-300, .text-green-400 { 
            color: ${currentTheme.colors.accentSuccess} !important; 
          }
          .text-red-300, .text-red-400 { 
            color: ${currentTheme.colors.accentError} !important; 
          }
          .text-blue-300 { 
            color: ${currentTheme.colors.accentPrimary} !important; 
          }

          /* BORDERS */
          .border-gray-600, .border-gray-700, .border-gray-800 { 
            border-color: ${currentTheme.colors.borderColor} !important; 
          }
          .border-blue-500, .border-blue-600 { 
            border-color: ${currentTheme.colors.accentPrimary} !important; 
          }
          .border-green-500, .border-green-600 { 
            border-color: ${currentTheme.colors.accentSuccess} !important; 
          }

          /* BUTTONS & INTERACTIONS */
          button { transition: all 0.2s ease !important; }
          button:not(.hover\\:bg-gray-700):not([class*="text-gray"]):not([class*="text-red"]):not([class*="text-green"]):not([class*="text-blue"]):not([class*="text-yellow"]) { 
            background-color: ${currentTheme.colors.buttonPrimary} !important; 
            color: #fff !important; 
          }
          button.hover\\:bg-gray-700 { 
            background-color: ${currentTheme.colors.bgTertiary} !important; 
            color: ${currentTheme.colors.textPrimary} !important; 
          }
          button.hover\\:bg-gray-700:hover { 
            background-color: ${currentTheme.colors.bgHover} !important; 
          }

          /* INPUTS */
          input, textarea, select { 
            color: ${currentTheme.colors.textPrimary} !important; 
            background-color: ${currentTheme.colors.bgSecondary} !important; 
            border-color: ${currentTheme.colors.borderColor} !important; 
          }
          input:focus, textarea:focus, select:focus { 
            border-color: ${currentTheme.colors.accentPrimary} !important; 
            outline: none !important;
            box-shadow: 0 0 0 3px ${currentTheme.colors.accentPrimary}30 !important; 
          }
          input::placeholder, textarea::placeholder { 
            color: ${currentTheme.colors.textMuted} !important; 
          }

          /* HOVER STATES */
          .hover\\:bg-gray-700:hover { background-color: ${currentTheme.colors.bgHover} !important; }
          .hover\\:bg-gray-600:hover { background-color: ${currentTheme.colors.bgTertiary} !important; }
          .hover\\:bg-gray-500:hover { background-color: ${currentTheme.colors.bgHover} !important; }
          .hover\\:bg-blue-600\/30:hover { background-color: ${currentTheme.colors.buttonPrimary}30 !important; }
          .hover\\:bg-green-600\/30:hover { background-color: ${currentTheme.colors.accentSuccess}30 !important; }
          .hover\\:text-white:hover { color: ${currentTheme.colors.textPrimary} !important; }
          .hover\\:text-blue-300:hover { color: ${currentTheme.colors.accentPrimary} !important; }

          /* TEMPLATE BUTTON ICON STYLING */
          .template-btn-icon { background-color: transparent; }
          .template-btn-icon:hover { background-color: ${currentTheme.colors.bgTertiary} !important; }

          /* SCROLLBARS */
          ::-webkit-scrollbar { width: 8px; height: 8px; }
          ::-webkit-scrollbar-track { background-color: ${currentTheme.colors.bgSecondary}; }
          ::-webkit-scrollbar-thumb { background-color: ${currentTheme.colors.borderColor}; }
          ::-webkit-scrollbar-thumb:hover { background-color: ${currentTheme.colors.textMuted}; }
        `}
      </style>
      {children}
    </div>
  );
};

export default GlobalThemeStyles;
