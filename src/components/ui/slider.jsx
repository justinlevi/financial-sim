import React from "react";

export const Slider = ({ value, min, max, step, onValueChange }) => {
  const handleChange = (e) => {
    onValueChange([Number(e.target.value)]);
  };
  return (
    <input
      type="range"
      value={value[0]}
      min={min}
      max={max}
      step={step}
      onChange={handleChange}
      className="w-full"
    />
  );
};
