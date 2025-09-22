import React, { useEffect, useState, useRef } from "react";
import UserNavber from "../components/UserNavber";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import { useNavigate } from "react-router-dom";
import "leaflet/dist/leaflet.css";
import UserFooter from "../components/UserFooter";
import { io } from "socket.io-client";

// Custom Taxi Icon
const taxiIcon = L.icon({
  iconUrl: "/icons/taxi.png",
  iconSize: [40, 40],
  iconAnchor: [20, 40],
  popupAnchor: [0, -40],
});

// Recenter Map Component
const RecenterMap = ({ location }) => {
  const map = useMap();
  useEffect(() => {
    if (location) map.setView(location, map.getZoom());
  }, [location, map]);
  return null;
};

const FindUser = () => {
  const [driverLocation, setDriverLocation] = useState(null);
  const [rideRequest, setRideRequest] = useState(null);
  const socketRef = useRef(null);
  const captain = JSON.parse(localStorage.getItem("captain"));
  const navigate = useNavigate();

  // ✅ Initialize socket once
  useEffect(() => {
    const socket = io("http://localhost:3000", { transports: ["websocket"] });
    socketRef.current = socket;

    socket.on("connect", () => {
      console.log("✅ Captain connected:", socket.id);
      if (captain?._id) socket.emit("registerCaptain", captain._id);
    });

    socket.on("newRide", (ride) => {
      console.log("🚖 New ride received:", ride);
      setRideRequest(ride);
    });
    console.log("🚖 Ride request:", rideRequest);

    return () => socket.disconnect();
  }, [captain?._id]);

  // ✅ Update location every 30s
  useEffect(() => {
    if (!navigator.geolocation) return;

    const updateLocation = () => {
      navigator.geolocation.getCurrentPosition(
        (pos) => setDriverLocation([pos.coords.latitude, pos.coords.longitude]),
        (err) => console.error("Geolocation error:", err)
      );
    };

    updateLocation(); // initial fetch
    const interval = setInterval(updateLocation, 30000);
    return () => clearInterval(interval);
  }, []); // empty dependency, runs only once

  // ✅ Accept Ride
  const handleAcceptRide = () => {
    if (!rideRequest || !socketRef.current || !captain) return;

    socketRef.current.emit("acceptRide", {
      rideId: rideRequest.rideId,
      captainId: captain._id,
      captain: {
        name: captain.username,
        email: captain.email,
        location: driverLocation,
      },
    });

    console.log("✅ Ride accepted sent to backend");
    setRideRequest(null);
    navigate(`/captain-ride-live?rideId=${rideRequest.rideId}&captainId=${captain._id}`);
  };

  return (
    <div className="min-h-screen flex flex-col">
      <UserNavber />

      <div className="flex gap-6 p-6">
        <div className="w-full md:w-1/2">
          <h3 className="text-xl font-bold">New Ride Request</h3>

          {rideRequest ? (
            <div className="mt-2 p-4 bg-white shadow rounded-lg">
              <p><strong>Pickup:</strong> {rideRequest.pickup}</p>
              <p><strong>Drop:</strong> {rideRequest.drop}</p>
              <button
                className="mt-3 px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
                onClick={handleAcceptRide}
              >
                Accept Ride
              </button>
            </div>
          ) : (
            <p className="text-gray-500 mt-2">Waiting for ride requests...</p>
          )}
        </div>

        <div className="hidden md:block h-96 w-full rounded-lg overflow-hidden shadow">
          {driverLocation ? (
            <MapContainer center={driverLocation} zoom={13} className="h-full w-full">
              <TileLayer
                attribution='&copy; OpenStreetMap contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              <Marker position={driverLocation} icon={taxiIcon}>
                <Popup>🚖 You are here <br /> Updated every 30s!</Popup>
              </Marker>
              <RecenterMap location={driverLocation} />
            </MapContainer>
          ) : (
            <p className="text-gray-500">Fetching your location...</p>
          )}
        </div>
      </div>

      <UserFooter />
    </div>
  );
};

export default FindUser;
