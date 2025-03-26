import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import { io } from "socket.io-client";

export default function NumberCallerPage() {
  const URL = "http://localhost:5000";
  const socket = io(URL, { autoConnect: false });

  const [aliveConn, setAliveConn] = useState(false);

  useEffect(() => {
    socket.on("connect", () => {
      console.log("Connected to Socket.IO server");
      setAliveConn(true);
    });

    socket.on("disconnect", () => {
      console.log("Disconnected from Socket.IO server");
      setAliveConn(false);
    });

    socket.on("message", (message) => {
      console.log(message);
      toast.success(message);
    });

    socket.onAny((event, ...args) => {
      console.log(event, args);
    });

    socket.connect();

    return () => {
      socket.disconnect();
    };
  }, []);

  return (
    <div className="min-h-screen bg-gray-900 text-white grid grid-rows-2 items-center justify-center p-4">
      <div>Connection: {aliveConn ? "yes" : "no"}</div>
      <div>
        <button
          onClick={() => {
            console.log("clicked");
            socket.send({ type: "client-test" });
          }}
          className="bg-blue-500 text-white p-2 rounded-md"
        >
          Send Message
        </button>
      </div>
    </div>
  );
}
