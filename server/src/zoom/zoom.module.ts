import { Module } from '@nestjs/common';
import { ZoomGateway } from './zoom.gateway';

@Module({
  providers: [ZoomGateway],
})
export class ZoomModule {}
