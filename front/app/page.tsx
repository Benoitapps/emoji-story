"use client";
import Step from "@/component/UI/step/Step";
import { useEffect, useState } from "react";
import { E, I } from "@/interface";
import { toast } from "react-toastify";
import { useSocket } from "@/hook/socket";

export default function Home() {
  const [step, setStep] = useState<I.StoryStep | null>(null);
  const [story, setStory] = useState<I.Story | null>(null);
  const [stepNumber, setStepNumber] = useState<number>(0);
  const [timeLeft, setTimeLeft] = useState<number>(-1);
  const socket = useSocket();

  useEffect(() => {
    socket.current.connect();

    socket.current.on(E.STORY_UPDATE, ({ story }) => {
      console.log({ story });
      setStory(story);
      if (story.steps.length === 0) {
        setStepNumber(0);
      }
    });

    socket.current.on(E.STORY_ERROR, (message, data) => {
      toast(message, {
        type: "error",
      });
      console.log(message, data);
    });
    socket.current.on(E.EMOJI_ERROR, (message, data) => {
      toast(message, {
        type: "error",
      });
      console.log(message, data);
    });

    return () => {
      socket.current.off();
    };
  }, []);

  useEffect(() => {
    socket.current.emit(E.STORY_STEP_GENERATE, { stepNumber }, setStepNumber);
    socket.current.on(
      E.STEP_UPDATE,
      ({ stepNumber: _stepNumber, timeLeft }) => {
        setTimeLeft(timeLeft);
        if (stepNumber !== _stepNumber) {
          toast(`Step ${_stepNumber} 🪲`, {
            toastId: stepNumber,
            updateId: stepNumber,
            autoClose: 500,
          });
        }
      }
    );

    return () => {
      socket.current.off(E.STEP_UPDATE);
    };
  }, [stepNumber]);

  useEffect(() => {
    if (!story || stepNumber > story?.steps.length) {
      return;
    }

    setStep(story?.steps.find((s) => s.order === stepNumber) || null);
  }, [stepNumber, story]);

  const handleVote = (emoji: string) => {
    socket.current.emit(E.EMOJI_VOTE, { emoji });
  };

  const handleInit = () => {
    socket.current.emit(E.STORY_INIT);
    setStepNumber(0);
  };
  return (
    <main className="flex min-h-screen flex-col items-center justify-between p-24">
      <div className="flex gap-4">
        <button
          className="btn btn-lg"
          onClick={() =>
            socket.current.emit(
              E.STORY_STEP_GENERATE,
              { stepNumber: stepNumber + 1 },
              setStepNumber
            )
          }
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
          onClick={() => socket.current.emit(E.STORY_REGENERATE)}
        >
          Regenerate
        </button>
      </div>
      <Step
        emojiContenders={step?.emojiContender || []}
        selectedEmoji={step?.selectedEmoji || ""}
        stepNumber={stepNumber}
        timeLeft={timeLeft}
        handleEmojiClick={handleVote}
      />
    </main>
  );
}
