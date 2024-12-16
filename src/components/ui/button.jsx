import React from "react";

export const Button = ({ children, variant, onClick, className }) => {
  let base = "px-3 py-1 rounded border";
  if (variant === "outline") {
    base += " border-gray-300";
  } else if (variant === "destructive") {
    base += " border-red-400 bg-red-100 text-red-700";
  } else {
    base += " border-gray-300 bg-gray-100";
  }

  return (
    <button onClick={onClick} className={`${base} ${className}`}>
      {children}
    </button>
  );
};
