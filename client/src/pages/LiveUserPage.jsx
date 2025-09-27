import React, { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { MapContainer, TileLayer, Marker, Polyline, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import axios from "axios";
import UserNavbar from "../components/UserNavber";
import ChatBox from "../components/ChatBox";

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
const carIcon = L.divIcon({
  className: "car-icon",
  html: `<div class="car-marker"></div>`,
  iconSize: [40, 40],
  iconAnchor: [20, 20],
});

// Follow driver on map
const FollowCar = ({ driverLatLng }) => {
  const map = useMap();
  useEffect(() => {
    if (driverLatLng) map.flyTo(driverLatLng, 17, { duration: 1.5 });
  }, [driverLatLng, map]);
  return null;
};

// Geocode address → lat/lng
const geocodeLocation = async (address) => {
  try {
    const res = await axios.get(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}`
    );
    if (res.data.length > 0) return [parseFloat(res.data[0].lat), parseFloat(res.data[0].lon)];
  } catch (err) {
    console.error(err);
  }
  return null;
};

// Calculate distance between two coordinates in meters
const getDistanceMeters = (lat1, lon1, lat2, lon2) => {
  const toRad = (deg) => (deg * Math.PI) / 180;
  const R = 6371000; // Earth radius in meters
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

const LiveUserPage = () => {
  const location = useLocation();
  const params = new URLSearchParams(location.search);
  const rideId = params.get("rideId");

  const [rideDetails, setRideDetails] = useState(null);
  const [driverLatLng, setDriverLatLng] = useState(null);
  const [pickupLatLng, setPickupLatLng] = useState(null);
  const [dropLatLng, setDropLatLng] = useState(null);
  const [routeCoords, setRouteCoords] = useState([]);
  const [userType, setUserType] = useState(null);
  const [rideStarted, setRideStarted] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [messages, setMessages] = useState([]);

  // Determine user type
  useEffect(() => {
    const profile = JSON.parse(localStorage.getItem("profile"));
    if (!profile) return;
    setUserType(profile.role);
  }, []);

  // Fetch ride details
  useEffect(() => {
    const fetchRide = async () => {
      try {
        const res = await axios.get(`http://localhost:3000/ride/${rideId}`);
        const ride = res.data;
        setRideDetails(ride);

        const pickup = await geocodeLocation(ride.pickup);
        const drop = await geocodeLocation(ride.destination);
        setPickupLatLng(pickup);
        setDropLatLng(drop);

        setDriverLatLng([ride.coordinates.lat, ride.coordinates.lng]);
      } catch (err) {
        console.error(err);
      }
    };
    if (rideId) fetchRide();
  }, [rideId]);

  // Fetch route
  useEffect(() => {
    const fetchRoute = async () => {
      if (!driverLatLng || !dropLatLng) return;
      try {
        const res = await axios.get(
          `https://router.project-osrm.org/route/v1/driving/${driverLatLng[1]},${driverLatLng[0]};${dropLatLng[1]},${dropLatLng[0]}?overview=full&geometries=geojson`
        );
        if (res.data.routes?.length > 0) {
          setRouteCoords(res.data.routes[0].geometry.coordinates.map(([lng, lat]) => [lat, lng]));
        }
      } catch (err) {
        console.error(err);
      }
    };
    fetchRoute();
  }, [driverLatLng, dropLatLng]);

  // Driver live location updates
  useEffect(() => {
    const socket = window.io?.();
    if (!socket || !rideDetails) return;

    socket.emit("registerCaptain", rideDetails.captain);

    const sendDriverLocation = () => {
      if (!navigator.geolocation) return;
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const coords = [pos.coords.latitude, pos.coords.longitude];
          setDriverLatLng(coords);

          // Auto-complete ride if within 50m of destination
          if (dropLatLng && getDistanceMeters(coords[0], coords[1], dropLatLng[0], dropLatLng[1]) < 50) {
            setRideStarted(false);
            alert("✅ Ride completed automatically. You have reached the destination!");
          }

          socket.emit("driverLocation", {
            rideId,
            lat: coords[0],
            lng: coords[1],
            userId: rideDetails.user,
          });
        },
        console.error,
        { enableHighAccuracy: true }
      );
    };

    sendDriverLocation(); // initial
    const intervalId = setInterval(sendDriverLocation, 5000);
    return () => clearInterval(intervalId);
  }, [rideDetails, rideId, dropLatLng]);

  const handleStartRide = () => setRideStarted(true);

  return (
    <div className="bg-gray-100 min-h-screen">
      <UserNavbar />

      <div className="max-w-7xl mx-auto py-8 px-4">
        <h1 className="text-3xl font-bold text-center text-gray-800 mb-8">Live Ride Tracking</h1>

        <div className="flex flex-col lg:flex-row gap-6">
          {/* Ride info */}
          <div className="lg:w-1/3 w-full bg-white rounded-3xl shadow-2xl p-6 border border-gray-200">
            {rideDetails ? (
              <>
                <p><b>Pickup:</b> {rideDetails.pickup}</p>
                <p><b>Drop:</b> {rideDetails.destination}</p>
                <p><b>Distance:</b> {rideDetails.distance} km</p>
                <p><b>ETA:</b> {rideDetails.duration} mins</p>
                <p><b>Price:</b> ₹{rideDetails.fare}</p>

                {userType === "driver" && !rideStarted && (
                  <button
                    onClick={handleStartRide}
                    className="mt-6 w-full py-3 bg-green-500 text-white rounded-2xl hover:bg-green-600"
                  >
                    Start Ride
                  </button>
                )}
              </>
            ) : (
              <p>Loading ride details...</p>
            )}
          </div>

          {/* Map */}
          <div className="lg:w-2/3 w-full h-[500px] rounded-3xl overflow-hidden shadow-2xl border border-gray-200">
            {dropLatLng && driverLatLng ? (
              <MapContainer center={driverLatLng} zoom={15} className="h-full w-full">
                <TileLayer
                  url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
                  attribution="&copy; OSM &copy; CARTO"
                />
                {!rideStarted && pickupLatLng && <Marker position={pickupLatLng} icon={pickupIcon} />}
                <Marker position={dropLatLng} icon={dropIcon} />
                <Marker position={driverLatLng} icon={carIcon} />
                {routeCoords.length > 0 && <Polyline positions={routeCoords} color="blue" weight={5} />}
                <FollowCar driverLatLng={driverLatLng} />
              </MapContainer>
            ) : (
              <p>Loading map...</p>
            )}
          </div>
        </div>
      </div>

      {showChat && rideDetails && (
        <ChatBox
          rideId={rideId}
          userId={rideDetails.user}
          captainId={rideDetails.captain}
          role={userType}
          messages={messages}
          setMessages={setMessages}
          onClose={() => setShowChat(false)}
        />
      )}
    </div>
  );
};

export default LiveUserPage;
