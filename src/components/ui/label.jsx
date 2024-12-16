import React from "react";

export const Label = ({ htmlFor, children, className }) => (
  <label
    htmlFor={htmlFor}
    className={`block font-medium mb-1 ${className || ""}`}
  >
    {children}
  </label>
);
