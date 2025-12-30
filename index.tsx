
/**
 * SpeakSync XR - Comprehensive Application Documentation
 * =========================================================================================
 * 
 * 1. OVERVIEW
 *    SpeakSync XR is a React-based Progressive Web Application (PWA) designed for radiologists.
 *    It streamlines the creation of diagnostic reports by combining:
 *    - Advanced Speech-to-Text (Web Speech API)
 *    - AI-Powered Text Enhancement (Google Gemini API)
 *    - Structured Reporting Templates
 *    - "Interesting Cases" Library for educational archiving
 * 
 * 2. TECHNICAL ARCHITECTURE
 *    - **Framework**: React 18
 *    - **Language**: TypeScript
 *    - **Styling**: Tailwind CSS (via CDN in index.html) + Custom CSS variables for themes.
 *    - **State Management**: Context API. Data is sliced into specific domains:
 *      - `AuthContext`: Manages user sessions (simple local profile switching).
 *      - `AppContext`: Global UI state (modals, views).
 *      - `LanguageContext`: i18n support (PL/EN/DE).
 *      - `SettingsContext`: User preferences (colors, macros, AI prompts).
 *      - `TemplateContext`: Management of report templates and categories.
 *    - **Persistence**: `localStorage` handles all data persistence. Data is keyed by user profile
 *      to allow multiple users on the same device.
 * 
 * 3. KEY COMPONENTS & MODULES
 * 
 *    3.1. Editor Core (`components/EditorPanel.tsx`)
 *         - A `contentEditable` based rich text editor.
 *         - **Speech Recognition**: Hooks into `useSpeechRecognition`. Supports "Continuous Mode".
 *         - **Medical Logic**: Applies post-processing to speech (e.g., formatting units like "mm", "j.H.").
 *         - **AI Integration**:
 *           - "Enhance Report": Sends text to Gemini to fix grammar, style, and formatting based on `promptData.ts`.
 *           - "Correction Mode": Right-click text to teach the system new voice-to-text replacements.
 *           - "Grammar Check": Highlights errors with detailed explanations.
 *         - **Visual Feedback**: Distinct colors for Voice (green), Pasted (blue), and Dragged (yellow) text.
 * 
 *    3.2. Template System (`components/StudyTypesAndTemplatesPanel.tsx`)
 *         - Hierarchical structure: Study Types (e.g., "CT Head") -> Scenarios (e.g., "Trauma") -> Templates.
 *         - Supports drag-and-drop reordering.
 *         - System templates (read-only) vs. User templates (editable).
 * 
 *    3.3. Library (`pages/InterestingCasesLibrary.tsx`)
 *         - A searchable archive for saving interesting cases.
 *         - Supports tagging and notes.
 * 
 *    3.4. Settings (`pages/SettingsPage.tsx`)
 *         - **AI Configuration**: Fine-tune the AI's persona (fluency, summarization aggression, oncology details).
 *         - **Macros**: Custom voice commands (e.g., "new line" -> "\n").
 *         - **Data Management**: Import/Export templates and vocabulary to JSON/TXT.
 * 
 * 4. EXTERNAL DEPENDENCIES
 *    - `react`, `react-dom`: UI Library.
 *    - `@google/genai`: SDK for interacting with Gemini models.
 *    - `tailwindcss`: Utility-first CSS framework.
 * 
 * 5. DEPLOYMENT & ENVIRONMENT
 *    - Requires `process.env.API_KEY` for Google Gemini functionality.
 *    - Designed to run client-side; no backend database required (Local-First).
 * 
 * 6. USAGE GUIDE
 *    - **Login**: Select a profile. No password required.
 *    - **Dictate**: Press the microphone button or use Alt+R. Speak clearly.
 *    - **Templates**: Click a template in the left panel to load it. Double-click to replace editor content.
 *    - **AI Enhance**: Click the Sparkles icon or Alt+A to polish the report.
 *    - **Save Case**: Click the Star icon to save to the library.
 * 
 * =========================================================================================
 */

import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import ErrorBoundary from './components/ErrorBoundary';

// Make export utilities available in browser console for data migration
if (import.meta.env.DEV) {
  import('./utils/exportData').then((exportModule) => {
    (window as any).exportCasesJSON = exportModule.exportAndDownloadJSON;
    (window as any).exportCasesSQL = exportModule.exportAndDownloadSQL;
    (window as any).getExportStats = exportModule.getExportStats;
    console.log(`
🔧 Development Mode - Data Export Utilities Loaded

To export your teaching cases before deploying to production:

  exportCasesJSON()  - Download as JSON
  exportCasesSQL()   - Download as SQL (recommended for Railway)
  getExportStats()   - View statistics

See DATA_STORAGE_EXPLAINED.md for more info.
    `);
  });
}

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </React.StrictMode>
);
