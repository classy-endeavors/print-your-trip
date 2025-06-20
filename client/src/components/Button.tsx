import React from "react";
import { cn } from "../lib/utils";

interface ButtonProps {
  onClick?: () => void;
  children: React.ReactNode;
  variant?: "primary" | "secondary" | "outline";
  disabled?: boolean;
  type?: "button" | "submit" | "reset";
  className?: string;
}

const Button: React.FC<ButtonProps> = ({
  onClick,
  children,
  variant = "primary",
  disabled = false,
  type = "button",
  className = "",
}) => {
  const variantStyles = {
    primary:
      "px-8 py-2 bg-button-green text-white text-sm rounded-full font-semibold hover:bg-button-green/[0.8] hover:shadow-lg",
    secondary:
      "px-8 py-2 bg-gray-600 text-white text-sm rounded-full font-semibold hover:bg-gray-700 hover:shadow-lg disabled:bg-gray-300 disabled:cursor-not-allowed",
    outline:
      "px-8 py-2 border-2 border-button-green text-button-green text-sm rounded-full font-semibold hover:bg-button-green hover:text-white hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed",
  };

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      type={type}
      className={cn(variantStyles[variant], className, "cursor-pointer")}
    >
      {children}
    </button>
  );
};

export default Button;
