import { Link, useNavigate, useLocation } from "react-router-dom";
import { useState, useEffect } from "react";
// 1. Import User as UserIcon to avoid name collision with Supabase type
import { LogOut, LayoutDashboard, Sparkles, Gamepad2, Menu, X, User as UserIcon } from "lucide-react";
import { supabase } from "../lib/supabase";
import { signOut } from "../utils/auth";
import { User } from "@supabase/supabase-js";

export default function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();
  const [user, setUser] = useState<User | null>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUser(data.user));
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });
    return () => subscription.unsubscribe();
  }, []);

  const handleLogout = async () => {
    try {
      await signOut();
      navigate("/");
      setIsMobileMenuOpen(false);
    } catch (error) {
      console.error("Logout error:", error);
      // Fallback - still redirect even if logout fails
      navigate("/");
      setIsMobileMenuOpen(false);
    }
  };

  // Helper for active link styling
  const NavLink = ({ to, icon: Icon, label }: any) => {
    const isActive = location.pathname === to;
    return (
      <Link
        to={to}
        className={`flex items-center gap-2 text-sm font-medium transition-all duration-300 px-3 py-2 rounded-xl ${isActive
          ? "text-white bg-purple-500/20 border border-purple-500/30"
          : "text-gray-300 hover:text-white hover:bg-white/10"
          }`}
      >
        <Icon size={16} className={isActive ? "text-purple-400" : ""} />
        {label}
      </Link>
    );
  };

  return (
    <nav className="fixed top-0 z-50 w-full glass-dark backdrop-blur-md border-b border-white/10">
      <div className="container mx-auto px-6 py-4 flex items-center justify-between">

        {/* Logo Section */}
        <Link
          to={user ? (location.pathname === "/dashboard" ? "/" : "/dashboard") : "/"}
          className="flex items-center gap-3 hover:opacity-80 transition-all duration-300 group"
        >
          <img
            src="/logo.png"
            alt="NeuroNest Logo"
            className="w-8 h-8 rounded-lg object-contain group-hover:scale-105 transition-transform duration-300"
          />
          <span className="text-xl font-bold text-white tracking-tight">NeuroNest</span>
        </Link>

        {/* Desktop Nav */}
        <div className="hidden md:flex items-center gap-8">
          {user ? (
            <>
              <div className="flex items-center gap-6 mr-4 border-r border-white/10 pr-6">
                <NavLink to="/dashboard" icon={LayoutDashboard} label="Dashboard" />
                <NavLink to="/games" icon={Gamepad2} label="Library" />
                <NavLink to="/chat" icon={Sparkles} label="Companion" />
                <NavLink to="/profile" icon={UserIcon} label="Profile" />
              </div>

              <button
                onClick={handleLogout}
                className="flex items-center gap-2 px-4 py-2 glass rounded-xl hover:bg-red-500/10 hover:text-red-400 hover:border-red-500/30 transition-all duration-300 text-sm font-medium text-gray-300"
              >
                <LogOut size={16} /> Logout
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="text-sm text-gray-300 hover:text-white transition-colors duration-300">Sign In</Link>
              <Link to="/signup" className="btn-calm">Get Started</Link>
            </>
          )}
        </div>

        {/* Mobile Menu Button */}
        <button
          className="md:hidden text-white p-2 glass rounded-xl hover:bg-white/10 transition-all duration-300"
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        >
          {isMobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
        </button>

        {/* Mobile Dropdown */}
        {isMobileMenuOpen && (
          <div className="absolute top-16 left-0 w-full glass-dark border-b border-white/10 p-6 flex flex-col gap-4 md:hidden shadow-2xl animate-fade-in">
            {user ? (
              <>
                <Link to="/dashboard" onClick={() => setIsMobileMenuOpen(false)} className="text-white py-3 flex items-center gap-3 hover:text-purple-300 transition-colors duration-300">
                  <LayoutDashboard size={16} /> Dashboard
                </Link>
                <Link to="/games" onClick={() => setIsMobileMenuOpen(false)} className="text-white py-3 flex items-center gap-3 hover:text-purple-300 transition-colors duration-300">
                  <Gamepad2 size={16} /> Library
                </Link>
                <Link to="/chat" onClick={() => setIsMobileMenuOpen(false)} className="text-white py-3 flex items-center gap-3 hover:text-purple-300 transition-colors duration-300">
                  <Sparkles size={16} /> Companion
                </Link>
                <Link to="/profile" onClick={() => setIsMobileMenuOpen(false)} className="text-white py-3 flex items-center gap-3 hover:text-purple-300 transition-colors duration-300">
                  <UserIcon size={16} /> Profile
                </Link>
                <button onClick={handleLogout} className="text-left text-red-400 py-3 flex items-center gap-3 hover:text-red-300 transition-colors duration-300">
                  <LogOut size={16} /> Logout
                </button>
              </>
            ) : (
              <>
                <Link to="/login" onClick={() => setIsMobileMenuOpen(false)} className="text-white py-3 hover:text-purple-300 transition-colors duration-300">Sign In</Link>
                <Link to="/signup" onClick={() => setIsMobileMenuOpen(false)} className="text-purple-400 py-3 font-bold hover:text-purple-300 transition-colors duration-300">Get Started</Link>
              </>
            )}
          </div>
        )}
      </div>
    </nav>
  );
}