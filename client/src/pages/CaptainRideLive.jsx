import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import UserNavber from "../components/UserNavber";
import UserFooter from "../components/UserFooter";
import { MapContainer, TileLayer, Marker, Polyline, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import axios from "axios";
import { getSocket } from "../services/socket";
import ChatBox from "../components/ChatBox";

// 📍 Custom Icons
const pickupIcon = L.icon({ iconUrl: "/icons/Source_logo.png", iconSize: [40, 40], iconAnchor: [20, 40] });
const dropIcon = L.icon({ iconUrl: "/icons/destination_logo.png", iconSize: [40, 40], iconAnchor: [20, 40] });
const driverIcon = L.icon({ iconUrl: "/icons/taxi.png", iconSize: [40, 40], iconAnchor: [20, 40] });

// 🔎 Fit map to markers
const FitBounds = ({ pickup, drop, driver }) => {
  const map = useMap();
  useEffect(() => {
    const bounds = [];
    if (pickup) bounds.push(pickup);
    if (drop) bounds.push(drop);
    if (driver) bounds.push(driver);
    if (bounds.length > 0) map.fitBounds(bounds, { padding: [50, 50] });
  }, [pickup, drop, driver, map]);
  return null;
};

// 🌐 Geocode address → [lat, lng]
const geocodeLocation = async (address) => {
  try {
    const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}`;
    const res = await axios.get(url);
    if (res.data.length > 0) return [parseFloat(res.data[0].lat), parseFloat(res.data[0].lon)];
  } catch (error) {
    console.error("❌ Geocode error:", error);
  }
  return null;
};

const CaptainRideLive = () => {
  const location = useLocation();
  const params = new URLSearchParams(location.search);
  const rideId = params.get("rideId");
  const navigate = useNavigate();

  const [rideDetails, setRideDetails] = useState(null);
  const [driverLatLng, setDriverLatLng] = useState(null);
  const [pickupLatLng, setPickupLatLng] = useState(null);
  const [dropLatLng, setDropLatLng] = useState(null);
  const [routeCoords, setRouteCoords] = useState([]);
  const [otpInput, setOtpInput] = useState("");
  const [showChat, setShowChat] = useState(false); // NEW: chat visibility

  // ✅ Fetch ride details
  useEffect(() => {
    const fetchRide = async () => {
      try {
        const res = await axios.get(`http://localhost:3000/ride/${rideId}`);
        const ride = res.data;
        setRideDetails(ride);
        setDriverLatLng([ride.coordinates.lat, ride.coordinates.lng]);

        const pickupCoords = await geocodeLocation(ride.pickup);
        const dropCoords = await geocodeLocation(ride.destination);
        setPickupLatLng(pickupCoords);
        setDropLatLng(dropCoords);
      } catch (err) {
        console.error("❌ Failed to fetch ride:", err);
      }
    };
    if (rideId) fetchRide();
  }, [rideId]);

  // ✅ Fetch route driver → drop
  useEffect(() => {
    const fetchRoute = async () => {
      if (!driverLatLng || !dropLatLng) return;
      const url = `https://router.project-osrm.org/route/v1/driving/${driverLatLng[1]},${driverLatLng[0]};${dropLatLng[1]},${dropLatLng[0]}?overview=full&geometries=geojson`;
      const res = await axios.get(url);
      if (res.data.routes?.length > 0) {
        setRouteCoords(res.data.routes[0].geometry.coordinates.map(([lng, lat]) => [lat, lng]));
      }
    };
    fetchRoute();
  }, [driverLatLng, dropLatLng]);

  // ✅ Real-time driver location updates
  useEffect(() => {
    const socket = getSocket();
    if (!socket || !rideDetails) return;

    socket.emit("registerCaptain", rideDetails.captain || "unknown");

    const handleDriverLocation = (data) => {
      if (data.rideId === rideId) setDriverLatLng([data.lat, data.lng]);
    };

    socket.on("driverLocation", handleDriverLocation);

    const watchId = navigator.geolocation.watchPosition(
      (pos) => {
        const coords = [pos.coords.latitude, pos.coords.longitude];
        setDriverLatLng(coords);
        socket.emit("driverLocation", { rideId, lat: coords[0], lng: coords[1], userId: rideDetails.userId });
      },
      console.error,
      { enableHighAccuracy: true }
    );

    return () => {
      navigator.geolocation.clearWatch(watchId);
      socket.off("driverLocation", handleDriverLocation);
    };
  }, [rideId, rideDetails]);

  // ✅ Handle OTP submission
  const handleStartRide = () => {
    if (parseInt(otpInput) === parseInt(rideDetails?.otp)) {
      alert("✅ Ride started!");
      navigate("/live-driver?rideId=" + rideId);
    } else {
      alert("❌ Incorrect OTP!");
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <UserNavber />

      <div className="flex flex-col md:flex-row gap-6 p-6 bg-gray-50">
        {/* Ride Details & OTP */}
        <div className="md:w-1/2 w-full p-6 rounded-2xl shadow-xl bg-white border border-gray-100">
          <h2 className="text-2xl font-semibold mb-4">Ride Details</h2>
          {rideDetails ? (
            <>
              <p><b>Pickup:</b> {rideDetails.pickup}</p>
              <p><b>Drop:</b> {rideDetails.destination}</p>
              <p><b>Distance:</b> {rideDetails.distance} km</p>
              <p><b>ETA:</b> {rideDetails.duration} mins</p>
              <p><b>Price:</b> ₹{rideDetails.price}</p>

              <div className="mt-6">
                <label className="block mb-2 font-medium">Enter OTP to start ride</label>
                <input
                  type="text"
                  value={otpInput}
                  onChange={(e) => setOtpInput(e.target.value)}
                  className="w-full p-2 border rounded-xl mb-2"
                  placeholder="Enter OTP"
                />
                <button
                  onClick={handleStartRide}
                  className="w-full py-2 bg-green-500 text-white rounded-xl hover:bg-green-600 transition"
                >
                  Start Ride
                </button>
              </div>

              {/* Message button */}
              <button
                onClick={() => setShowChat(true)}
                className="mt-4 w-full py-2 bg-blue-500 text-white rounded-xl hover:bg-blue-600 transition"
              >
                Message
              </button>
            </>
          ) : (
            <p>Loading ride details...</p>
          )}
        </div>

        {/* Map */}
        <div className="md:w-1/2 h-96 w-full rounded-2xl overflow-hidden shadow-lg border border-gray-100">
          {pickupLatLng && dropLatLng && driverLatLng ? (
            <MapContainer center={driverLatLng} zoom={13} className="h-full w-full">
              <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution="&copy; OpenStreetMap contributors" />
              <Marker position={pickupLatLng} icon={pickupIcon} />
              <Marker position={dropLatLng} icon={dropIcon} />
              <Marker position={driverLatLng} icon={driverIcon} />
              {routeCoords.length > 0 && <Polyline positions={routeCoords} color="blue" weight={5} />}
              <FitBounds pickup={pickupLatLng} drop={dropLatLng} driver={driverLatLng} />
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
          userId={rideDetails.userId}
          captainId={rideDetails.captain}
          role="captain"
          onClose={() => setShowChat(false)}
        />
      )}

      <UserFooter />
    </div>
  );
};

export default CaptainRideLive;
