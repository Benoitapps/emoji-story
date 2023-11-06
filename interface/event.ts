import { P } from ".";

export const EMOJI_VOTE = "emoji-vote";
export const EMOJI_ERROR = "emoji-error";
export const STEP_UPDATE = "step-update";
export const STORY_ERROR = "story-error";
export const STORY_UPDATE = "story-update";
export const STORY_STEP_GENERATE = "story-step-handle";
export const STORY_REGENERATE = "story-regenerate";
export const STORY_INIT = "story-init";

export const JOIN = "join";
export const LEAVE = "leave";
export const READY = "ready";
export const OFFER = "offer";
export const ANSWER = "answer";
export const ICE_CANDIDATE = "ice-candidate";

// export interface ServerToClientEvents {
//   [EMOJI_ERROR]: (message: string, payload: any) => void;
//   [STORY_ERROR]: (message: string, payload: any) => void;
//   [STORY_UPDATE]: (payload: P.STORY_UPDATE) => void;
//   [STEP_UPDATE]: (payload: { stepNumber: number; timeLeft: number }) => void;
// }

// export interface InterServerEvents {
//   [STEP_UPDATE]: (payload: { stepNumber: number; timeLeft: number }) => void;
// }

// export interface ClientToServerEvents {
//   [EMOJI_VOTE]: (payload: P.EMOJI_VOTE) => void;
//   [STORY_STEP_GENERATE]: (
//     payload: P.STORY_STEP_GENERATE,
//     setStep: (stepNumber: number) => void
//   ) => void;
//   [STORY_REGENERATE]: () => void;
//   [STORY_INIT]: () => void;

//   [JOIN]: (payload: string) => void;
//   [LEAVE]: (payload: string) => void;
//   [READY]: (payload: string) => void;
//   [OFFER]: (offer: RTCSessionDescriptionInit, roomName: string) => void;
//   [ANSWER]: (answer: RTCSessionDescriptionInit, roomName: string) => void;
//   [ICE_CANDIDATE]: (candidate: RTCIceCandidateInit, roomName: string) => void;
// }

export const FULL = "full";
export const CREATED = "created";
export const JOINED = "joined";

export interface ServerToClientEvents {
  [EMOJI_ERROR]: (message: string, payload: any) => void;
  [STORY_ERROR]: (message: string, payload: any) => void;
  [STORY_UPDATE]: (payload: P.STORY_UPDATE) => void;
  [STEP_UPDATE]: (payload: { stepNumber: number; timeLeft: number }) => void;
  [FULL]: () => void;
  [JOIN]: (message: string, payload: any) => void;
  [CREATED]: () => void;
  [JOINED]: () => void;
  [READY]: () => void;
  [OFFER]: (offer: RTCSessionDescriptionInit) => void;
  [ANSWER]: (answer: RTCSessionDescriptionInit) => void;
  [ICE_CANDIDATE]: (candidate: RTCIceCandidateInit) => void;
  [LEAVE]: () => void;
}

export interface ClientToServerEvents {
  [EMOJI_VOTE]: (payload: P.EMOJI_VOTE) => void;
  [STORY_STEP_GENERATE]: (
    payload: P.STORY_STEP_GENERATE,
    setStep: (stepNumber: number) => void
  ) => void;
  [STORY_REGENERATE]: () => void;
  [STORY_INIT]: () => void;
  [JOIN]: (payload: string) => void;
  [LEAVE]: (payload: string) => void;
  [READY]: (payload: string) => void;
  [OFFER]: (payload: {
    offer: RTCSessionDescriptionInit;
    roomName: string;
  }) => void;
  [ANSWER]: (payload: {
    answer: RTCSessionDescriptionInit;
    roomName: string;
  }) => void;
  [ICE_CANDIDATE]: (payload: {
    candidate: RTCIceCandidateInit;
    roomName: string;
  }) => void;
}
