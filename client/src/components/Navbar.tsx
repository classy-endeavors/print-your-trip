import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Link } from "react-router-dom";
import Button from "./Button";

export const MenuItem = ({
  item,
  to,
  onClick
}: {
  item: string;
  to: string;
  onClick?: () => void;
}) => {
  return (
    <div className="relative">
      <Link
        to={to}
        className="cursor-pointer text-black hover:opacity-[0.9] text-lg md:text-base"
        onClick={onClick}
      >
        {item}
      </Link>
    </div>
  );
};

export const Menu = ({
  children,
  className = ""
}: {
  children: React.ReactNode;
  className?: string;
}) => {
  return (
    <nav className={`flex justify-center space-x-4 ${className}`}>{children}</nav>
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

const Navbar = () => {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: "spring", stiffness: 120, damping: 12 }}
      className="absolute top-6 left-1/2 -translate-x-1/2 z-50 px-4 md:px-8 py-3 bg-background/90 shadow-lg rounded-full border border-gray-200 backdrop-blur flex items-center justify-between font-league-spartan w-[95vw] max-w-2xl"
    >
      {/* Desktop Menu */}
      <div className="hidden md:flex w-full justify-center">
        <Menu>{navItems.map((item) => <MenuItem key={item.to} item={item.label} to={item.to} />)}</Menu>
      </div>
      {/* Mobile Hamburger */}
      <div className="flex md:hidden w-full justify-between items-center">
        <span className="font-bold text-lg">Menu</span>
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
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            ) : (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8h16M4 16h16" />
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
            className="absolute top-14 left-1/2 -translate-x-1/2 w-[90vw] max-w-xs bg-background shadow-xl rounded-2xl border border-gray-200  p-6 flex flex-col items-center space-y-4 md:hidden"
          >
            {navItems.map((item) => (
              <MenuItem
                key={item.to}
                item={item.label}
                to={item.to}
                onClick={() => setMobileOpen(false)}
              />
            ))}
            <Button>
              Create My Postcard
            </Button>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default Navbar; 