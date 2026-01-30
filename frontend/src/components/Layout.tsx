import { Outlet } from "react-router-dom";
import Navbar from "./Navbar";

export default function Layout() {
  return (
    <div className="font-sans antialiased min-h-screen bg-[#0b0616] text-white flex flex-col">
      <Navbar />
      
      {/* Page Content */}
      <main className="flex-1 pt-20">
        <Outlet />
      </main>
      
      {/* NeuroChat Widget Removed - We now have a full page for it */}
    </div>
  );
}