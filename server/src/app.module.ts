import { Module } from '@nestjs/common';
import { EmojiModule } from './emoji/emoji.module';
import { ZoomModule } from './zoom/zoom.module';

@Module({
  imports: [EmojiModule, ZoomModule],
  controllers: [],
})
export class AppModule {}
