import { useEffect, useRef, useState } from "react";
import usePeerConnection from "../../hook/usePeerConnection";
import { Socket } from "socket.io-client";
import LocalVideoComp from "./LocalVideoComp";
import RemoteVideoComp from "./RemoteVideoComp";
import { IoCall } from "react-icons/io5";
import { FaMicrophone } from "react-icons/fa";
import { BsMicMuteFill } from "react-icons/bs";
import { BsFillCameraVideoOffFill } from "react-icons/bs";
import { MdVideoCameraFront } from "react-icons/md";
import { toast } from "react-toastify";

function RoomComp({ server, id }: { server: Socket; id: string }) {
  const Localvideo = useRef<HTMLVideoElement | null>(null);
  const RemoteVideo = useRef<HTMLVideoElement>(null!);
  const [remoteId, setRemoteId] = useState("");
  const remoteIdRef = useRef("");
  const localStreamReady = useRef(false);

  const [ismuted, setIsMuted] = useState(false);
  const [cameraOff, setCameraOff] = useState(false);

  const [remoteIsMuted, setRemoteIsMuted] = useState(false);
  const [remoteCameraOff, setRemoteCameraOff] = useState(false);

  const [showmenu, setShowMenu] = useState(false);
  const hideMenuTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [isUserDisconnected, setIsUserDisconnected] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<
    "waiting" | "connecting" | "connected" | "disconnected"
  >("waiting");

  const {
    startLocalStream,
    createAnswer,
    setRemoteAnswer,
    createOffer,
    addICECandidate,
    listenICECandidates,
    toggleAudio,
    toggleVideo,
    localStream,
    peer,
    getConnectionState,
  } = usePeerConnection(RemoteVideo);

  useEffect(() => {
    remoteIdRef.current = remoteId;
  }, [remoteId]);

  useEffect(() => {
    const start = async () => {
      const stream = await startLocalStream();
      if (Localvideo.current && stream) {
        Localvideo.current.srcObject = stream;
        await Localvideo.current.play().catch((err) => console.warn(err));
        localStreamReady.current = true;
      }
    };
    start();
  }, [startLocalStream]);

  useEffect(() => {
    if (!remoteId) return;

    const checkConnectionState = setInterval(() => {
      if (peer) {
        const state = getConnectionState();

        if (state.connectionState === "connected") {
          setConnectionStatus("connected");
          setIsUserDisconnected(false);
        } else if (state.connectionState === "connecting") {
          setConnectionStatus("connecting");
        } else if (
          state.connectionState === "failed" ||
          state.connectionState === "disconnected" ||
          state.iceConnectionState === "failed" ||
          state.iceConnectionState === "disconnected"
        ) {
          setConnectionStatus("disconnected");
          setIsUserDisconnected(true);
          toast.info("user left the rooom");
        }
      }
    }, 1000);

    return () => clearInterval(checkConnectionState);
  }, [peer, getConnectionState, remoteId]);

  useEffect(() => {
    const handleUserJoin = async (data: any) => {
      const { User2socketId } = data;
      setIsUserDisconnected(false);
      setConnectionStatus("connecting");

      if (!localStreamReady.current) {
        await new Promise((resolve) => {
          const interval = setInterval(() => {
            if (localStreamReady.current) {
              clearInterval(interval);
              resolve(true);
            }
          }, 100);
        });
      }
      setRemoteId(User2socketId);
      const offer = await createOffer();
      server.emit("sendOffer", { offer, to: User2socketId });
    };

    const handleGetAnswer = async ({ offer, from }: any) => {
      setIsUserDisconnected(false);
      setConnectionStatus("connecting");

      if (!localStreamReady.current) {
        await new Promise((resolve) => {
          const interval = setInterval(() => {
            if (localStreamReady.current) {
              clearInterval(interval);
              resolve(true);
            }
          }, 100);
        });
      }
      setRemoteId(from);
      const parsedOffer = typeof offer === "string" ? JSON.parse(offer) : offer;
      const ans = await createAnswer(parsedOffer);
      server.emit("sendAns", { ans, to: from });
    };

    const handleAnswer = async (ans: any) => {
      await setRemoteAnswer(ans);
    };

    const handleIceCandidate = async ({ candidate }: any) => {
      await addICECandidate(candidate);
    };

    const handleRemoteAudioToggled = ({ isMuted }: { isMuted: boolean }) => {
      setRemoteIsMuted(isMuted);
    };

    const handleRemoteVideoToggled = ({
      isVideoOff,
    }: {
      isVideoOff: boolean;
    }) => {
      setRemoteCameraOff(isVideoOff);
    };

    const handleUserLeft = ({ socketId }: { socketId: string }) => {
      setIsUserDisconnected(true);
      setConnectionStatus("disconnected");
      setRemoteId("");
    };

    server.on("userJoin", handleUserJoin);
    server.on("getanswer", handleGetAnswer);
    server.on("answer", handleAnswer);
    server.on("ice-candidate", handleIceCandidate);
    server.on("remote-audio-toggled", handleRemoteAudioToggled);
    server.on("remote-video-toggled", handleRemoteVideoToggled);
    server.on("userLeft", handleUserLeft); // ✅ Listen for userLeft

    return () => {
      server.off("userLeft", handleUserLeft);
      server.off("userJoin", handleUserJoin);
      server.off("ice-candidate", handleIceCandidate);
      server.off("answer", handleAnswer);
      server.off("getanswer", handleGetAnswer);
      server.off("remote-audio-toggled", handleRemoteAudioToggled);
      server.off("remote-video-toggled", handleRemoteVideoToggled);
    };
  }, [server, createOffer, createAnswer, setRemoteAnswer, addICECandidate]);

  useEffect(() => {
    if (!remoteId) {
      return;
    }
    listenICECandidates((candidate) => {
      if (remoteIdRef.current) {
        server.emit("ice-candidate", { candidate, to: remoteIdRef.current });
      }
    });
  }, [remoteId, listenICECandidates, server]);

  const handleToggleAudio = () => {
    const isMuted = toggleAudio();
    setIsMuted(isMuted);

    if (remoteIdRef.current) {
      server.emit("toggle-audio", { to: remoteIdRef.current, isMuted });
    }
  };

  const handleToggleVideo = () => {
    const isOff = toggleVideo();
    setCameraOff(isOff);

    if (remoteIdRef.current) {
      server.emit("toggle-video", {
        to: remoteIdRef.current,
        isVideoOff: isOff,
      });
    }
  };

  const handleLeaveCall = () => {
    if (localStream.current) {
      localStream.current.getTracks().forEach((track) => track.stop());
    }
    server.emit("leave-room", id);
    window.location.href = "/";
  };

  const handleShowMenu = () => {
    setShowMenu(true);

    if (hideMenuTimeoutRef.current) {
      clearTimeout(hideMenuTimeoutRef.current);
    }

    hideMenuTimeoutRef.current = setTimeout(() => {
      setShowMenu(false);
    }, 3000);
  };

  const handleHideMenu = () => {
    if (hideMenuTimeoutRef.current) {
      clearTimeout(hideMenuTimeoutRef.current);
    }
    setShowMenu(false);
  };

  useEffect(() => {
    return () => {
      if (hideMenuTimeoutRef.current) {
        clearTimeout(hideMenuTimeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (isUserDisconnected) {
      toast.info("user left the room");
    }
  }, [isUserDisconnected]);

  return (
    <>
      <div className="">
        <div
          className="m-auto border-yellow-500 p-1 md:min-h-screen
          md:max-h-screen h-screen overflow-hidden"
        >
          <div
            className="relative min-h-[calc(100vh-2rem)] border-blue-700 cursor-default"
            onMouseEnter={handleShowMenu}
            onMouseMove={handleShowMenu}
            onMouseLeave={handleHideMenu}
            onTouchStart={handleShowMenu}
          >
            <RemoteVideoComp
              RemoteVideo={RemoteVideo}
              ismuted={remoteIsMuted}
              cameraOpen={!remoteCameraOff}
              isConnected={!!remoteId && !isUserDisconnected}
            />
            <div className="absolute bottom-2 right-1 z-10">
              <LocalVideoComp
                LocalVideo={Localvideo}
                ismuted={ismuted}
                cameraOpen={!cameraOff}
              />
            </div>

            <div
              className={`w-full absolute p-2 bottom-0 z-20 transition-all duration-300 ease-in-out ${
                showmenu
                  ? "translate-y-0 opacity-100"
                  : "translate-y-full opacity-0 pointer-events-none"
              }`}
            >
              <div className="flex justify-between items-center m-auto max-w-[600px] min-w-[200px] p-5 bg-gray-800/70 backdrop-blur-md rounded-xl shadow-lg">
                <button
                  className="cursor-pointer hover:scale-110 disabled:opacity-50 disabled:cursor-not-allowed transition-transform p-2 rounded-lg hover:bg-gray-700/50"
                  onClick={handleToggleAudio}
                  disabled={!remoteId || isUserDisconnected}
                  title={
                    !remoteId || isUserDisconnected
                      ? "Wait for another user"
                      : ismuted
                      ? "Unmute"
                      : "Mute"
                  }
                >
                  {ismuted ? (
                    <BsMicMuteFill size={30} color="#ec4899" />
                  ) : (
                    <FaMicrophone size={30} color="#fbbf24" />
                  )}
                </button>
                <button
                  className="cursor-pointer hover:scale-110 disabled:opacity-50 disabled:cursor-not-allowed transition-transform p-2 rounded-lg hover:bg-gray-700/50"
                  onClick={handleToggleVideo}
                  disabled={!remoteId || isUserDisconnected}
                  title={
                    !remoteId || isUserDisconnected
                      ? "Wait for another user"
                      : cameraOff
                      ? "Turn on camera"
                      : "Turn off camera"
                  }
                >
                  {cameraOff ? (
                    <BsFillCameraVideoOffFill size={30} color="#3b82f6" />
                  ) : (
                    <MdVideoCameraFront size={30} color="#3b82f6" />
                  )}
                </button>
                <button
                  className="cursor-pointer hover:scale-110 transition-transform p-2 rounded-lg hover:bg-red-700/50"
                  onClick={handleLeaveCall}
                  title="Leave call"
                >
                  <IoCall color="#dc2626" size={30} />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

export default RoomComp;
