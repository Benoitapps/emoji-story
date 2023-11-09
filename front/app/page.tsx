"use client";
import Step from "@/component/UI/step/Step";
import { useEffect, useState } from "react";
import { Story, StoryStep } from "interface/emoji";
import { ClientToServerEvent, ServerToClientEvent } from "interface/event";
import { Socket, io } from "socket.io-client";

const socket: Socket<ServerToClientEvent, ClientToServerEvent> = io(
  process.env.NEXT_PUBLIC_SOCKET_URL || "http://localhost:4000"
);

export default function Home() {
  const [story, setStory] = useState<Story>();
  const [timeLeft, setTimeLeft] = useState<number>(20);

  useEffect(() => {
    socket.on("story-update", (data) => {
      setStory(data);
    });
  }, []);

  const step0 = story?.steps?.[0]

  const handleVote = (emoji: string) => {};
  return (
    <main className="flex min-h-screen flex-col items-center justify-between p-24">
      {step0 && (
        <Step
          step={step0}
          stepNumber={0}
          timeLeft={timeLeft}
          handleEmojiClick={handleVote}
        />
      )}
    </main>
  );
}
