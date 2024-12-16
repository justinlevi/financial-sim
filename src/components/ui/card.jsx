import React from "react";

export const Card = ({ children, className }) => (
  <div className={`bg-white shadow p-4 rounded ${className}`}>{children}</div>
);

export const CardHeader = ({ children }) => (
  <div className="mb-4">{children}</div>
);

export const CardTitle = ({ children }) => (
  <h2 className="text-xl font-bold">{children}</h2>
);

export const CardContent = ({ children }) => <div>{children}</div>;
