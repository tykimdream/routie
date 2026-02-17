import { Module } from '@nestjs/common';
import { TripController } from './trip.controller';
import { TripPlaceController } from './trip-place.controller';
import { TripService } from './trip.service';
import { PlaceModule } from '../place/place.module';

@Module({
  imports: [PlaceModule],
  controllers: [TripController, TripPlaceController],
  providers: [TripService],
  exports: [TripService],
})
export class TripModule {}
