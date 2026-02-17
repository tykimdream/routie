import { Module } from '@nestjs/common';
import { GoogleMapsModule } from '../google-maps/google-maps.module';
import { PlaceController } from './place.controller';
import { PlaceService } from './place.service';

@Module({
  imports: [GoogleMapsModule],
  controllers: [PlaceController],
  providers: [PlaceService],
  exports: [PlaceService],
})
export class PlaceModule {}
