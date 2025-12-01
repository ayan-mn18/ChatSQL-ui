import { Routes, Route } from 'react-router-dom';
import LandingPage from './pages/LandingPage';
import ChatPage from './pages/ChatPage';
import FuturisticLanding from './pages/FuturisticLanding';
import HexoraLanding from './pages/HexoraLanding';

function App() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/landing" element={<FuturisticLanding />} />
      <Route path="/hexora" element={<HexoraLanding />} />
      <Route path="/chat" element={<ChatPage />} />
    </Routes>
  );
}

export default App;