import { type Ref, useEffect } from "react";
import { BsCameraVideoOffFill } from "react-icons/bs";
import { FaUserCircle } from "react-icons/fa";
import { BsMicMuteFill } from "react-icons/bs";

function RemoteVideoComp({
  RemoteVideo,
  ismuted,
  cameraOpen,
  isConnected = false,
}: {
  RemoteVideo: Ref<HTMLVideoElement>;
  ismuted?: boolean;
  cameraOpen?: boolean;
  isConnected?: boolean;
}) {
  const videoRef = RemoteVideo as React.RefObject<HTMLVideoElement>;

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.muted = ismuted || false;
    }
  }, [ismuted, videoRef]);

  return (
    <>
      <div className="relative w-full h-[calc(100vh-2rem)] bg-gray-900/70">
        <video
          ref={RemoteVideo}
          autoPlay
          playsInline
          className={`rounded-xl border-blue-900 object-contain w-full max-h-full h-full m-auto ${
            !cameraOpen ? "opacity-0" : "opacity-100"
          }`}
        ></video>

        {!isConnected && (
          <div className="absolute inset-0 bg-gray-900 rounded-xl flex items-center justify-center border-blue-900">
            <div className="text-center">
              <FaUserCircle size={80} className="text-gray-600 mx-auto mb-4" />
              <div className="flex items-center gap-2 justify-center mb-2">
                <div className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse"></div>
                <p className="text-white text-lg">
                  Waiting for user to join...
                </p>
              </div>
              <p className="text-gray-400 text-sm">
                Share the room ID to invite someone
              </p>
            </div>
          </div>
        )}

        {isConnected && !cameraOpen && (
          <div className="absolute inset-0 bg-gray-900 rounded-xl flex items-center justify-center border-blue-900">
            <div className="text-center">
              <BsCameraVideoOffFill
                size={64}
                className="text-gray-400 mx-auto mb-3"
              />
              <p className="text-white text-lg font-semibold">Camera is off</p>
              <p className="text-gray-400 text-sm mt-2">
                User has turned off their camera
              </p>
            </div>
          </div>
        )}

        {isConnected && (
          <div className="absolute bottom-2 left-2 flex gap-2">
            {ismuted && (
              <div className="bg-red-500/90 rounded-full px-3 py-1.5 flex items-center gap-2">
                <BsMicMuteFill size={14} className="text-white" />
                <span className="text-white text-xs font-semibold">Muted</span>
              </div>
            )}
            {!cameraOpen && (
              <div className="bg-blue-500/90 rounded-full px-3 py-1.5 flex items-center gap-2">
                <BsCameraVideoOffFill size={14} className="text-white" />
                <span className="text-white text-xs font-semibold">
                  Camera Off
                </span>
              </div>
            )}
          </div>
        )}
      </div>
    </>
  );
}

export default RemoteVideoComp;
