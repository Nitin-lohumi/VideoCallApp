import { useMemo, useRef } from "react";

export default function usePeerConnection(
  RemoteVideo: React.RefObject<HTMLVideoElement>
) {
  const peer = useMemo(() => {
    const pc = new RTCPeerConnection({
      iceServers: [
        { urls: "stun:stun.l.google.com:19302" },
        { urls: "stun:stun1.l.google.com:19302" },
      ],
    });

    pc.ontrack = (event) => {
      if (event.streams && event.streams[0]) {
        const stream = event.streams[0];
        console.log(
          " Got remote stream with tracks:",
          stream.getTracks().length
        );

        if (RemoteVideo?.current) {
          RemoteVideo.current.srcObject = stream;
          RemoteVideo.current
            .play()
            .catch((err) => console.warn("Remote play error:", err));
        } else {
          console.error(" RemoteVideo.current is null!");
        }
      }
    };

    return pc;
  }, []);

  const localStream = useRef<MediaStream | null>(null);
  const remoteStream = useRef<MediaStream | null>(null);

  const startLocalStream = async () => {
    try {
      localStream.current = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      });
      localStream.current.getTracks().forEach((track) => {
        peer.addTrack(track, localStream.current!);
      });
      return localStream.current;
    } catch (err) {
      console.error(" Error accessing camera/mic:", err);
      throw err;
    }
  };

  const createOffer = async () => {
    try {
      const offer = await peer.createOffer({
        offerToReceiveAudio: true,
        offerToReceiveVideo: true,
      });
      await peer.setLocalDescription(offer);
      console.log(" Offer created:", offer.type);
      return offer;
    } catch (err) {
      console.error("Error creating offer:", err);
      throw err;
    }
  };

  const createAnswer = async (offer: RTCSessionDescriptionInit) => {
    try {
      await peer.setRemoteDescription(new RTCSessionDescription(offer));
      const answer = await peer.createAnswer();
      await peer.setLocalDescription(answer);
      console.log(" Answer created:", answer.type);
      return answer;
    } catch (err) {
      console.error(" Error creating answer:", err);
      throw err;
    }
  };

  const setRemoteAnswer = async (answer: RTCSessionDescriptionInit) => {
    try {
      await peer.setRemoteDescription(new RTCSessionDescription(answer));
    } catch (err) {
      console.error("❌ Error setting remote answer:", err);
      throw err;
    }
  };

  const listenICECandidates = (
    callback: (candidate: RTCIceCandidateInit) => void
  ) => {
    peer.onicecandidate = (event) => {
      if (event.candidate) {
        callback(event.candidate.toJSON());
      } else {
        console.log("✅ ICE gathering complete");
      }
    };
  };

  const addICECandidate = async (candidate: RTCIceCandidateInit) => {
    try {
      if (!peer.remoteDescription) {
        setTimeout(() => addICECandidate(candidate), 100);
        return;
      }
      await peer.addIceCandidate(new RTCIceCandidate(candidate));
      console.log(" ICE candidate added");
    } catch (err) {
      console.error(" Failed to add ICE candidate:", err);
    }
  };

  const closeConnection = () => {
    peer.close();
    localStream.current?.getTracks().forEach((t) => t.stop());
    remoteStream.current?.getTracks().forEach((t) => t.stop());
  };

  const toggleAudio = () => {
    if (localStream.current) {
      const audioTrack = localStream.current.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;

        return !audioTrack.enabled;
      }
    }
    return false;
  };

  const toggleVideo = () => {
    if (localStream.current) {
      const videoTrack = localStream.current.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;

        return !videoTrack.enabled;
      }
    }
    return false;
  };

  const toggleRemoteAudio = () => {
    if (RemoteVideo.current && RemoteVideo.current.srcObject) {
      RemoteVideo.current.muted = !RemoteVideo.current.muted;
      return RemoteVideo.current.muted;
    }
    return false;
  };

  const getConnectionState = () => {
    return {
      connectionState: peer.connectionState,
      iceConnectionState: peer.iceConnectionState,
    };
  };

  return {
    peer,
    startLocalStream,
    localStream,
    remoteStream,
    createOffer,
    createAnswer,
    setRemoteAnswer,
    listenICECandidates,
    addICECandidate,
    closeConnection,
    RemoteVideo,
    toggleAudio,
    toggleVideo,
    toggleRemoteAudio,
    getConnectionState,
  };
}
