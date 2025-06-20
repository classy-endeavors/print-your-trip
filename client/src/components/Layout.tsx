import Footer from "./Footer";
import Navbar from "./Navbar";
import { Outlet } from "react-router-dom";

export default function Layout({
  variant = "main",
}: {
  variant?: "main" | "converter";
}) {
  return (
    <div className="min-h-screen bg-background">
      <Navbar variant={variant} />
      <div className="pt-40 font-quicksand">
        <Outlet />
      </div>
      {variant === "main" && <Footer />}
    </div>
  );
}
