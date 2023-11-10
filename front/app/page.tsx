"use client";
import Step from "@/component/UI/step/Step";
import { useEffect, useState } from "react";
import { Story, StoryStep } from "interface/emoji";
import { ClientToServerEvent, ServerToClientEvent } from "interface/event";
import { Socket, io } from "socket.io-client";
import { toast } from "react-toastify";

const socket: Socket<ServerToClientEvent, ClientToServerEvent> = io(
  process.env.NEXT_PUBLIC_SOCKET_URL || "http://localhost:4000"
);

export default function Home() {
  const [story, setStory] = useState<Story>();
  const [timeLeftPerStep, setTimeLeftPerStep] = useState<
    Record<number, number>
  >({});

  useEffect(() => {
    socket.on("story-update", (data) => {
      setStory(data);
    });

    socket.on("step-time", ({ stepOrder, timeLeft }) => {
      setTimeLeftPerStep({ [stepOrder]: timeLeft });
      if (window.location.href.includes('#step'+stepOrder)) {
        toast('🦄 Wow so easy!', {
          position: "top-right",
          autoClose: 1000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
          });
      }
    });

    return () => {
      socket.disconnect();
    };
  }, []);


  const handleVote = (emoji: string, stepOrder: number) => {
    socket.emit("step-vote", { stepOrder, emoji });
  };
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24 gap-8">
      <div className="my-4">
        <button
          className="btn btn-primary btn-wide"
          onClick={() =>
            socket.emit("story-step-handle", {
              stepNumber: (story?.steps.length || 0) + 1,
            })
          }
        >
          Next Step
        </button>
      </div>
      <div className="carousel w-full rounded-box">
        {story?.steps.map((step) => (
          <div
            id={`step-${step.order}`}
            className="carousel-item relative w-full"
            key={step.order}
          >
            <Step
              step={step}
              timeLeft={timeLeftPerStep[step.order] || 0}
              handleEmojiClick={handleVote}
            />
            <div className="absolute flex justify-between transform  left-5 right-5">
              <a
                href={`#step-${
                  step.order === 1 ? story.steps.length : step.order - 1
                }`}
                className="btn btn-circle btn-info"
              >
                ❮
              </a>
              <a
                href={`#step-${
                  story.steps.length <= step.order ? 1 : step.order + 1
                }`}
                className="btn btn-circle btn-info"
              >
                ❯
              </a>
            </div>
          </div>
        ))}
      </div>
    </main>
  );
}
