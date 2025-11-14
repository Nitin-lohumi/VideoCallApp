import { memo, type Ref } from "react";
import { BsCameraVideoOffFill } from "react-icons/bs";
import { BsMicMuteFill } from "react-icons/bs";
import { FaUser } from "react-icons/fa";

const LocalVideoComp = memo(
  ({
    LocalVideo,
    isHeight = false,
    ismuted = false,
    cameraOpen = true,
  }: {
    LocalVideo: Ref<HTMLVideoElement>;
    isHeight?: boolean;
    cameraOpen?: boolean;
    ismuted?: boolean;
  }) => {
    return (
      <>
        <div className="relative ">
          <video
            ref={LocalVideo}
            autoPlay
            playsInline
            muted
            className={`rounded-xl border-green-500 m-auto  shadow-xs shadow-blue-600 ${
              isHeight
                ? "max-h-[calc(100vh-4rem)] w-full"
                : "md:min-h-40 max-h-64 min-h-fit w-60"
            } ${!cameraOpen ? "opacity-0" : "opacity-100"}`}
          ></video>

          {!cameraOpen && (
            <div
              className={`absolute inset-0 bg-gray-900 rounded-xl flex items-center justify-center  border-green-500 ${
                isHeight ? "" : "w-60"
              }`}
            >
              <div className="text-center">
                <FaUser size={32} className="text-gray-400 mx-auto mb-2" />
                <p className="text-white text-xs font-semibold">Camera Off</p>
              </div>
            </div>
          )}

          <div className="absolute bottom-2 left-2 flex gap-1.5">
            {ismuted && (
              <div className="bg-red-500/90 rounded-full p-1.5">
                <BsMicMuteFill size={12} className="text-white" />
              </div>
            )}
            {!cameraOpen && (
              <div className="bg-blue-500/90 rounded-full p-1.5">
                <BsCameraVideoOffFill size={12} className="text-white" />
              </div>
            )}
          </div>

          <div className="absolute top-2 left-2 bg-black/60 px-2 py-1 rounded-full">
            <span className="text-white text-xs font-semibold">You</span>
          </div>
        </div>
      </>
    );
  }
);

LocalVideoComp.displayName = "LocalVideoComp";

export default LocalVideoComp;
