import { Injectable } from '@nestjs/common';
import { OpenAIService } from 'nestjs-openai';

@Injectable()
export class EmojiService {
  constructor(private readonly openai: OpenAIService) {}

  async generateStory(emojiList: string[]): Promise<string> {
    try {
      const { data } = await this.openai.createCompletion({
        model: 'gpt-3.5-turbo',
        prompt: `Generate a story from these emoji: ${emojiList.join(
          ', ',
        )}. The story should be 100 words log maximum, based on current event or mythological stories. Give me the story in french.`,
        stream: false,
      });

      return data.choices[0].text;
    } catch (error) {
      console.error(error);
    }
  }
}
