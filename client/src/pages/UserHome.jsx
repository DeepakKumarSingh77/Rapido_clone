import React, { useState } from "react";
import UserNavber from "../components/UserNavber";
import Image from "../assets/Image.jpeg";
import UserFooter from "../components/UserFooter";
import { useNavigate } from "react-router-dom";

const UserHome = () => {
  const [pickup, setPickup] = useState("");
  const [drop, setDrop] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [activeInput, setActiveInput] = useState("");
  const navigate = useNavigate();

  // Fetch suggestions from Photon API
  const fetchSuggestions = async (query) => {
    if (query.length < 3) {
      setSuggestions([]);
      return;
    }
    const res = await fetch(`https://photon.komoot.io/api/?q=${query}&limit=5`);
    const data = await res.json();
    setSuggestions(data.features);
  };

  const handleSelect = (place) => {
    const name =
      place.properties.name +
      (place.properties.city ? `, ${place.properties.city}` : "");

    if (activeInput === "pickup") {
      setPickup(name);
    } else {
      setDrop(name);
    }

    setSuggestions([]); // clear dropdown
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#E7ECEF]">
      {/* Navbar */}
      <UserNavber />

      {/* Hero Section */}
      <div className="flex md:flex-row justify-between items-center px-6 md:px-20 py-10 gap-10">
        {/* Left Section */}
        <div className="flex flex-col gap-8 w-full md:w-1/2">
          <h2 className="text-2xl md:text-4xl font-bold text-gray-800">
            Go anywhere with <span className="text-blue-600">QuickGo</span>
          </h2>

          {/* Input Form */}
          <div className="flex flex-col gap-4 bg-white shadow-lg p-5 rounded-xl relative">
            {/* Pickup Input */}
            <input
              type="text"
              value={pickup}
              onChange={(e) => {
                setPickup(e.target.value);
                setActiveInput("pickup");
                fetchSuggestions(e.target.value);
              }}
              placeholder="Pickup Location"
              className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-amber-500"
            />

            {/* Drop Input */}
            <input
              type="text"
              value={drop}
              onChange={(e) => {
                setDrop(e.target.value);
                setActiveInput("drop");
                fetchSuggestions(e.target.value);
              }}
              placeholder="Drop Location"
              className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-amber-500"
            />

            {/* Suggestions Dropdown */}
            {suggestions.length > 0 && (
              <div className="absolute top-full left-0 right-0 bg-white border border-gray-300 rounded-lg mt-1 z-50">
                {suggestions.map((place, index) => (
                  <div
                    key={index}
                    onClick={() => handleSelect(place)}
                    className="px-4 py-2 cursor-pointer hover:bg-gray-100"
                  >
                    {place.properties.name},{" "}
                    {place.properties.city || place.properties.country}
                  </div>
                ))}
              </div>
            )}
            <button
              className={`w-full bg-[#274C77] text-white py-2 rounded-lg transition cursor-disabled ${
                pickup && drop
                  ? "bg-[#274C77] text-white hover:bg-[#6096BA]"
                  : "bg-gray-400 text-gray-200 cursor-not-allowed"
              }`}
              disabled={!pickup || !drop}
              onClick={() =>
                navigate(
                  `/ride-options?pickup=${encodeURIComponent(
                    pickup
                  )}&drop=${encodeURIComponent(drop)}`
                )
              }
            >
              Book Ride
            </button>
          </div>
        </div>

        {/* Right Section */}
        <div className="hidden md:flex w-full md:w-1/2 justify-center items-center">
          <img
            src="https://www.shutterstock.com/image-vector/taxi-online-vector-illustration-car-260nw-1540323026.jpg"
            className="w-full max-w-md rounded-xl shadow-md"
            alt="User Home"
          />
        </div>
      </div>

      {/* Footer */}
      <UserFooter />
    </div>
  );
};

export default UserHome;
