import React, { useState } from "react";
import { Menu, X } from "lucide-react"; // for hamburger & close icons
import { useNavigate } from "react-router-dom";

const UserNavber = () => {
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();

  const HandleLogout = () => {
    localStorage.removeItem("user");
    localStorage.removeItem("captain");
    localStorage.removeItem("token");
    localStorage.removeItem("profile");
    navigate("/login-user");
  };
  
  const role = JSON.parse(localStorage.getItem("profile"))?.role;

  return (
    <div>
      <nav className="flex justify-between items-center p-4 bg-[#274C77] text-white">
        {/* Brand */}
        <div>
          <h3
            className="font-bold cursor-pointer text-xl md:text-2xl hover:text-amber-600"
            onClick={() => role === "user" ? navigate("/") : navigate("/driver-home")}
          >
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
            className="sm:hidden p-2 cursor-pointer"
            onClick={() => setIsOpen(!isOpen)}
          >
            {isOpen ? <X size={24} /> : <Menu size={24} />}
          </button>

          {/* Logout */}
          <button
            className="bg-red-600 px-3 py-1 rounded hover:bg-white hover:text-red-500 cursor-pointer"
            onClick={HandleLogout}
          >
            Logout
          </button>

          {/* Chatbot */}
          <div
            className="ml-4 border border-2px-green rounded-full cursor-pointer"
            onClick={() => { role === "user" ? navigate("/user-chatbot") : navigate("/driver-chatbot"); }}
          >
            <img
              className="w-8 h-8 rounded-full cursor-pointer"
              src="https://www.shutterstock.com/image-vector/happy-robot-3d-ai-character-600nw-2464455965.jpg"
              alt="Chat Bot Logo"
            />
          </div>
        </div>
      </nav>

      {/* Mobile Dropdown Menu */}
      {isOpen && (
        <div className="sm:hidden bg-[#274C77] text-white px-4 py-3 space-y-3">
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
