import { Module } from '@nestjs/common';
import { OpenAIModule } from 'nestjs-openai';
import { EmojiModule } from './emoji/emoji.module';

@Module({
  imports: [EmojiModule],
  controllers: [],
})
export class AppModule {}
