import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import UserNavber from "../components/UserNavber";
import UserFooter from "../components/UserFooter";
import { MapContainer, TileLayer, Marker, Polyline, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import axios from "axios";
import { getSocket } from "../services/socket";
import { MessageCircle, Star, Car } from "lucide-react";
import ChatBox from "../components/ChatBox";
import RideCall from "../components/RideCall";

// 📍 Custom Icons
const pickupIcon = L.icon({ iconUrl: "/icons/Source_logo.png", iconSize: [40, 40], iconAnchor: [20, 40] });
const dropIcon = L.icon({ iconUrl: "/icons/destination_logo.png", iconSize: [40, 40], iconAnchor: [20, 40] });
const driverIcon = L.icon({ iconUrl: "/icons/taxi.png", iconSize: [50, 50], iconAnchor: [25, 25] });
const userIcon = L.icon({ iconUrl: "/icons/taxi.png", iconSize: [40, 40], iconAnchor: [20, 40] });

// 🔎 Auto-follow driver
const FollowDriver = ({ driver }) => {
  const map = useMap();
  useEffect(() => {
    if (driver) {
      map.setView(driver, 17, { animate: true });
    }
  }, [driver, map]);
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
  const navigate = useNavigate();

  const [pickupLatLng, setPickupLatLng] = useState(null);
  const [dropLatLng, setDropLatLng] = useState(null);
  const [driverLatLng, setDriverLatLng] = useState(null);
  const [userLatLng, setUserLatLng] = useState(null);

  const [routeCoords, setRouteCoords] = useState([]);
  const [driverToUserInfo, setDriverToUserInfo] = useState({ distance: null, eta: null });
  const [messages, setMessages] = useState([]);
  const [rideDetails, setRideDetails] = useState(null);
  const [driverDetails, setDriverDetails] = useState(null);

  const [rideStarted, setRideStarted] = useState(false);
  const [showChat, setShowChat] = useState(false);

  // ✅ Auto-open chat when captain sends first message
  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;

    const handleIncomingMessage = (msg) => {
      if (msg.rideId === rideId && msg.sender === "captain") {
        setMessages((prev) => [...prev, msg]);
        setShowChat(true);
      }
    };

    socket.on("chatMessage", handleIncomingMessage);
    return () => socket.off("chatMessage", handleIncomingMessage);
  }, [rideId]);

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

  // ✅ Fetch route (driver→pickup OR driver→drop)
 // ✅ Fetch route (driver→pickup OR driver→drop)
useEffect(() => {
  if (!driverLatLng || !pickupLatLng || !dropLatLng) return;

  const fetchRoute = async () => {
    const start = driverLatLng;
    const end = rideStarted ? dropLatLng : pickupLatLng;

    try {
      const { data } = await axios.get(
        `https://router.project-osrm.org/route/v1/driving/${start[1]},${start[0]};${end[1]},${end[0]}?overview=full&geometries=geojson`
      );

      const coords =
        data.routes[0]?.geometry?.coordinates?.map(([lng, lat]) => [lat, lng]) || [];
      setRouteCoords(coords);

      // ✅ Show distance & ETA before ride starts
      if (!rideStarted && data.routes[0]) {
        setDriverToUserInfo({
          distance: (data.routes[0].distance / 1000).toFixed(2),
          eta: Math.ceil(data.routes[0].duration / 60),
        });
      }
    } catch (err) {
      console.error("❌ Error fetching route:", err);
    }
  };

  fetchRoute();
}, [driverLatLng, pickupLatLng, dropLatLng, rideStarted]);


  // ✅ Socket: listen for RideStart event
  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;
    socket.on("RideStart", () => setRideStarted(true));
    return () => socket.off("RideStart");
  }, []);

  // ✅ Listen for live driver location (only from socket)
  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;

    const handleDriverLocation = (data) => {
      if (data.rideId === rideId) {
        console.log("🚖 Driver location:", data);
        setDriverLatLng([data.lat, data.lng]); // [lat, lng]
      }
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
          {!rideStarted && rideDetails?.otp && (
            <div className="p-4 mb-6 bg-yellow-50 border border-yellow-200 rounded-xl text-center">
              <p className="text-gray-800">
                🔑 Share this OTP with the driver to start the ride:
                <span className="font-bold text-lg ml-2">{rideDetails.otp}</span>
              </p>
            </div>
          )}

          {driverDetails && (
            <>
              <div className="flex items-center gap-4 mb-6">
                <img
                  src={driverDetails.photo || "https://t3.ftcdn.net/jpg/01/02/03/80/360_F_102038045_1ropJBtqleEFaOu7V37WWpOe7ccUZM7R.jpg"}
                  alt="Driver"
                  className="w-16 h-16 rounded-full object-cover border"
                />
                <div>
                  <h2 className="text-xl font-semibold text-gray-900">{driverDetails.username}</h2>
                  <div className="flex items-center text-yellow-500">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star
                        key={i}
                        size={16}
                        className={i < Math.floor(driverDetails.rating || 0) ? "fill-yellow-500" : ""}
                      />
                    ))}
                    <span className="ml-2 text-sm text-gray-600">{(driverDetails.rating || 0).toFixed(1)}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3 bg-gray-100 p-3 rounded-xl mb-6">
                <Car className="text-gray-600" />
                <div>
                  <p className="font-medium text-gray-800">{driverDetails.vehicle || "-"}</p>
                  <p className="text-sm text-gray-500">{driverDetails.vehicleType || "-"}</p>
                </div>
              </div>

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
                  <p className="text-lg font-semibold text-gray-900">₹{rideDetails?.fare || 0}</p>
                  <p className="text-sm text-gray-500">Price</p>
                </div>
              </div>

              {!rideStarted && driverToUserInfo.distance && (
                <div className="p-4 bg-blue-50 rounded-xl text-center mb-6">
                  <p className="text-gray-700">
                    🚖 Driver is <b>{driverToUserInfo.distance} km</b> away, reaching in <b>{driverToUserInfo.eta} mins</b>.
                  </p>
                </div>
              )}

              <div className="flex gap-4">
                <RideCall userId={rideDetails?.user} peerId={rideDetails?.captain} />
                <button
                  className="flex-1 flex items-center justify-center gap-2 bg-blue-500 text-white py-2 rounded-xl shadow hover:bg-blue-600 transition"
                  onClick={() => setShowChat(true)}
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
            <MapContainer center={pickupLatLng} zoom={15} style={{ height: "100%", width: "100%" }}>
              <TileLayer
                url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
                attribution="&copy; <a href='https://www.openstreetmap.org/copyright'>OSM</a> &copy; <a href='https://carto.com/'>CARTO</a>"
              />

              <Marker position={pickupLatLng} icon={pickupIcon} />
              <Marker position={dropLatLng} icon={dropIcon} />
              {driverLatLng && <Marker position={driverLatLng} icon={driverIcon} />}
              {userLatLng && !rideStarted && <Marker position={userLatLng} icon={userIcon} />}

              {routeCoords.length > 0 && <Polyline positions={routeCoords} color="blue" weight={5} />}
              {driverLatLng && <FollowDriver driver={driverLatLng} />}
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
          messages={messages}
          setMessages={setMessages}
          onClose={() => setShowChat(false)}
        />
      )}

      <UserFooter />
    </div>
  );
};

export default UserRideLive;
