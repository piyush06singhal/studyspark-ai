import { BrowserRouter as Router, Routes, Route, useLocation } from "react-router-dom";
import { useEffect } from "react";
import Navbar from "./components/Navbar";
import Landing from "./pages/Landing";
import UploadPage from "./pages/Upload";
import GeneratorPage from "./pages/Generator";
import QuizInterface from "./pages/Quiz";
import ResultsPage from "./pages/Results";
import SummaryPage from "./pages/Summary";
import AnimatedBackground from "./components/AnimatedBackground";

import FlashcardsPage from "./pages/Flashcards";
import InsightsPage from "./pages/Insights";
import TopicsPage from "./pages/Topics";
import KnowledgeGraphPage from "./pages/KnowledgeGraph";
import ChatSidebar from "./components/ChatSidebar";

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
}

export default function App() {
  return (
    <Router>
      <ScrollToTop />
      <AnimatedBackground />
      <Navbar />
      <ChatSidebar />
      <main className="relative z-10">
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/upload" element={<UploadPage />} />
          <Route path="/generate" element={<GeneratorPage />} />
          <Route path="/quiz" element={<QuizInterface />} />
          <Route path="/results" element={<ResultsPage />} />
          <Route path="/summary" element={<SummaryPage />} />
          <Route path="/flashcards" element={<FlashcardsPage />} />
          <Route path="/insights" element={<InsightsPage />} />
          <Route path="/topics" element={<TopicsPage />} />
          <Route path="/graph" element={<KnowledgeGraphPage />} />
        </Routes>
      </main>
    </Router>
  );
}
