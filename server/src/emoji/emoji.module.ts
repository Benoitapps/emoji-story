import { Module } from '@nestjs/common';
import { EmojiService } from './emoji.service';
import { OpenAIModule } from 'nestjs-openai';
import { EmojiGateway } from './emoji.gateway';

@Module({
  imports: [
    OpenAIModule.register({
      apiKey: process.env.OPENAI_API_KEY,
    }),
  ],
  providers: [EmojiService, EmojiGateway],
})
export class EmojiModule {}
