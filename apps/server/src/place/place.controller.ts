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
export class PlaceController {
  constructor(
    private readonly placeService: PlaceService,
    private readonly googleMaps: GoogleMapsService,
  ) {}

  @Get('search')
  @UseGuards(JwtAuthGuard)
  async search(@Query('query') query: string) {
    if (!query || query.trim().length === 0) {
      throw new BadRequestException('검색어를 입력해주세요');
    }
    return this.placeService.search(query);
  }

  @Get('autocomplete/cities')
  @UseGuards(JwtAuthGuard)
  async autocompleteCities(@Query('input') input: string) {
    if (!input || input.trim().length === 0) {
      return [];
    }
    return this.googleMaps.autocompleteCities(input);
  }

  @Get('nearby')
  @UseGuards(JwtAuthGuard)
  async searchNearby(
    @Query('lat') lat: string,
    @Query('lng') lng: string,
    @Query('types') types?: string,
    @Query('radius') radius?: string,
  ) {
    if (!lat || !lng) {
      throw new BadRequestException('lat, lng 파라미터가 필요합니다');
    }
    const parsedLat = parseFloat(lat);
    const parsedLng = parseFloat(lng);
    if (isNaN(parsedLat) || isNaN(parsedLng)) {
      throw new BadRequestException('유효한 좌표를 입력해주세요');
    }
    const typeList = types ? types.split(',') : ['tourist_attraction'];
    const parsedRadius = radius ? parseInt(radius, 10) : 5000;
    return this.googleMaps.searchNearby(
      parsedLat,
      parsedLng,
      typeList,
      parsedRadius,
    );
  }

  // 사진 프록시 — 인증 불필요 (<img src="...">에서 JWT 헤더를 보낼 수 없음)
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
  @UseGuards(JwtAuthGuard)
  async findOne(@Param('id') id: string) {
    const place = await this.placeService.findById(id);
    if (!place) {
      throw new NotFoundException('장소를 찾을 수 없습니다');
    }
    return place;
  }
}
