export interface Emoji {
  value: string;
  votes: number;
}

export interface StoryStep {
  selectedEmoji: string;
  emojiContender?: Emoji[];
}

export interface Story {
  steps: StoryStep[];
}