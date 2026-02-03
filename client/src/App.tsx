import { Routes, Route, BrowserRouter } from 'react-router-dom';
import { LandingPage } from './pages/LandingPage';
import { SoulmateApp } from './pages/SoulmateApp';
import { LaunchpadApp } from './pages/LaunchpadApp';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/soulmate" element={<SoulmateApp />} />
        <Route path="/launchpad" element={<LaunchpadApp />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;