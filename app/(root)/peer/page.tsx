"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";

export default function PeerPage() {
  const [room, setRoom] = useState("");
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">Peer Mock (Preview)</h1>
      <div className="grid gap-3 max-w-md">
        <label className="text-sm">Room code</label>
        <input
          className="input"
          value={room}
          onChange={(e) => setRoom(e.target.value)}
          placeholder="e.g. winprep-123"
        />
      </div>
      <div className="flex gap-3">
        <Button className="btn-primary">Create room</Button>
        <Button variant="outline">Join room</Button>
      </div>
      <p className="text-muted-foreground text-sm">
        Stub UI. In a later step, we can add audio/video with WebRTC.
      </p>
    </div>
  );
}
