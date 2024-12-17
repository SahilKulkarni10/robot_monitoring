import React, { useEffect, useState } from "react";
import {
  BatteryIcon,
  ServerIcon,
  CpuIcon,
  MapPinIcon,
  RefreshCcwIcon,
  SearchIcon,
} from "lucide-react";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";


delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "/leaflet/marker-icon.png",
  iconUrl: "/leaflet/marker-icon.png",
  shadowUrl: "/leaflet/marker-shadow.png",
});

const App = () => {
  const [robots, setRobots] = useState([]);
  const [lastUpdated, setLastUpdated] = useState(new Date());
  const [statusFilter, setStatusFilter] = useState("");
  const [batteryFilter, setBatteryFilter] = useState("");
  const [searchQuery, setSearchQuery] = useState(""); 

  useEffect(() => {
    const fetchData = async () => {
      try {
        const apiUrl =
          window.location.hostname === "localhost" ||
          window.location.hostname === "127.0.0.1"
            ? "http://127.0.0.1:8000/robots"
            : "https://robot-backend-1.onrender.com/robots";

        const response = await fetch(apiUrl);
        const data = await response.json();
        setRobots(data);
        setLastUpdated(new Date());
      } catch (error) {
        console.error("Error fetching robot data:", error);
      }
    };

    fetchData();

    let socket = null;

    const connectWebSocket = () => {
      const socketUrl =
        window.location.hostname === "localhost" ||
        window.location.hostname === "127.0.0.1"
          ? "wss://127.0.0.1:8000/ws"
          : "wss://robot-backend-1.onrender.com/ws";

      socket = new WebSocket(socketUrl);

      socket.onopen = () => console.log("WebSocket connected");
      socket.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          setRobots(data);
          setLastUpdated(new Date());
        } catch (error) {
          console.error("Error parsing WebSocket message:", error);
        }
      };

      socket.onclose = () => {
        console.warn("WebSocket closed. Reconnecting...");
        setTimeout(connectWebSocket, 5000);
      };

      socket.onerror = (error) => {
        console.error("WebSocket error:", error);
        socket?.close();
      };
    };

    connectWebSocket();

    return () => socket?.close();
  }, []);

  const getStatusColor = (robot) => {
    if (!robot["Online/Offline"]) return "bg-red-100 text-red-800";
    if (robot["Battery Percentage"] < 20)
      return "bg-yellow-100 text-yellow-800";
    return "bg-green-100 text-green-800";
  };

  const filteredRobots = robots.filter((robot) => {
    const matchesStatus =
      !statusFilter ||
      robot["Online/Offline"] === (statusFilter === "Online");

    const matchesBattery =
      !batteryFilter ||
      (batteryFilter === "Low" && robot["Battery Percentage"] < 20);

    const matchesSearch =
      !searchQuery ||
      robot["Robot ID"].toString().toLowerCase().includes(searchQuery.toLowerCase());

    return matchesStatus && matchesBattery && matchesSearch;
  });

  return (
    <div className="min-h-screen flex justify-center items-center p-6">
      <div className="container mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-gray-800 flex items-center">
            <ServerIcon className="mr-3 text-blue-600" size={36} />
            Robot Fleet Monitoring
          </h1>
          <div className="text-sm text-gray-500 flex items-center">
            <RefreshCcwIcon size={16} className="mr-2" />
            Last Updated: {lastUpdated.toLocaleString()}
          </div>
        </div>

  
        <div className="flex justify-between mb-6 items-center">
          <div className="flex items-center">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="mr-4 p-2 border  rounded-full"
            >
              <option value="">All Status</option>
              <option value="Online">Online</option>
              <option value="Offline">Offline</option>
            </select>

            <select
              value={batteryFilter}
              onChange={(e) => setBatteryFilter(e.target.value)}
              className="mr-4 p-2 border  rounded-full"
            >
              <option value="">All Battery Levels</option>
              <option value="Low">Low Battery</option>
            </select>

            
            <div className="relative">
              <SearchIcon
                size={18}
                className="absolute top-2 left-2 text-gray-500 "
              />
              <input
                type="text"
                placeholder="Search Robot ID"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="p-2 pl-8 border  w-full rounded-full"
              />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white shadow-lg rounded-xl p-6">
            <h2 className="text-xl font-semibold mb-4 text-gray-700 border-b pb-2">
              Robot Details
            </h2>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="p-3 text-left">ID</th>
                    <th className="p-3 text-left">Status</th>
                    <th className="p-3 text-left">Battery</th>
                    <th className="p-3 text-left">CPU</th>
                    <th className="p-3 text-left">RAM</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredRobots.map((robot) => (
                    <tr
                      key={robot["Robot ID"]}
                      className="border-b hover:bg-gray-50 transition"
                    >
                      <td className="p-3">{robot["Robot ID"]}</td>
                      <td className="p-3">
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(
                            robot
                          )}`}
                        >
                          {robot["Online/Offline"] ? "Online" : "Offline"}
                        </span>
                      </td>
                      <td className="p-3 flex items-center">
                        <BatteryIcon
                          size={20}
                          className={`mr-2 ${
                            robot["Battery Percentage"] < 20
                              ? "text-red-500"
                              : "text-green-500"
                          }`}
                        />
                        {robot["Battery Percentage"]}%
                      </td>
                      <td className="p-3">{robot["CPU Usage"]}%</td>
                      <td className="p-3">{robot["RAM Consumption"]} MB</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="bg-white shadow-lg rounded-xl p-6">
            <h2 className="text-xl font-semibold mb-4 text-gray-700 border-b pb-2">
              <MapPinIcon className="inline-block mr-2 text-blue-600" />
              Robot Locations
            </h2>
            <MapContainer
              center={[20.5937, 78.9629]}
              zoom={3}
              style={{ height: "500px", width: "100%" }}
            >
              <TileLayer
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                attribution="&copy; OpenStreetMap contributors"
              />
              {filteredRobots.map((robot) => (
                robot["Location Coordinates"] && (
                  <Marker
                    key={robot["Robot ID"]}
                    position={robot["Location Coordinates"]}
                  >
                    <Popup>
                      <div>
                        <h3>Robot ID: {robot["Robot ID"]}</h3>
                        <p>Status: {robot["Online/Offline"] ? "Online" : "Offline"}</p>
                        <p>Battery: {robot["Battery Percentage"]}%</p>
                        <p>CPU: {robot["CPU Usage"]}%</p>
                        <p>RAM: {robot["RAM Consumption"]} MB</p>
                      </div>
                    </Popup>
                  </Marker>
                )
              ))}
            </MapContainer>
          </div>
        </div>
      </div>
    </div>
  );
};

export default App;
