"use client";
import Step from "@/component/UI/step/Step";
import { useEffect, useState } from "react";
import { Socket, io } from "socket.io-client";
import { P, E, I } from "@/interface";
import { toast } from "react-toastify";

const socket: Socket<E.ServerToClientEvents, E.ClientToServerEvents> = io(
  process.env.NEXT_PUBLIC_SOCKET_URL as string,
  { reconnection: true }
);

export default function Home() {
  const [step, setStep] = useState<I.StoryStep | null>(null);
  const [story, setStory] = useState<I.Story | null>(null);
  const [stepNumber, setStepNumber] = useState<number>(1);
  const [timeLeft, setTimeLeft] = useState<number>(-1);
  const [currentVote, setCurrentVote] = useState<string>("");

  useEffect(() => {
    socket.on(E.STORY_UPDATE, ({ story }) => {
      console.log({ story });
      setStory(story);
    });

    socket.on(E.STORY_ERROR, (message, data) => {
      toast(message, {
        type: "error",
      });
      console.log(message, data);
    });
    socket.on(E.EMOJI_ERROR, (message, data) => {
      toast(message, {
        type: "error",
      });
      console.log(message, data);
    });

    return () => {
      socket.off();
    };
  }, []);

  useEffect(() => {
    socket.emit(E.STORY_STEP_GENERATE, { stepNumber });

    socket.on(E.STEP_UPDATE, ({ stepNumber: _stepNumber, timeLeft }) => {
      setTimeLeft(timeLeft);
      if (stepNumber !== _stepNumber) {
        toast(`Step ${_stepNumber} 🪲`, {
          toastId: stepNumber,
          updateId: stepNumber,
          autoClose: 1000,
        });
      }
    });

    return () => {
      socket.off(E.STEP_UPDATE);
    };
  }, [stepNumber]);

  useEffect(() => {
    if (!story || stepNumber > story?.steps.length) {
      return;
    }

    setStep(story?.steps.find((s) => s.order === stepNumber) || null);
  }, [stepNumber, story]);

  const handleVote = (emoji: string) => {
    socket.emit(E.EMOJI_VOTE, { emoji });
  };

  const handleInit = () => {
    socket.emit(E.STORY_INIT);
    setStepNumber(0);
  };
  return (
    <main className="flex min-h-screen flex-col items-center justify-between p-24">
      <div className="flex gap-4">
        <button
          className="btn btn-lg"
          onClick={() => setStepNumber((st) => st + 1)}
        >
          Next Step
        </button>
        <button className="btn btn-lg btn-secondary" onClick={handleInit}>
          Initialize
        </button>
      </div>
      <div className="text-sm breadcrumbs">
        <ul>
          {story?.steps.map((step) => (
            <li key={step.order}>
              <a
                className="link text-xl "
                onClick={() => setStepNumber(step.order)}
              >
                {step.order}
                {step.selectedEmoji}
              </a>
            </li>
          ))}
        </ul>
      </div>
      <div className="glass p-2">
        <p className="text-xl">{story?.openAiStory}</p>
        <button
          className="btn m-auto inline-block"
          onClick={() => socket.emit(E.STORY_REGENERATE)}
        >
          Regenerate
        </button>
      </div>
      <Step
        emojiContenders={step?.emojiContender || []}
        selectedEmoji={step?.selectedEmoji || ""}
        currentVote={currentVote}
        stepNumber={stepNumber}
        timeLeft={timeLeft}
        handleEmojiClick={handleVote}
      />
    </main>
  );
}
