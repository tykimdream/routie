import { Module } from '@nestjs/common';
import { RouteController } from './route.controller';
import { RouteService } from './route.service';
import { OptimizerService } from './optimizer/optimizer.service';
import { LlmService } from './optimizer/llm.service';
import { GoogleMapsModule } from '../google-maps/google-maps.module';
import { TripModule } from '../trip/trip.module';

@Module({
  imports: [GoogleMapsModule, TripModule],
  controllers: [RouteController],
  providers: [RouteService, OptimizerService, LlmService],
})
export class RouteModule {}
