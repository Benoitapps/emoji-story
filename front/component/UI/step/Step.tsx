"use client";
import { StoryStep } from "../../../../interface/emoji";
import { useEffect, useState } from "react";

interface Props {
  step: StoryStep;
  stepNumber: number;
  timeLeft: number;
  handleEmojiClick: (emoji: string) => void;
}

// tu peux utiliser ça pour la step : <div className="artboard phone-1">320×568</div> :)
// Afficher la step en cours
// Afficher les emojis et leur nombre de vote
// Afficher l'emoji selectionnée
// Préparer le timer

const Step = ({ step, stepNumber, timeLeft, handleEmojiClick }: Props) => {
  return (
    <div>
      <span className="countdown">
        <span style={{ "--value": timeLeft }}></span>
      </span>
      <h1 className="text-5xl font-bold">Step Number : {stepNumber}</h1>
      <div className="artboard phone-1">
        <div className="flex flex-col">
          {step?.emojiContender?.map((emoji, i) => (
            <div key={i} className="flex">
              <button
                className="text-4xl w-50 mr-4 btn"
                onClick={() => handleEmojiClick(emoji.value)}
              >
                {emoji.value}
              </button>
              <div className="w-50">{emoji.votes} votes</div>
            </div>
          ))}
        </div>
      </div>
      <div className="">
        <h3>Emoji seléctionné :</h3>
        <p>{step.selectedEmoji} </p>
      </div>
    </div>
  );
};

export default Step;
