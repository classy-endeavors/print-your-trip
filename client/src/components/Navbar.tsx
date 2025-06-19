import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Link } from "react-router-dom";
import Button from "./Button";

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

const Navbar = () => {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: "spring", stiffness: 120, damping: 12 }}
      className="absolute top-6 left-1/2 z-50 flex w-[95vw] max-w-2xl -translate-x-1/2 items-center justify-between rounded-full border border-gray-200 bg-background/90 px-4 py-3 font-league-spartan shadow-lg backdrop-blur md:px-8"
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
        <span className="text-lg font-bold">Menu</span>
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
            className="absolute top-14 left-1/2 flex w-[90vw] max-w-xs -translate-x-1/2 flex-col items-center space-y-4 rounded-2xl border border-gray-200 bg-background p-6 shadow-xl md:hidden"
          >
            {navItems.map((item) => (
              <MenuItem
                key={item.to}
                item={item.label}
                to={item.to}
                onClick={() => setMobileOpen(false)}
              />
            ))}
            <Button>Create My Postcard</Button>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default Navbar;
