"use client";

import { useEffect, useState } from "react";
import {
  LiveKitRoom as LiveKitProvider,
  GridLayout,
  ParticipantTile,
  RoomAudioRenderer,
  ControlBar,
  useTracks,
} from "@livekit/components-react";
import { Track } from "livekit-client";

interface VideoRoomProps {
  userName: string;
  roomName: string;
}

export default function VideoRoom({ userName, roomName }: VideoRoomProps) {
  const [token, setToken] = useState("");

  // useTracks must be called inside a Room context. We'll call it in a child
  // component rendered inside the LiveKit provider below.
  function TracksView() {
    const tracks = useTracks([Track.Source.Camera, Track.Source.ScreenShare]);
    return (
      <div style={{ height: "100%" }}>
        <GridLayout tracks={tracks}>
          <ParticipantTile />
        </GridLayout>
        <ControlBar />
      </div>
    );
  }

  useEffect(() => {
    (async () => {
      try {
        const resp = await fetch(
          `/api/livekit-token?room=${encodeURIComponent(
            roomName
          )}&username=${encodeURIComponent(userName)}`
        );
        const data = await resp.json();
        setToken(data.token);
      } catch (e) {
        console.error(e);
      }
    })();
  }, [roomName, userName]);

  if (token === "") {
    return <div>Loading...</div>;
  }

  return (
    <LiveKitProvider
      video={true}
      audio={true}
      token={token}
      serverUrl={process.env.NEXT_PUBLIC_LIVEKIT_URL}
      data-lk-theme="default"
      style={{ height: "100%" }}
    >
      {/* TracksView calls useTracks inside the Room context */}
      <TracksView />
      <RoomAudioRenderer />
    </LiveKitProvider>
  );
}
