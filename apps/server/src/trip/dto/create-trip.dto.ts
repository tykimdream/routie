import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsDateString,
  IsEnum,
  Matches,
  MaxLength,
} from 'class-validator';

enum Transport {
  WALKING = 'WALKING',
  PUBLIC_TRANSIT = 'PUBLIC_TRANSIT',
  DRIVING = 'DRIVING',
  TAXI = 'TAXI',
}

export class CreateTripDto {
  @IsString()
  @IsNotEmpty({ message: '여행 제목을 입력해주세요' })
  @MaxLength(200)
  title!: string;

  @IsString()
  @IsNotEmpty({ message: '도시를 입력해주세요' })
  @MaxLength(100)
  city!: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  country?: string;

  @IsDateString()
  startDate!: string;

  @IsDateString()
  endDate!: string;

  @IsOptional()
  @Matches(/^([01]\d|2[0-3]):[0-5]\d$/, {
    message: 'dailyStart must be valid HH:mm format (00:00-23:59)',
  })
  dailyStart?: string;

  @IsOptional()
  @Matches(/^([01]\d|2[0-3]):[0-5]\d$/, {
    message: 'dailyEnd must be valid HH:mm format (00:00-23:59)',
  })
  dailyEnd?: string;

  @IsOptional()
  @IsEnum(Transport)
  transport?: Transport;
}
