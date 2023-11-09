"use client";
import Step from "@/component/UI/step/Step";
import { useEffect, useState } from "react";
import { StoryStep } from "interface/emoji";
import { ClientToServerEvent, ServerToClientEvent } from "interface/event";
import { Socket, io } from "socket.io-client";

const socket: Socket<ServerToClientEvent, ClientToServerEvent> = io(
  process.env.NEXT_PUBLIC_SOCKET_URL || "http://localhost:4000"
);

const primaryStep: StoryStep = {
  selectedEmoji: "",
  emojiContender: [
    {
      value: "🚶🏼",
      votes: 0,
    },
    {
      value: "🏊🏻",
      votes: 0,
    },
    {
      value: "💅🏿",
      votes: 0,
    },
    {
      value: "🍍",
      votes: 0,
    },
    {
      value: "👯",
      votes: 0,
    },
    {
      value: "📡",
      votes: 0,
    },
    {
      value: "👧🏽",
      votes: 0,
    },
    {
      value: "🙋🏾",
      votes: 0,
    },
  ],
};

export default function Home() {
  const [step, setStep] = useState<StoryStep>(primaryStep);
  const [timeLeft, setTimeLeft] = useState<number>(20);

  useEffect(() => {
    socket.on('story-update', (data) => {
      
    })
  }, []);

  const handleVote = (emoji: string) => {
    setStep((s) => {
      if (!s.emojiContender) return s;
      const index = s.emojiContender?.findIndex((e) => e.value === emoji);

      if (index === -1 || !index) {
        return s;
      }

      const current = s.emojiContender[index];

      s.emojiContender?.splice(index, 1, {
        ...current,
        votes: current.votes + 1,
      });

      return s;
    });
  };
  return (
    <main className="flex min-h-screen flex-col items-center justify-between p-24">
      <Step
        step={step}
        stepNumber={0}
        timeLeft={timeLeft}
        handleEmojiClick={handleVote}
      />
    </main>
  );
}
