"use client";

import { useState } from "react";
import { LandingPage } from "@/components/LandingPage";
import { PitchRoom } from "@/components/PitchRoom";

export default function Home() {
  const [showPitchRoom, setShowPitchRoom] = useState(false);

  if (showPitchRoom) {
    return <PitchRoom />;
  }

  return <LandingPage onEnter={() => setShowPitchRoom(true)} />;
}
