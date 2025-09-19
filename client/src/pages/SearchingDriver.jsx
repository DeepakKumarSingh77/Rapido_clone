import React, { useEffect, useState, useRef } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import { useLocation, useNavigate } from "react-router-dom";
import UserNavber from "../components/UserNavber";
import UserFooter from "../components/UserFooter";
import { io } from "socket.io-client";
import "leaflet/dist/leaflet.css";

// ✅ User icon
const userIcon = L.icon({
  iconUrl: "/icons/Source_logo.png",
  iconSize: [40, 40],
  iconAnchor: [20, 40],
});

// ✅ Pulsing circle for driver search
const SearchWave = ({ center, maxRadius = 1000, interval = 50 }) => {
  const map = useMap();
  const circleRef = useRef(null);

  useEffect(() => {
    if (!center) return;

    let radius = 0;
    const circle = L.circle(center, {
      radius,
      color: "#3399ff",
      fillColor: "#3399ff",
      fillOpacity: 0.2,
      weight: 2,
    }).addTo(map);

    circleRef.current = circle;

    const anim = setInterval(() => {
      radius += 20;
      if (radius > maxRadius) radius = 0;
      circle.setRadius(radius);
    }, interval);

    return () => {
      clearInterval(anim);
      circle.remove();
    };
  }, [center, map, maxRadius, interval]);

  return null;
};

const SearchingDriver = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const params = new URLSearchParams(location.search);
  const rideId = params.get("rideId");

  const [userLatLng, setUserLatLng] = useState(null);
  const [seconds, setSeconds] = useState(120);
  const [driverFound, setDriverFound] = useState(false);
  const socketRef = useRef(null);

  // ✅ Get user location
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) =>
          setUserLatLng([pos.coords.latitude, pos.coords.longitude]),
        (err) => alert("Unable to get your location")
      );
    }
  }, []);

  // ✅ Countdown timer
  useEffect(() => {
    const timer = setInterval(() => setSeconds((prev) => prev - 1), 1000);
    return () => clearInterval(timer);
  }, []);

  // ✅ WebSocket connection to Gateway
  useEffect(() => {
    const userId = localStorage.getItem("userId"); // store logged-in user id
    socketRef.current = io("http://localhost:3000", {
      transports: ["websocket"],
    });

    socketRef.current.on("connect", () => {
      console.log("✅ Connected to Gateway:", socketRef.current.id);

      // Register user for notifications
      if (userId) socketRef.current.emit("registerUser", userId);
    });

    // Listen for ride acceptance
    socketRef.current.on("rideAccepted", (data) => {
      if (data.rideId === rideId && !driverFound) {
        setDriverFound(true);
        alert(`Driver ${data.payload.captain.username} accepted your ride!`);
        navigate(`/ride-live/${rideId}`);
      }
    });

    return () => {
      socketRef.current.disconnect();
    };
  }, [rideId, navigate, driverFound]);

  // ✅ Handle timeout
  useEffect(() => {
    if (seconds <= 0 && !driverFound) {
      alert("No driver found. Please try again.");
      window.location.reload();
    }
  }, [seconds, driverFound]);

  return (
    <div className="min-h-screen flex flex-col">
      <UserNavber />

      <div className="flex flex-col items-center justify-center p-6">
        <h2 className="text-xl font-semibold mb-2">Searching for a driver...</h2>
        <p className="mb-4">Time remaining: {seconds} seconds</p>

        {userLatLng ? (
          <MapContainer
            center={userLatLng}
            zoom={15}
            className="h-96 w-full md:w-1/2 rounded-lg shadow"
          >
            <TileLayer
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              attribution='&copy; OpenStreetMap contributors'
            />
            <Marker position={userLatLng} icon={userIcon}>
              <Popup>Your Location</Popup>
            </Marker>
            <SearchWave center={userLatLng} maxRadius={1000} interval={50} />
          </MapContainer>
        ) : (
          <p>Fetching your location...</p>
        )}
      </div>

      <UserFooter />
    </div>
  );
};

export default SearchingDriver;
