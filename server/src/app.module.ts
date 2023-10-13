import { Module } from '@nestjs/common';
import { EmojiModule } from './emoji/emoji.module';

@Module({
  imports: [EmojiModule],
  controllers: [],
  providers: [],
})
export class AppModule {}
