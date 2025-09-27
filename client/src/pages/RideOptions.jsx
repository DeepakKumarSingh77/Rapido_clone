import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import UserNavber from "../components/UserNavber";
import UserFooter from "../components/UserFooter";
import {
  MapContainer,
  TileLayer,
  Marker,
  Polyline,
  Popup,
} from "react-leaflet";
import L from "leaflet";
import axios from "axios";
import "leaflet/dist/leaflet.css";
import { getSocket } from "../services/socket";

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

const RideOptions = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const params = new URLSearchParams(location.search);
  const pickup = params.get("pickup");
  const drop = params.get("drop");
  const user = JSON.parse(localStorage.getItem("user"));

  const [pickupLatLng, setPickupLatLng] = useState(null);
  const [dropLatLng, setDropLatLng] = useState(null);
  const [routeCoords, setRouteCoords] = useState([]);
  const [distance, setDistance] = useState(null);
  const [duration, setDuration] = useState(null);
  const [selectedRide, setSelectedRide] = useState(null);

  // Geocode function
  const geocodePlace = async (place) => {
    if (!place) return null;
    try {
      const res = await axios.get(
        `https://photon.komoot.io/api/?q=${encodeURIComponent(place)}&limit=1`
      );
      if (res.data.features.length > 0) {
        const [lng, lat] = res.data.features[0].geometry.coordinates;
        return [lat, lng];
      }
      return null;
    } catch (error) {
      console.error("Geocoding error:", error);
      return null;
    }
  };

  // Fetch coordinates
  useEffect(() => {
    const fetchCoordinates = async () => {
      const pickupCoords = await geocodePlace(pickup);
      const dropCoords = await geocodePlace(drop);
      setPickupLatLng(pickupCoords);
      setDropLatLng(dropCoords);
    };
    fetchCoordinates();
  }, [pickup, drop]);

  // Fetch route from OSRM
  useEffect(() => {
    const fetchRoute = async () => {
      if (!pickupLatLng || !dropLatLng) return;
      const url = `https://router.project-osrm.org/route/v1/driving/${pickupLatLng[1]},${pickupLatLng[0]};${dropLatLng[1]},${dropLatLng[0]}?overview=full&geometries=geojson`;
      const res = await axios.get(url);
      const data = res.data;
      if (data.routes && data.routes.length > 0) {
        const route = data.routes[0];
        setRouteCoords(
          route.geometry.coordinates.map(([lng, lat]) => [lat, lng])
        );
        setDistance((route.distance / 1000).toFixed(2));
        setDuration(Math.ceil(route.duration / 60));
      }
    };
    fetchRoute();
  }, [pickupLatLng, dropLatLng]);

  // Ride options
  const rides = [
    { type: "Bike", icon: "/icons/bike_logo.png" },
    { type: "Auto", icon: "/icons/cab_image.png" },
    { type: "Cab", icon: "/icons/taxi.png" },
  ];

  // Confirm ride handler
  const handleConfirmRide = async () => {
    if (!selectedRide) return;

    if (!navigator.geolocation) {
      alert("Geolocation is not supported by your browser");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;
        try {
          const fare = distance ? calculateFare(selectedRide, distance) : 0;
          const res = await axios.post(
            "http://localhost:3000/user/request-ride",
            {
              userId: user._id,
              pickup,
              drop,
              distance,
              duration,
              rideType: selectedRide,
              fare, // ✅ send calculated fare
              coordinates: {
                lat: latitude,
                lng: longitude,
              },
            }
          );
      
          const socket = getSocket();
          socket.on("rideCreated", (data) => {
            console.log("🚖 Ride created:", data);
            navigate(`/searching-driver?rideId=${data.rideId}`);
          });
        } catch (error) {
          console.error("Failed to request ride:", error);
        }
      },
      (err) => {
        console.error("Geolocation error:", err);
        alert("Could not get your location.");
      }
    );
  };

  const getSurgeMultiplier = () => {
    const now = new Date();
    const hour = now.getHours();

    // Define peak hours (e.g., 5 PM - 9 PM, 11 PM - 1 AM)
    if ((hour >= 17 && hour <= 21) || hour >= 23 || hour < 1) {
      return 1.5; // 50% increase
    }

    return 1;
  };

  // Fare calculation
  const calculateFare = (rideType, distanceKm) => {
    let baseFare = 0;
    let perKmRate = 0;

    switch (rideType.toLowerCase()) {
      case "bike":
        baseFare = 20;
        perKmRate = 5;
        break;
      case "auto":
        baseFare = 30;
        perKmRate = 8;
        break;
      case "cab":
        baseFare = 50;
        perKmRate = 12;
        break;
      default:
        throw new Error("Unknown ride type");
    }
    const surgeMultiplier = getSurgeMultiplier();
    const fare = (baseFare + perKmRate * distanceKm) * surgeMultiplier;
    return Math.round(fare);
  };

  const getRideSpeed = (rideType) => {
    switch (rideType.toLowerCase()) {
      case "bike":
        return 25; // km/h
      case "auto":
        return 20; // km/h
      case "cab":
        return 40; // km/h
      default:
        return 30; // fallback
    }
  };

  const calculateEstimatedTime = (rideType, distanceKm) => {
    const speed = getRideSpeed(rideType); // km/h
    const timeInHours = distanceKm / speed;
    const timeInMinutes = Math.ceil(timeInHours * 60); // convert to minutes
    return timeInMinutes;
  };

  return (
    <div className="min-h-screen flex flex-col">
      <UserNavber />
      <div className="flex flex-col md:flex-row gap-6 p-6 bg-[#E7ECEF]">
        {/* Ride Details */}
        <div className="md:w-1/2 flex flex-col gap-6">
          <div className="p-4 border rounded-lg shadow-sm bg-white">
            <h2 className="text-lg font-semibold">Ride</h2>
            <p>Pickup: {pickup}</p>
            <p>Drop: {drop}</p>
            <p>
              Distance: <strong>{distance || "..."} km</strong>
            </p>
            <p>
              Estimated Arrival:{" "}
              {distance ? calculateEstimatedTime("Default", distance) : "..."}{" "}
              mins
            </p>
          </div>

          {/* Ride Options */}
          <div className="p-4 border rounded-lg shadow-sm bg-white flex flex-col gap-4">
            {rides.map((ride) => (
              <div
                key={ride.type}
                onClick={() => setSelectedRide(ride.type)}
                className={`flex items-center gap-4 p-2 border rounded cursor-pointer hover:bg-gray-100 ${
                  selectedRide === ride.type ? "border-blue-500 bg-blue-50" : ""
                }`}
              >
                <img src={ride.icon} alt={ride.type} className="w-10 h-10" />
                <div>
                  <h3 className="font-semibold">{ride.type}</h3>
                  <p>
                    Price:{" "}
                    <span className="font-semibold">
                      {distance ? calculateFare(ride.type, distance) : "..."}
                    </span>
                  </p>
                  <p>
                    Estimated Arrival:{" "}
                    {distance
                      ? calculateEstimatedTime(ride.type, distance)
                      : "..."}{" "}
                    mins
                  </p>
                </div>
              </div>
            ))}

            <button
              className={`mt-4 px-4 py-2 rounded text-white ${
                selectedRide
                  ? "bg-green-600 hover:bg-green-700"
                  : "bg-gray-400 cursor-not-allowed"
              }`}
              disabled={!selectedRide}
              onClick={handleConfirmRide}
            >
              Confirm Ride
            </button>
          </div>
        </div>

        {/* Map */}
        <div className="md:w-1/2 h-96 w-full rounded-lg overflow-hidden shadow">
          {pickupLatLng && dropLatLng ? (
            <MapContainer
              center={pickupLatLng}
              zoom={13}
              className="h-full w-full"
            >
              <TileLayer
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                attribution="&copy; OpenStreetMap contributors"
              />
              <Marker position={pickupLatLng} icon={pickupIcon}>
                <Popup>Pickup Location</Popup>
              </Marker>
              <Marker position={dropLatLng} icon={dropIcon}>
                <Popup>Drop Location</Popup>
              </Marker>
              {routeCoords.length > 0 && (
                <Polyline positions={routeCoords} color="blue" weight={5} />
              )}
            </MapContainer>
          ) : (
            <p className="text-gray-500 p-4">Fetching coordinates...</p>
          )}
        </div>
      </div>
      <UserFooter />
    </div>
  );
};

export default RideOptions;
