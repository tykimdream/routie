import {
  Controller,
  Get,
  Param,
  Query,
  Res,
  UseGuards,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import type { Response } from 'express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PlaceService } from './place.service';
import { GoogleMapsService } from '../google-maps/google-maps.service';

@Controller('places')
@UseGuards(JwtAuthGuard)
export class PlaceController {
  constructor(
    private readonly placeService: PlaceService,
    private readonly googleMaps: GoogleMapsService,
  ) {}

  @Get('search')
  async search(@Query('query') query: string) {
    if (!query || query.trim().length === 0) {
      throw new BadRequestException('검색어를 입력해주세요');
    }
    return this.placeService.search(query);
  }

  @Get('photo')
  async getPhoto(
    @Query('ref') ref: string,
    @Query('maxwidth') maxwidth: string,
    @Res() res: Response,
  ) {
    if (!ref) {
      throw new BadRequestException('photo reference is required');
    }
    const width = maxwidth ? parseInt(maxwidth, 10) : 400;
    const { buffer, contentType } = await this.googleMaps.fetchPhoto(
      ref,
      width,
    );
    res.set({
      'Content-Type': contentType,
      'Cache-Control': 'public, max-age=86400',
    });
    res.send(buffer);
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    const place = await this.placeService.findById(id);
    if (!place) {
      throw new NotFoundException('장소를 찾을 수 없습니다');
    }
    return place;
  }
}
