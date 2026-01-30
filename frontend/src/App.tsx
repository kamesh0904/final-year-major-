import { Routes, Route } from "react-router-dom";
import Layout from "./components/Layout";
import AuthGuard from "./components/AuthGuard";
import AuthBackground from "./components/AuthBackground";

// --- Pages ---
import Landing from "./pages/LandingPage";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Questionnaire from "./pages/Questionnaire";
import Home from "./pages/Home";
import Games from "./pages/Games";
import Chat from "./pages/Chat";
import Profile from "./pages/Profile";
import AuthCallback from "./pages/AuthCallback"; // <--- NEW: OAuth callback page

// --- Games ---
import ImpulseGuard from "./components/ImpulseGuard";
import BreathSync from "./components/BreathSync";
import PatternRelease from "./components/PatternRelease";
import OrderShift from "./components/OrderShift";
import LightBuilder from "./components/LightBuilder";
import MomentumSteps from "./components/MomentumSteps";
import EmotionMatch from "./components/EmotionMatch";
import SensoryFlow from "./components/SensoryFlow";
import ChromaticRush from "./components/ChromaticRush";
import CalmPath from "./components/CalmPath";

export default function App() {
  return (
    <Routes>
      {/* --- PUBLIC ROUTES --- */}
      <Route path="/" element={<Landing />} />

      <Route
        path="/login"
        element={
          <AuthBackground>
            <Login />
          </AuthBackground>
        }
      />
      <Route
        path="/signup"
        element={
          <AuthBackground>
            <Signup />
          </AuthBackground>
        }
      />

      {/* --- OAUTH CALLBACK ROUTE --- */}
      <Route path="/auth/callback" element={<AuthCallback />} />

      {/* --- PROTECTED ROUTES (Require Login) --- */}
      <Route element={<AuthGuard />}>

        {/* Onboarding */}
        <Route path="/questionnaire" element={<Questionnaire />} />

        {/* Main App Layout (Navbar + Content) */}
        <Route element={<Layout />}>
          <Route path="/dashboard" element={<Home />} />
          <Route path="/games" element={<Games />} />
          <Route path="/chat" element={<Chat />} />
          <Route path="/profile" element={<Profile />} /> {/* <--- 2. ADD THIS ROUTE */}
        </Route>

        {/* --- GAME ROUTES (Full Screen) --- */}
        <Route path="/impulse-guard" element={<ImpulseGuard />} />
        <Route path="/breath-sync" element={<BreathSync />} />
        <Route path="/pattern-release" element={<PatternRelease />} />
        <Route path="/order-shift" element={<OrderShift />} />
        <Route path="/light-builder" element={<LightBuilder />} />
        <Route path="/momentum-steps" element={<MomentumSteps />} />
        <Route path="/emotion-match" element={<EmotionMatch />} />
        <Route path="/sensory-flow" element={<SensoryFlow />} />
        <Route path="/game" element={<ChromaticRush />} />
        <Route path="/calm-path" element={<CalmPath />} />

      </Route>

    </Routes>
  );
}