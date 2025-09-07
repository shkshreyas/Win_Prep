"use client";

import { useEffect, useState } from "react";
import {
  LiveKitRoom as LiveKitRoomBase,
  VideoConference,
  RoomAudioRenderer,
  ControlBar,
} from "@livekit/components-react";

interface LiveKitProps {
  userName: string;
  roomName: string;
}

async function getToken(roomName: string, userName: string) {
  try {
    const resp = await fetch(
      `/api/livekit-token?room=${encodeURIComponent(
        roomName
      )}&username=${encodeURIComponent(userName)}`
    );
    const data = await resp.json();
    return data?.token ?? null;
  } catch (error) {
    console.error("Error getting token:", error);
    return null;
  }
}

export default function LiveKitRoom({ userName, roomName }: LiveKitProps) {
  const [token, setToken] = useState("");

  useEffect(() => {
    const loadToken = async () => {
      const token = await getToken(roomName, userName);
      setToken(token);
    };
    loadToken();
  }, [userName, roomName]);

  if (!token) {
    return <div>Loading...</div>;
  }

  return (
    <div className="w-full h-full">
      {token && (
        <LiveKitRoomBase
          token={token}
          serverUrl={process.env.NEXT_PUBLIC_LIVEKIT_URL}
          style={{ height: "100%" }}
        >
          <VideoConference />
          <RoomAudioRenderer />
          <ControlBar />
        </LiveKitRoomBase>
      )}
    </div>
  );
}
