import React from "react";

export const Switch = ({ checked, onCheckedChange }) => {
  return (
    <button
      onClick={() => onCheckedChange(!checked)}
      className={`w-10 h-5 flex items-center rounded-full p-1 ${
        checked ? "bg-blue-500" : "bg-gray-300"
      }`}
    >
      <div
        className={`bg-white w-4 h-4 rounded-full transform ${
          checked ? "translate-x-5" : ""
        }`}
      ></div>
    </button>
  );
};
