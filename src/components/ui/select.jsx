import React, { useState, useEffect, useRef } from "react";
import { ChevronDown } from "lucide-react";

export const Select = ({ value, onValueChange, children }) => {
  const [isOpen, setIsOpen] = useState(false);
  const ref = useRef(null);

  // Find the selected item's label
  const selectedItem = React.Children.toArray(children).find(
    (child) => child.type === SelectContent
  )?.props.children.find((child) => child.props.value === value);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (ref.current && !ref.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="relative w-full" ref={ref}>
      {React.Children.map(children, (child) => {
        if (child.type === SelectTrigger) {
          return React.cloneElement(child, {
            onClick: () => setIsOpen(!isOpen),
            isOpen,
            selectedLabel: selectedItem?.props.children,
          });
        }
        if (child.type === SelectContent) {
          return isOpen && React.cloneElement(child, { 
            onValueChange: (newValue) => {
              onValueChange(newValue);
              setIsOpen(false);
            },
            selectedValue: value
          });
        }
        return child;
      })}
    </div>
  );
};

export const SelectTrigger = ({ children, onClick, isOpen, selectedLabel }) => (
  <div
    onClick={onClick}
    className={`flex items-center justify-between w-full px-3 py-2 text-sm border rounded-md bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 cursor-pointer ${
      isOpen ? "border-blue-500 ring-2 ring-blue-500 ring-opacity-50" : "border-gray-300"
    }`}
  >
    {React.Children.map(children, child => {
      if (child.type === SelectValue) {
        return React.cloneElement(child, { selectedLabel });
      }
      return child;
    })}
    <ChevronDown className={`w-4 h-4 transition-transform ${isOpen ? "transform rotate-180" : ""}`} />
  </div>
);

export const SelectValue = ({ selectedLabel }) => (
  <span className="block truncate">{selectedLabel || "Select an option..."}</span>
);

export const SelectContent = ({ children, onValueChange, selectedValue }) => (
  <div className="absolute w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg z-50 max-h-60 overflow-auto">
    <div className="py-1">
      {React.Children.map(children, (child) =>
        React.cloneElement(child, {
          onClick: () => {
            onValueChange(child.props.value);
          },
          isSelected: child.props.value === selectedValue
        })
      )}
    </div>
  </div>
);

export const SelectItem = ({ value, children, onClick, isSelected }) => (
  <div
    className={`px-3 py-2 text-sm cursor-pointer ${
      isSelected 
        ? "bg-blue-50 text-blue-700" 
        : "hover:bg-blue-50 hover:text-blue-700"
    }`}
    onClick={onClick}
  >
    {children}
  </div>
);
