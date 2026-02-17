import { Module } from '@nestjs/common';
import { GoogleMapsService } from './google-maps.service';
import { DistanceMatrixService } from './distance-matrix.service';

@Module({
  providers: [GoogleMapsService, DistanceMatrixService],
  exports: [GoogleMapsService, DistanceMatrixService],
})
export class GoogleMapsModule {}
