import { Injectable } from '@nestjs/common';
import { OpenAIService } from 'nestjs-openai';
import { I } from 'src/interface';

@Injectable()
export class EmojiService {
  constructor(private readonly openai: OpenAIService) {}

  async getAStory(story: I.Story, extraPrompt = '') {
    const emojis = story.steps.map(({ selectedEmoji }) => selectedEmoji);
    const { data } = await this.openai.createCompletion({
      model: 'gpt-3.5-turbo-instruct',
      prompt: `Write a small (100 words) witty story with the following emojis: "${emojis.join(
        ', ',
      )}" (in that order), Be concise and funny, with dark humour. Base the story on historical events, mythology, or science facts. Give me the story in french. Only use the emoji provided. ${extraPrompt}`,
      stream: false,
      max_tokens: 500,
    });
    return data.choices[0].text;
  }
}
