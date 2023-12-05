import { Injectable } from '@nestjs/common';
import { OpenAIService } from 'nestjs-openai';

@Injectable()
export class EmojiService {
  constructor(private readonly openai: OpenAIService) {}

  async generateStory(emojiList: string[]): Promise<string> {
    try {
      const { data } = await this.openai.createCompletion({
        model: 'gpt-3.5-turbo-instruct',
        prompt: [{}],
        stream: false,
        max_tokens: 500,
        temperature: 0.9,
      });

      return data.choices[0].text;
    } catch (error) {
      console.error(error);
    }
  }
}
