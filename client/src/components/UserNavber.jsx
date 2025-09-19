import React, { useState } from "react";
import { Menu, X } from "lucide-react"; // for hamburger & close icons

const UserNavber = () => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div>
      <nav className="flex justify-between items-center p-4 bg-gray-800 text-white">
        {/* Brand */}
        <div>
          <h3 className="font-bold cursor-pointer text-xl md:text-2xl hover:text-amber-600">
            QuickGo
          </h3>
        </div>

        {/* Menu + Logout */}
        <div className="flex items-center space-x-4">
          {/* Desktop Nav */}
          <ul className="hidden sm:flex space-x-4 md:space-x-9 lg:space-x-12">
            <li className="cursor-pointer hover:text-amber-600">Ride</li>
            <li className="cursor-pointer hover:text-amber-600">Earn</li>
            <li className="cursor-pointer hover:text-amber-600">About</li>
            <li className="cursor-pointer hover:text-amber-600">Help</li>
          </ul>

          {/* Mobile Menu Button (shown only below 500px → sm:hidden) */}
          <button
            className="sm:hidden p-2"
            onClick={() => setIsOpen(!isOpen)}
          >
            {isOpen ? <X size={24} /> : <Menu size={24} />}
          </button>

          {/* Logout */}
          <button className="bg-red-600 px-3 py-1 rounded hover:bg-white hover:text-red-500">
            Logout
          </button>
        </div>
      </nav>

      {/* Mobile Dropdown Menu */}
      {isOpen && (
        <div className="sm:hidden bg-gray-700 text-white px-4 py-3 space-y-3">
          <li className="cursor-pointer hover:text-amber-600 list-none">Ride</li>
          <li className="cursor-pointer hover:text-amber-600 list-none">Earn</li>
          <li className="cursor-pointer hover:text-amber-600 list-none">About</li>
          <li className="cursor-pointer hover:text-amber-600 list-none">Help</li>
        </div>
      )}
    </div>
  );
};

export default UserNavber;
