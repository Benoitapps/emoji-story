import { Module } from '@nestjs/common';
import { EmojiGateway } from './emoji.gateway';

@Module({
  providers: [EmojiGateway],
})
export class EmojiModule {}
