import Navbar from "./Navbar";
import { Outlet } from "react-router-dom";

export default function Layout() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="pt-20 font-quicksand">
        <Outlet />
      </div>
    </div>
  );
}
