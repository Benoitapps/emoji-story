import { Module } from '@nestjs/common';
import { EmojiGateway } from './emoji.gateway';
import { EmojiService } from './emoji.service';
import { OpenAIModule } from 'nestjs-openai';

@Module({
  imports: [
    OpenAIModule.register({
      apiKey: process.env.OPENAI_API_KEY,
    }),
  ],
  providers: [EmojiGateway, EmojiService],
})
export class EmojiModule {}
