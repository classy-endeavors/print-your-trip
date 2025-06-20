import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Link, useNavigate } from "react-router-dom";
import Button from "./Button";
import logoFull from "../assets/logo-full.png";
import logoExt from "../assets/logo-ext.svg";
import logoTagline from "../assets/logo-tagline.png";
import ChevronLeft from "./icons/ChevronLeft";

// MenuItem and Menu from Navbar.tsx
export const MenuItem = ({
  item,
  to,
  onClick,
}: {
  item: string;
  to: string;
  onClick?: () => void;
}) => {
  return (
    <div className="relative">
      <Link
        to={to}
        className="cursor-pointer text-lg text-black hover:opacity-[0.9] md:text-base"
        onClick={onClick}
      >
        {item}
      </Link>
    </div>
  );
};

export const Menu = ({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) => {
  return (
    <nav className={`flex justify-center space-x-4 ${className}`}>
      {children}
    </nav>
  );
};

const navItems = [
  { label: "Home", to: "/" },
  { label: "How It Works", to: "/how-it-works" },
  { label: "FAQ", to: "/faq" },
  { label: "Blogs", to: "/blogs" },
  { label: "Pricing", to: "/pricing" },
  { label: "Terms and Conditions", to: "/terms-and-conditions" },
  { label: "Privacy Policy", to: "/privacy-policy" },
];

type NavbarProps = {
  variant: "main" | "converter";
};

const Navbar: React.FC<NavbarProps> = ({ variant }) => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const navigate = useNavigate();

  if (variant === "converter") {
    return (
      <AnimatePresence>
        <motion.nav
          className="fixed z-50 w-full bg-background"
          initial={{ opacity: 0, y: -30 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -30 }}
          transition={{ type: "spring", stiffness: 120, damping: 16 }}
        >
          <div className="relative m-5 flex justify-between rounded-full p-2 shadow-md md:shadow-none">
            <a href="/">
              <ChevronLeft className="h-15 w-15 cursor-pointer rounded-full p-3 text-gray-600 md:shadow-2xl md:shadow-black" />
            </a>
            <div className="flex flex-1 flex-col items-center justify-center gap-2">
              <img
                className="mr-2 max-h-[3rem] max-w-[10rem]"
                src={logoExt}
                alt="logo-ext"
              />
              <img
                className="max-w-[10rem]"
                src={logoTagline}
                alt="logo-tagline"
              />
            </div>
          </div>
        </motion.nav>
      </AnimatePresence>
    );
  }

  // Main Navbar design
  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: "spring", stiffness: 120, damping: 12 }}
      className="fixed top-6 left-1/2 z-50 flex w-[95vw] max-w-2xl -translate-x-1/2 items-center justify-between rounded-full bg-background/70 px-4 py-3 font-league-spartan shadow-lg backdrop-blur md:px-8"
    >
      {/* Desktop Menu */}
      <div className="hidden w-full justify-center md:flex">
        <Menu>
          {navItems.map((item) => (
            <MenuItem key={item.to} item={item.label} to={item.to} />
          ))}
        </Menu>
      </div>
      {/* Mobile Hamburger */}
      <div className="flex w-full items-center justify-between md:hidden">
        <img className="max-w-30" src={logoFull} alt="logo" />
        <button
          className="p-2 focus:outline-none"
          onClick={() => setMobileOpen((open) => !open)}
          aria-label="Toggle navigation menu"
        >
          <svg
            className="h-7 w-7 text-black"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            {mobileOpen ? (
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            ) : (
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 8h16M4 16h16"
              />
            )}
          </svg>
        </button>
      </div>
      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ type: "spring", stiffness: 120, damping: 14 }}
            className="absolute top-14 left-1/2 flex w-[90vw] max-w-xs -translate-x-1/2 flex-col items-center space-y-4 rounded-2xl bg-background p-6 shadow-xl md:hidden"
          >
            {navItems.map((item) => (
              <MenuItem
                key={item.to}
                item={item.label}
                to={item.to}
                onClick={() => setMobileOpen(false)}
              />
            ))}
            <Button onClick={() => navigate("/create")}>
              Create My Postcard
            </Button>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default Navbar;
