import Footer from "./Footer";
import Navbar from "./Navbar";
import { Outlet } from "react-router-dom";

export default function Layout() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="pt-30 font-quicksand">
        <Outlet />
      </div>
      <Footer />
    </div>
  );
}
