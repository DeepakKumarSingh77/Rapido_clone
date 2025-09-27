import React, { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import UserNavber from "../components/UserNavber";
import UserFooter from "../components/UserFooter";
import {
  MapContainer,
  TileLayer,
  Marker,
  Polyline,
  useMap,
} from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import axios from "axios";
import { getSocket } from "../services/socket";
import ChatBox from "../components/ChatBox";
import RideCall from "../components/RideCall";

// Custom Icons
const pickupIcon = L.icon({
  iconUrl: "/icons/Source_logo.png",
  iconSize: [40, 40],
  iconAnchor: [20, 40],
});
const dropIcon = L.icon({
  iconUrl: "/icons/destination_logo.png",
  iconSize: [40, 40],
  iconAnchor: [20, 40],
});
const driverIcon = L.icon({
  iconUrl: "/icons/taxi.png",
  iconSize: [50, 50],
  iconAnchor: [25, 25],
});

// Follow driver on map
const FollowDriver = ({ driver }) => {
  const map = useMap();
  useEffect(() => {
    if (driver) map.panTo(driver, { animate: true });
  }, [driver, map]);
  return null;
};

// Geocode address
const geocodeLocation = async (address) => {
  try {
    const res = await axios.get(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
        address
      )}`
    );
    // console.log("heelo", res.data);
    // console.log("bye", address);
    if (res.data.length > 0)
      return [parseFloat(res.data[0].lat), parseFloat(res.data[0].lon)];
  } catch (err) {
    // console.error(err);
  }
  return null;
};

const CaptainRideLive = () => {
  const location = useLocation();
  const params = new URLSearchParams(location.search);
  const rideId = params.get("rideId");

  const [rideDetails, setRideDetails] = useState(null);
  const [driverLatLng, setDriverLatLng] = useState(null);
  const [pickupLatLng, setPickupLatLng] = useState(null);
  const [dropLatLng, setDropLatLng] = useState(null);
  const [routeCoords, setRouteCoords] = useState([]);
  const [rideStarted, setRideStarted] = useState(false);
  const [otpInput, setOtpInput] = useState("");
  const [showChat, setShowChat] = useState(false);
  const [messages, setMessages] = useState([]);

  if ("geolocation" in navigator) {
    navigator.geolocation.watchPosition(
      (pos) => {
        // console.log(
        //   "📍 Current location:",
        //   pos.coords.latitude,
        //   pos.coords.longitude
        // );
      },
      (err) => {
        // console.error("❌ Location error:", err)
      },
      { enableHighAccuracy: true, maximumAge: 0, timeout: 5000 }
    );
  } else {
    console.error("❌ Geolocation not supported in this browser.");
  }

  // Auto-open chat when user sends a message
  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;

    const handleIncomingMessage = (msg) => {
      if (msg.rideId === rideId && msg.sender === "user") {
        setMessages((prev) => [...prev, msg]);
        setShowChat(true);
      }
    };

    socket.on("chatMessage", handleIncomingMessage);

    return () => socket.off("chatMessage", handleIncomingMessage);
  }, [rideId]);

  // Fetch ride details and coordinates
  useEffect(() => {
    const fetchRide = async () => {
      try {
        const res = await axios.get(`http://localhost:3000/ride/${rideId}`);
        const ride = res.data;
        setRideDetails(ride);
        console.log(ride);

        const pickupCoords = await geocodeLocation(ride.pickup);
        const dropCoords = await geocodeLocation(ride.destination);
        console.log(pickupCoords, dropCoords);
        setPickupLatLng(pickupCoords);
        setDropLatLng(dropCoords);

        // Initial driver location = pickup location
        // setDriverLatLng(pickupCoords);
      } catch (err) {
        // console.error(err);
      }
    };
    if (rideId) fetchRide();
  }, [rideId]);

  // Fetch route coordinates
  useEffect(() => {
  if (!driverLatLng || !pickupLatLng || !dropLatLng) return;

  const fetchRoute = async () => {
    const start = driverLatLng;
    const end = rideStarted ? dropLatLng : pickupLatLng;
    console.log(start, end);

    try {
      const { data } = await axios.get(
        `https://router.project-osrm.org/route/v1/driving/${start[1]},${start[0]};${end[1]},${end[0]}?overview=full&geometries=geojson`
      );

      const coords = data.routes[0]?.geometry?.coordinates?.map(
        ([lng, lat]) => [lat, lng]
      ) || [];
      // console.log(data);
      setRouteCoords(coords);
    } catch (err) {
      console.error('Error fetching route:', err);
    }
  };

  fetchRoute();
}, [driverLatLng, pickupLatLng, dropLatLng, rideStarted]);


  // Real-time driver updates every 5 seconds
  // Real-time driver updates every 5 seconds
  useEffect(() => {
    const socket = getSocket();
    if (!socket || !rideDetails) return;

    socket.emit("registerCaptain", rideDetails.captain);

    if (!navigator.geolocation) return;

    let latestCoords = null;

    const watchId = navigator.geolocation.watchPosition(
      (pos) => {
        latestCoords = [pos.coords.latitude, pos.coords.longitude];
        console.log("📍 Current location:", latestCoords) ;
        setDriverLatLng(latestCoords); // update map immediately
      },
      (err) => {
        console.error("Geolocation error:", err)
      },
      { enableHighAccuracy: true, maximumAge: 0, timeout: 5000 }
    );

    // ✅ Emit only every 5s
    const interval = setInterval(() => {
      if (latestCoords) {
        socket.emit("driverLocation", {
          rideId,
          lat: latestCoords[0],
          lng: latestCoords[1],
          userId: rideDetails.userId, // make sure this matches your backend
        });
      }
    }, 5000);

    return () => {
      navigator.geolocation.clearWatch(watchId);
      clearInterval(interval);
    };
  }, [rideDetails, rideId]);

  // OTP handling
  const handleStartRide = () => {
    if (parseInt(otpInput) === parseInt(rideDetails?.otp)) {
      setRideStarted(true);
      const socket = getSocket();
      socket.emit("RideStart", { rideId, userId: rideDetails.user });
    } else alert("Incorrect OTP");
  };

  return (
    <div className="min-h-screen flex flex-col">
      <UserNavber />
      <div className="flex flex-col md:flex-row gap-6 p-6 bg-gray-50">
        {/* Ride Details */}
        <div className="md:w-1/2 w-full p-6 rounded-2xl shadow-xl bg-white border border-gray-100">
          <h2 className="text-2xl font-semibold mb-4">Ride Details</h2>
          {rideDetails ? (
            <>
              <p>
                <b>Pickup:</b> {rideDetails.pickup}
              </p>
              <p>
                <b>Drop:</b> {rideDetails.destination}
              </p>
              <p>
                <b>Distance:</b> {rideDetails.distance} km
              </p>
              <p>
                <b>ETA:</b> {rideDetails.duration} mins
              </p>
              <p>
                <b>Price:</b> ₹{rideDetails.fare}
              </p>

              {!rideStarted && (
                <>
                  <label className="block mt-4 mb-2 font-medium">
                    Enter OTP
                  </label>
                  <input
                    value={otpInput}
                    onChange={(e) => setOtpInput(e.target.value)}
                    className="w-full p-2 border rounded-xl"
                  />
                  <button
                    onClick={handleStartRide}
                    className="w-full mt-2 py-2 bg-green-500 text-white rounded-xl hover:bg-green-600 cursor-pointer"
                  >
                    Start Ride
                  </button>
                </>
              )}

              <div className="w-full flex justify-center mt-3 bg-green-500 text-white rounded-xl hover:bg-green-600 transition cursor-pointer">
                <RideCall
                  userId={rideDetails.captain}
                  peerId={rideDetails.user}
                />
              </div>

              <button
                onClick={() => setShowChat(true)}
                className="mt-4 w-full py-2 bg-blue-500 text-white rounded-xl hover:bg-blue-600 cursor-pointer"
              >
                Message
              </button>
            </>
          ) : (
            <p>Loading ride...</p>
          )}
        </div>

        {/* Map */}
        <div className="md:w-1/2 h-96 w-full rounded-2xl overflow-hidden shadow-lg border border-gray-100">
          {pickupLatLng && dropLatLng && driverLatLng ? (
            <MapContainer
              center={driverLatLng}
              zoom={15}
              className="h-full w-full"
            >
              <TileLayer
                url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
                attribution="&copy; OSM &copy; CARTO"
              />
              {!rideStarted && (
                <Marker position={pickupLatLng} icon={pickupIcon} />
              )}
              <Marker position={dropLatLng} icon={dropIcon} />
              <Marker position={driverLatLng} icon={driverIcon} />
              {routeCoords.length > 0 && (
                <Polyline positions={routeCoords} color="blue" weight={5} />
              )}
              <FollowDriver driver={driverLatLng} />
            </MapContainer>
          ) : (
            <p className="text-gray-500 p-4">Loading map...</p>
          )}
        </div>
      </div>

      {/* Chat Box */}
      {showChat && rideDetails && (
        <ChatBox
          rideId={rideId}
          userId={rideDetails.user}
          captainId={rideDetails.captain}
          role="captain"
          messages={messages}
          setMessages={setMessages}
          onClose={() => setShowChat(false)}
        />
      )}

      <UserFooter />
    </div>
  );
};

export default CaptainRideLive;
