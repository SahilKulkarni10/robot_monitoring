// import React, { useEffect, useState } from "react";
// import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
// import "leaflet/dist/leaflet.css";
// import axios from "axios";

// const App = () => {
//   const [robots, setRobots] = useState([]);

//   useEffect(() => {
//     // Fetch initial data
//     const fetchData = async () => {
//       try {
//         const response = await axios.get("http://127.0.0.1:8000/robots");
//         setRobots(response.data);
//       } catch (error) {
//         console.error("Error fetching robot data:", error);
//       }
//     };
//     fetchData();

//     // WebSocket connection for real-time updates
//     let socket = new WebSocket("ws://127.0.0.1:8000/ws");

//     const connectWebSocket = () => {
//       socket = new WebSocket("ws://127.0.0.1:8000/ws");

//       socket.onopen = () => console.log("WebSocket connected");

//       socket.onmessage = (event) => {
//         setRobots(JSON.parse(event.data));
//       };

//       socket.onclose = () => {
//         console.warn("WebSocket closed. Reconnecting...");
//         setTimeout(connectWebSocket, 5000);
//       };

//       socket.onerror = (error) => {
//         console.error("WebSocket error:", error);
//         socket.close();
//       };
//     };

//     connectWebSocket();

//     return () => socket.close();
//   }, []);

//   return (
//     <div className="app">
//       <h1>Robot Fleet Monitoring Dashboard</h1>
//       <div className="dashboard">
//         <div className="robot-list">
//           <h2>Robot Details</h2>
//           <table>
//             <thead>
//               <tr>
//                 <th>ID</th>
//                 <th>Status</th>
//                 <th>Battery</th>
//                 <th>CPU</th>
//                 <th>RAM</th>
//                 <th>Last Updated</th>
//               </tr>
//             </thead>
//             <tbody>
//               {robots.map((robot) => (
//                 <tr
//                   key={robot["Robot ID"]}
//                   className={
//                     robot["Battery Percentage"] < 20 || !robot["Online/Offline"]
//                       ? "highlight"
//                       : ""
//                   }
//                 >
//                   <td>{robot["Robot ID"]}</td>
//                   <td>{robot["Online/Offline"] ? "Online" : "Offline"}</td>
//                   <td>{robot["Battery Percentage"]}%</td>
//                   <td>{robot["CPU Usage"]}%</td>
//                   <td>{robot["RAM Consumption"]} MB</td>
//                   <td>{robot["Last Updated"]}</td>
//                 </tr>
//               ))}
//             </tbody>
//           </table>
//         </div>
//         <div className="map-view">
//           <h2>Map View</h2>
//           <MapContainer center={[0, 0]} zoom={2} style={{ height: "500px", width: "100%" }}>
//             <TileLayer
//               url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
//               attribution="&copy; OpenStreetMap contributors"
//             />
//             {robots.map((robot) => (
//               <Marker key={robot["Robot ID"]} position={robot["Location Coordinates"]}>
//                 <Popup>
//                   <div>
//                     <h3>Robot ID: {robot["Robot ID"]}</h3>
//                     <p>Status: {robot["Online/Offline"] ? "Online" : "Offline"}</p>
//                     <p>Battery: {robot["Battery Percentage"]}%</p>
//                     <p>CPU: {robot["CPU Usage"]}%</p>
//                     <p>RAM: {robot["RAM Consumption"]} MB</p>
//                   </div>
//                 </Popup>
//               </Marker>
//             ))}
//           </MapContainer>
//         </div>
//       </div>
//     </div>
//   );
// };

// export default App;


import React, { useEffect, useState } from "react";
import { 
  BatteryIcon, 
  ServerIcon, 
  CpuIcon, 
  MapPinIcon, 
  RefreshCcwIcon, 
  AlertTriangleIcon 
} from "lucide-react";
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';


const App = () => {
  const [robots, setRobots] = useState([]);
  const [lastUpdated, setLastUpdated] = useState(new Date());
  const [statusFilter, setStatusFilter] = useState(""); // Filter by Online/Offline
  const [batteryFilter, setBatteryFilter] = useState(""); // Filter by Low Battery
  
  useEffect(() => {

    const fetchData = async () => {
      try {
        const apiUrl = window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1"
          ? "http://127.0.0.1:8000/robots" // Local URL for development
          : "https://robot-backend-1.onrender.com/robots"; // Production URL
    
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
        window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1"
          ? "ws://127.0.0.1:8000/ws" // Local WebSocket URL
          : "ws://robot-backend-1.onrender.com/ws"; // Production WebSocket URL
    
      const socket = new WebSocket(socketUrl);
    
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
    if (robot["Battery Percentage"] < 20) return "bg-yellow-100 text-yellow-800";
    return "bg-green-100 text-green-800";
  };

  // Filter robots based on selected status and battery filter
  const filteredRobots = robots.filter((robot) => {
    // Filter by Online/Offline status
    if (statusFilter && robot["Online/Offline"] !== (statusFilter === "Online")) {
      return false;
    }

    // Filter by Low Battery
    if (batteryFilter === "Low" && robot["Battery Percentage"] >= 20) {
      return false;
    }

    return true;
  });

  return (
    <div className="min-h-screen bg-gray-50 flex justify-center items-center p-6">
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

        {/* Filter Section */}
        <div className="flex justify-between mb-6">
          <div className="flex items-center">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="mr-4 p-2 border rounded"
            >
              <option value="">All Status</option>
              <option value="Online">Online</option>
              <option value="Offline">Offline</option>
            </select>

            <select
              value={batteryFilter}
              onChange={(e) => setBatteryFilter(e.target.value)}
              className="p-2 border rounded"
            >
              <option value="">All Battery Levels</option>
              <option value="Low">Low Battery</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Robot List Section */}
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
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(robot)}`}>
                          {robot["Online/Offline"] ? "Online" : "Offline"}
                        </span>
                      </td>
                      <td className="p-3 flex items-center">
                        <BatteryIcon 
                          size={20} 
                          className={`mr-2 ${robot["Battery Percentage"] < 20 ? 'text-red-500' : 'text-green-500'}`} 
                        />
                        {robot["Battery Percentage"]}%
                      </td>
                      <td className="p-3">
                        <CpuIcon size={16} className="inline-block mr-2" />
                        {robot["CPU Usage"]}%
                      </td>
                      <td className="p-3">{robot["RAM Consumption"]} MB</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Map View Section */}
          <div className="bg-white shadow-lg rounded-xl p-6">
            <h2 className="text-xl font-semibold mb-4 text-gray-700 border-b pb-2">
              <MapPinIcon className="inline-block mr-2 text-blue-600" />
              Robot Locations
            </h2>
            <div className="h-[500px] bg-gray-100 rounded-lg">
              <MapContainer center={[51.505, -0.09]} zoom={13} className="h-full w-full">
                <TileLayer
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                {filteredRobots.map((robot) => (
                  robot["Location"] && robot["Location"].length === 2 ? ( // Ensure Location has 2 elements
                    <Marker 
                      key={robot["Robot ID"]}
                      position={robot["Location"]} // Robot's location [lat, lon]
                      icon={new L.Icon({
                        iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
                        iconSize: [25, 41],
                        iconAnchor: [12, 41],
                        popupAnchor: [1, -34]
                      })}
                    >
                      <Popup>{`Robot ID: ${robot["Robot ID"]}`}</Popup>
                    </Marker>
                  ) : null
                ))}
              </MapContainer>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default App;


