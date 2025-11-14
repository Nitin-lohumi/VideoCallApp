import { io } from "socket.io-client";
import HomeScreen from "./component/HomeScreen";
import { useEffect, useMemo, useState } from "react";
import RoomComp from "./component/RoomComp";
import { ToastContainer } from "react-toastify";
function App() {
  const [isConnected, setIsConnected] = useState(false);
  const [activeUsers, setActiveUser] = useState(0);
  const server = useMemo(() => io("https://videocallapp-8p0d.onrender.com/"), []);
  const [id, setId] = useState("");
  useEffect(() => {
    server.on("toatalUserInWebSite", (number) => {
      console.log(number);
      setActiveUser(Number(number));
    });
    server.on("joined", (data) => {
      if (data) {
        setIsConnected(true);
      }
    });
    server.on("roomFull", (data) => {
      let { roomId, message } = data;
      console.log(roomId, message);
      setIsConnected(false);
    });
    server.on("leave-room", (roomid) => {
      setIsConnected(false);
      console.log(roomid);
    });
    return () => {
      server.off("toatalUserInWebSite");
      server.off("joined");
      server.off("roomFull");
      server.off("leave-room");
    };
  }, []);
  return (
    <>
      <div className=" bg-blue-950/90 min-h-screen  w-full border-amber-500">
        {!isConnected && (
          <div className="flex justify-end ">
            <p
              className="text-gray-700 font-mono  pr-2 p-1 capitalize 
        text-xl"
            >
              active user :
              <span className="text-xl text-green-600 font-bold">
                {activeUsers}
              </span>
            </p>
            {<p></p>}
          </div>
        )}
        <div>
          {!isConnected ? (
            <HomeScreen server={server} setId={setId} id={id} />
          ) : (
            <RoomComp server={server} id={id} />
          )}
        </div>
      </div>
      <ToastContainer draggable autoClose={2000} position="top-right" />
    </>
  );
}

export default App;
