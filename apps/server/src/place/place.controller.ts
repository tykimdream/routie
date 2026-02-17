import {
  Controller,
  Get,
  Param,
  Query,
  UseGuards,
  BadRequestException,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PlaceService } from './place.service';

@Controller('places')
@UseGuards(JwtAuthGuard)
export class PlaceController {
  constructor(private readonly placeService: PlaceService) {}

  @Get('search')
  async search(@Query('query') query: string) {
    if (!query || query.trim().length === 0) {
      throw new BadRequestException('검색어를 입력해주세요');
    }
    return this.placeService.search(query);
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.placeService.findById(id);
  }
}
