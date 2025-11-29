import { Routes, Route } from 'react-router-dom';
import LandingPage from './pages/LandingPage';
import ChatPage from './pages/ChatPage';
import FuturisticLanding from './pages/FuturisticLanding';

function App() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/landing" element={<FuturisticLanding />} />
      <Route path="/chat" element={<ChatPage />} />
    </Routes>
  );
}

export default App;