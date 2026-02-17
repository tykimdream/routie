import { Controller, Get, Post, Patch, Param, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { RouteService } from './route.service';

@Controller('trips/:tripId/routes')
@UseGuards(JwtAuthGuard)
export class RouteController {
  constructor(private readonly routeService: RouteService) {}

  @Post('optimize')
  optimize(@Param('tripId') tripId: string, @CurrentUser('id') userId: string) {
    return this.routeService.optimize(tripId, userId);
  }

  @Get()
  findAll(@Param('tripId') tripId: string, @CurrentUser('id') userId: string) {
    return this.routeService.findByTrip(tripId, userId);
  }

  @Get(':id')
  findOne(
    @Param('tripId') tripId: string,
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.routeService.findOne(tripId, id, userId);
  }

  @Patch(':id')
  select(
    @Param('tripId') tripId: string,
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.routeService.selectRoute(tripId, id, userId);
  }
}
