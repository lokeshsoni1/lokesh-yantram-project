import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'

// app/page.tsx (or app/home/page.tsx, etc.)

import HandTracking from './components/HandTracking';

export default function HomePage() {
  return (
    <main>
      <video autoPlay playsInline muted width={640} height={480}></video>
      <button id="theme-toggle">Toggle Theme</button>

      {/* 👇 Initialize hand tracking here */}
      <HandTracking />
    </main>
  );
}


createRoot(document.getElementById("root")!).render(<App />);
