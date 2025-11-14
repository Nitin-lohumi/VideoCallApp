import { toast } from "react-toastify";
import type { Socket } from "socket.io-client";
function HomeScreen({
  server,
  setId,
  id,
}: {
  server: Socket;
  setId: (str: string) => void;
  id: string;
}) {
  function handleConnect() {
    if (!id) {
      return toast.info("Id is not Avaiable");
    }
    if (server.connected) {
      server.emit("join-room", id);
    }
  }
  return (
    <div className="flex m-auto justify-center items-center min-h-[calc(100vh-4rem)] min-w-full ">
      <div className="p-5 flex gap-5 flex-col border border-gray-50/10 bg-blue-700/80 rounded-xl shadow-xl shadow-blue-900">
        <div className="h-fit p-2 capitalize text-gray-200 font-bold">
          join the video call meeting.
        </div>
        <input
          type="text"
          value={id}
          onChange={(e) => setId(e.target.value)}
          placeholder="Enter the room id"
          className="border rounded-xl p-2 outline-none text-white"
        />
        <button
          onClick={handleConnect}
          className="w-full shadow-2xs bg-violet-500 text-gray-300 font-bold
           shadow-blue-400 rounded-xl p-2
         cursor-pointer hover:bg-green-500"
        >
          Join Room
        </button>
      </div>
    </div>
  );
}

export default HomeScreen;
