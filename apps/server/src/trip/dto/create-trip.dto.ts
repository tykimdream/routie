import {
  IsString,
  IsOptional,
  IsDateString,
  IsEnum,
  Matches,
} from 'class-validator';

enum Transport {
  WALKING = 'WALKING',
  PUBLIC_TRANSIT = 'PUBLIC_TRANSIT',
  DRIVING = 'DRIVING',
  TAXI = 'TAXI',
}

export class CreateTripDto {
  @IsString()
  title!: string;

  @IsString()
  city!: string;

  @IsOptional()
  @IsString()
  country?: string;

  @IsDateString()
  startDate!: string;

  @IsDateString()
  endDate!: string;

  @IsOptional()
  @Matches(/^\d{2}:\d{2}$/, { message: 'dailyStart must be HH:mm format' })
  dailyStart?: string;

  @IsOptional()
  @Matches(/^\d{2}:\d{2}$/, { message: 'dailyEnd must be HH:mm format' })
  dailyEnd?: string;

  @IsOptional()
  @IsEnum(Transport)
  transport?: Transport;
}
