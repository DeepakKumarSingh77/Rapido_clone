import React, { useState } from "react";
import UserNavber from "../components/UserNavber";
import UserFooter from "../components/UserFooter";
import { useNavigate } from "react-router-dom";
import axios from "axios";

const DriverHome = () => {
  const navigate = useNavigate();
  const captain = JSON.parse(localStorage.getItem("captain")); // logged in captain
  const [status, setStatus] = useState("Offline");

  const handleGoOnline = () => {
    if (!navigator.geolocation) {
      alert("Geolocation not supported!");
      return;
    }

    navigator.geolocation.getCurrentPosition(async (pos) => {
      try {
        const res = await axios.post("http://localhost:3000/captain/go-online", {
          captainId: captain._id,
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
        });

        console.log("✅ Captain online:", res.data);
        setStatus("Online");
      } catch (err) {
        console.error("❌ Failed to update location:", err);
      }
    });
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <UserNavber />

      <div className="px-6 md:px-20 py-10 flex flex-col gap-8">
        <div className="text-center md:text-left">
          <h2 className="text-2xl md:text-4xl font-bold text-gray-800">
            Welcome Captain 🚖
          </h2>
          <p className="text-gray-600 mt-2">
            You’re currently{" "}
            <span
              className={`font-semibold ${
                status === "Online" ? "text-green-600" : "text-red-600"
              }`}
            >
              {status}
            </span>
          </p>
        </div>

        {/* Buttons */}
        <div className="flex justify-center md:justify-start">
          <button
            onClick={() => navigate("/find-users")}
            className="bg-gray-800 text-white px-6 py-2 rounded-lg hover:bg-amber-600 transition cursor-pointer"
          >
            Find Users
          </button>
          <button
            onClick={handleGoOnline}
            className="ml-4 bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition cursor-pointer"
          >
            Go Online / Update Location
          </button>
        </div>
      </div>

      <UserFooter />
    </div>
  );
};

export default DriverHome;
