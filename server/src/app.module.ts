import { Module } from '@nestjs/common';
import { EmojiModule } from './emoji/emoji.module';
import { ScheduleModule } from '@nestjs/schedule';

@Module({
  imports: [ScheduleModule.forRoot(), EmojiModule],
  controllers: [],
  providers: [],
})
export class AppModule {}
