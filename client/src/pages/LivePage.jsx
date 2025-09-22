import React, { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { MapContainer, TileLayer, Marker, Polyline, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { getSocket } from "../services/socket";
import axios from "axios";
import UserNavbar from "../components/UserNavber";

// 📍 Custom Icons
const pickupIcon = L.icon({ iconUrl: "/icons/Source_logo.png", iconSize: [40, 40], iconAnchor: [20, 40] });
const dropIcon = L.icon({ iconUrl: "/icons/destination_logo.png", iconSize: [40, 40], iconAnchor: [20, 40] });
const driverIcon = L.icon({ iconUrl: "/icons/taxi.png", iconSize: [40, 40], iconAnchor: [20, 40] });

// Fit map bounds
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

const LivePage = () => {
  const location = useLocation();
  const params = new URLSearchParams(location.search);
  const rideId = params.get("rideId");

  const [rideDetails, setRideDetails] = useState(null);
  const [driverLatLng, setDriverLatLng] = useState(null);
  const [pickupLatLng, setPickupLatLng] = useState(null);
  const [dropLatLng, setDropLatLng] = useState(null);
  const [routeCoords, setRouteCoords] = useState([]);
  const [userType, setUserType] = useState(null);

  // Determine user type
  useEffect(() => {
    const driver = JSON.parse(localStorage.getItem("captain"));
    const user = JSON.parse(localStorage.getItem("user"));
    if (driver) setUserType("driver");
    else if (user) setUserType("user");
  }, []);

  // Fetch ride details
  useEffect(() => {
    const fetchRide = async () => {
      try {
        const res = await axios.get(`http://localhost:3000/ride/${rideId}`);
        const ride = res.data;
        setRideDetails(ride);
        setDriverLatLng([ride.coordinates.lat, ride.coordinates.lng]);
        const pickup = await geocodeLocation(ride.pickup);
        const drop = await geocodeLocation(ride.destination);
        setPickupLatLng(pickup);
        setDropLatLng(drop);
      } catch (err) {
        console.error(err);
      }
    };
    if (rideId) fetchRide();
  }, [rideId]);

  // Fetch route driver → drop
  useEffect(() => {
    const fetchRoute = async () => {
      if (!driverLatLng || !dropLatLng) return;
      const res = await axios.get(
        `https://router.project-osrm.org/route/v1/driving/${driverLatLng[1]},${driverLatLng[0]};${dropLatLng[1]},${dropLatLng[0]}?overview=full&geometries=geojson`
      );
      if (res.data.routes?.length > 0) {
        setRouteCoords(res.data.routes[0].geometry.coordinates.map(([lng, lat]) => [lat, lng]));
      }
    };
    fetchRoute();
  }, [driverLatLng, dropLatLng]);

  // Listen for driver location via socket
  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;
    const handleDriverLocation = (data) => {
      if (data.rideId === rideId) setDriverLatLng([data.lat, data.lng]);
    };
    socket.on("driverLocation", handleDriverLocation);
    return () => socket.off("driverLocation", handleDriverLocation);
  }, [rideId]);

  // Driver emits location
  useEffect(() => {
    if (userType !== "driver") return;
    const socket = getSocket();
    if (!socket) return;

    const watchId = navigator.geolocation.watchPosition(
      (pos) => {
        const coords = [pos.coords.latitude, pos.coords.longitude];
        setDriverLatLng(coords);
        socket.emit("driverLocation", { rideId, lat: coords[0], lng: coords[1], userId: rideDetails?.userId });
      },
      console.error,
      { enableHighAccuracy: true }
    );

    return () => navigator.geolocation.clearWatch(watchId);
  }, [userType, rideId, rideDetails]);

  const handleCompleteRide = () => {
    alert("Ride marked as completed!");
  };

  return (
    <div className="bg-gray-100 min-h-screen">
      <UserNavbar />

      <div className="max-w-7xl mx-auto py-8 px-4">
        <h1 className="text-3xl font-bold text-center text-gray-800 mb-8">Live Ride Tracking</h1>

        <div className="flex flex-col lg:flex-row gap-6">
          {/* Ride info panel */}
          <div className="lg:w-1/3 h-76 w-full bg-white rounded-3xl shadow-2xl p-6 border border-gray-200">
            {rideDetails ? (
              <>
                <div className="space-y-3">
                  <p className="text-gray-700"><span className="font-semibold">Pickup:</span> {rideDetails.pickup}</p>
                  <p className="text-gray-700"><span className="font-semibold">Drop:</span> {rideDetails.destination}</p>
                  <p className="text-gray-700"><span className="font-semibold">Distance:</span> {rideDetails.distance} km</p>
                  <p className="text-gray-700"><span className="font-semibold">ETA:</span> {rideDetails.duration} mins</p>
                  <p className="text-gray-700"><span className="font-semibold">Price:</span> ₹{rideDetails.price}</p>
                </div>

                {userType === "driver" && (
                  <button
                    className="mt-6 w-full py-3 bg-blue-600 text-white font-semibold rounded-2xl hover:bg-blue-700 transition duration-300 shadow-lg"
                    onClick={handleCompleteRide}
                  >
                    Complete Ride
                  </button>
                )}
              </>
            ) : (
              <p className="text-gray-500">Loading ride details...</p>
            )}
          </div>

          {/* Map panel */}
          <div className="lg:w-2/3 w-full h-[500px] rounded-3xl overflow-hidden shadow-2xl border border-gray-200">
            {pickupLatLng && dropLatLng && driverLatLng ? (
              <MapContainer center={driverLatLng} zoom={13} className="h-full w-full">
                <TileLayer
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  attribution="&copy; OpenStreetMap contributors"
                />
                <Marker position={pickupLatLng} icon={pickupIcon} />
                <Marker position={dropLatLng} icon={dropIcon} />
                <Marker position={driverLatLng} icon={driverIcon} />
                {routeCoords.length > 0 && <Polyline positions={routeCoords} color="blue" weight={5} />}
                <FitBounds pickup={pickupLatLng} drop={dropLatLng} driver={driverLatLng} />
              </MapContainer>
            ) : (
              <p className="text-gray-500 p-4 text-center">Loading map...</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default LivePage;
