import React, { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import UserNavber from "../components/UserNavber";
import UserFooter from "../components/UserFooter";
import { MapContainer, TileLayer, Marker, Polyline, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import axios from "axios";
import { getSocket } from "../services/socket";
import { Phone, MessageCircle, Star, Car } from "lucide-react";
import ChatBox from "../components/ChatBox";

// 📍 Custom Icons
const pickupIcon = L.icon({ iconUrl: "/icons/Source_logo.png", iconSize: [40, 40], iconAnchor: [20, 40] });
const dropIcon = L.icon({ iconUrl: "/icons/destination_logo.png", iconSize: [40, 40], iconAnchor: [20, 40] });
const driverIcon = L.icon({ iconUrl: "/icons/taxi.png", iconSize: [40, 40], iconAnchor: [20, 40] });
const userIcon = L.icon({ iconUrl: "/icons/user.png", iconSize: [40, 40], iconAnchor: [20, 40] });

// 🔎 Fit map to markers
const FitBounds = ({ pickup, drop, driver, user }) => {
  const map = useMap();
  useEffect(() => {
    const bounds = [];
    if (pickup) bounds.push(pickup);
    if (drop) bounds.push(drop);
    if (driver) bounds.push(driver);
    if (user) bounds.push(user);
    if (bounds.length > 0) map.fitBounds(bounds, { padding: [50, 50] });
  }, [pickup, drop, driver, user, map]);
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

const UserRideLive = () => {
  const location = useLocation();
  const params = new URLSearchParams(location.search);
  const rideId = params.get("rideId");

  const [pickupLatLng, setPickupLatLng] = useState(null);
  const [dropLatLng, setDropLatLng] = useState(null);
  const [driverLatLng, setDriverLatLng] = useState(null);
  const [userLatLng, setUserLatLng] = useState(null);

  const [routeCoords, setRouteCoords] = useState([]);
  const [driverToUserCoords, setDriverToUserCoords] = useState([]);
  const [driverToUserInfo, setDriverToUserInfo] = useState({ distance: null, eta: null });

  const [rideDetails, setRideDetails] = useState(null);
  const [driverDetails, setDriverDetails] = useState(null);

  const [showChat, setShowChat] = useState(false); // NEW: chat visibility

  // ✅ Track user's live location
  useEffect(() => {
    if (!navigator.geolocation) return;
    const watchId = navigator.geolocation.watchPosition(
      (pos) => setUserLatLng([pos.coords.latitude, pos.coords.longitude]),
      (err) => console.error("Geolocation error:", err),
      { enableHighAccuracy: true }
    );
    return () => navigator.geolocation.clearWatch(watchId);
  }, []);

  // ✅ Fetch ride & driver details
  useEffect(() => {
    const fetchRide = async () => {
      try {
        const res = await axios.get(`http://localhost:3000/ride/${rideId}`);
        const rideData = res.data;
        setRideDetails(rideData);

        const pickupCoords = await geocodeLocation(rideData.pickup);
        const dropCoords = await geocodeLocation(rideData.destination);
        setPickupLatLng(pickupCoords);
        setDropLatLng(dropCoords);

        setDriverLatLng([rideData.coordinates.lat, rideData.coordinates.lng]);

        if (rideData.captain) {
          const driverRes = await axios.get(`http://localhost:3000/captain/${rideData.captain}`);
          setDriverDetails(driverRes.data);
        }
      } catch (error) {
        console.error("❌ Failed to fetch ride/driver:", error);
      }
    };
    if (rideId) fetchRide();
  }, [rideId]);

  // ✅ Fetch route pickup → drop
  useEffect(() => {
    const fetchRoute = async () => {
      if (!pickupLatLng || !dropLatLng) return;
      const url = `https://router.project-osrm.org/route/v1/driving/${pickupLatLng[1]},${pickupLatLng[0]};${dropLatLng[1]},${dropLatLng[0]}?overview=full&geometries=geojson`;
      const res = await axios.get(url);
      if (res.data.routes?.length > 0) {
        setRouteCoords(res.data.routes[0].geometry.coordinates.map(([lng, lat]) => [lat, lng]));
      }
    };
    fetchRoute();
  }, [pickupLatLng, dropLatLng]);

  // ✅ Fetch route driver → user
  useEffect(() => {
    const fetchDriverToUserRoute = async () => {
      if (!driverLatLng || !userLatLng) return;
      const url = `https://router.project-osrm.org/route/v1/driving/${driverLatLng[1]},${driverLatLng[0]};${userLatLng[1]},${userLatLng[0]}?overview=full&geometries=geojson`;
      const res = await axios.get(url);
      if (res.data.routes?.length > 0) {
        const route = res.data.routes[0];
        setDriverToUserCoords(route.geometry.coordinates.map(([lng, lat]) => [lat, lng]));
        setDriverToUserInfo({
          distance: (route.distance / 1000).toFixed(2),
          eta: Math.ceil(route.duration / 60),
        });
      }
    };
    fetchDriverToUserRoute();
  }, [driverLatLng, userLatLng]);

  // ✅ Listen for live driver location
  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;
    const handleDriverLocation = (data) => {
      if (data.rideId === rideId) setDriverLatLng([data.lat, data.lng]);
    };
    socket.on("driverLocation", handleDriverLocation);
    return () => socket.off("driverLocation", handleDriverLocation);
  }, [rideId]);

  return (
    <div className="min-h-screen flex flex-col">
      <UserNavber />

      <div className="flex flex-col md:flex-row gap-6 p-6 bg-gray-50">
        {/* Driver Info */}
        <div className="md:w-1/2 w-full p-6 rounded-2xl shadow-xl bg-white border border-gray-100">
          {/* OTP & Driver Details */}
          {rideDetails?.otp && (
            <div className="p-4 mb-6 bg-yellow-50 border border-yellow-200 rounded-xl text-center">
              <p className="text-gray-800">
                🔑 Share this OTP with the driver to start the ride:
                <span className="font-bold text-lg ml-2">{rideDetails.otp}</span>
              </p>
              <button
                className="mt-2 px-4 py-1 bg-yellow-400 text-white rounded-xl hover:bg-yellow-500 transition"
                onClick={() => navigator.clipboard.writeText(rideDetails.otp)}
              >
                Copy OTP
              </button>
            </div>
          )}

          {driverDetails && (
            <>
              {/* Driver Info */}
              <div className="flex items-center gap-4 mb-6">
                <img src={driverDetails.photo || "/icons/user.png"} alt="Driver" className="w-16 h-16 rounded-full object-cover border" />
                <div>
                  <h2 className="text-xl font-semibold text-gray-900">{driverDetails.username}</h2>
                  <div className="flex items-center text-yellow-500">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star key={i} size={16} className={i < Math.floor(driverDetails.rating || 0) ? "fill-yellow-500" : ""} />
                    ))}
                    <span className="ml-2 text-sm text-gray-600">{(driverDetails.rating || 0).toFixed(1)}</span>
                  </div>
                </div>
              </div>

              {/* Vehicle */}
              <div className="flex items-center gap-3 bg-gray-100 p-3 rounded-xl mb-6">
                <Car className="text-gray-600" />
                <div>
                  <p className="font-medium text-gray-800">{driverDetails.vehicle || "-"}</p>
                  <p className="text-sm text-gray-500">{driverDetails.vehicleType || "-"}</p>
                </div>
              </div>

              {/* Trip info */}
              <div className="grid grid-cols-3 text-center mb-6">
                <div>
                  <p className="text-lg font-semibold text-gray-900">{rideDetails?.distance} km</p>
                  <p className="text-sm text-gray-500">Trip Distance</p>
                </div>
                <div>
                  <p className="text-lg font-semibold text-gray-900">{rideDetails?.duration} mins</p>
                  <p className="text-sm text-gray-500">Trip ETA</p>
                </div>
                <div>
                  <p className="text-lg font-semibold text-gray-900">₹{rideDetails?.price || 0}</p>
                  <p className="text-sm text-gray-500">Price</p>
                </div>
              </div>

              {/* Driver distance info */}
              {driverToUserInfo.distance && (
                <div className="p-4 bg-blue-50 rounded-xl text-center mb-6">
                  <p className="text-gray-700">
                    🚖 Driver is <b>{driverToUserInfo.distance} km</b> away, reaching in <b>{driverToUserInfo.eta} mins</b>.
                  </p>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-4">
                <button className="flex-1 flex items-center justify-center gap-2 bg-green-500 text-white py-2 rounded-xl shadow hover:bg-green-600 transition">
                  <Phone size={18} /> Call
                </button>
                <button
                  className="flex-1 flex items-center justify-center gap-2 bg-blue-500 text-white py-2 rounded-xl shadow hover:bg-blue-600 transition"
                  onClick={() => setShowChat(true)} // SHOW CHAT
                >
                  <MessageCircle size={18} /> Message
                </button>
              </div>
            </>
          )}
        </div>

        {/* Map */}
        <div className="md:w-1/2 h-96 w-full rounded-2xl overflow-hidden shadow-lg border border-gray-100">
          {pickupLatLng && dropLatLng && (
            <MapContainer center={pickupLatLng} zoom={13} className="h-full w-full">
              <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution="&copy; OpenStreetMap contributors" />
              <Marker position={pickupLatLng} icon={pickupIcon} />
              <Marker position={dropLatLng} icon={dropIcon} />
              {driverLatLng && <Marker position={driverLatLng} icon={driverIcon} />}
              {userLatLng && <Marker position={userLatLng} icon={userIcon} />}
              {routeCoords.length > 0 && <Polyline positions={routeCoords} color="blue" weight={5} />}
              {driverToUserCoords.length > 0 && <Polyline positions={driverToUserCoords} color="red" weight={4} dashArray="8 6" />}
              <FitBounds pickup={pickupLatLng} drop={dropLatLng} driver={driverLatLng} user={userLatLng} />
            </MapContainer>
          )}
        </div>
      </div>

      {/* Chat Box */}
      {rideDetails && showChat && (
        <ChatBox
          rideId={rideId}
          userId={rideDetails.userId}
          captainId={rideDetails.captain}
          role="user"
          onClose={() => setShowChat(false)}
        />
      )}

      <UserFooter />
    </div>
  );
};

export default UserRideLive;
