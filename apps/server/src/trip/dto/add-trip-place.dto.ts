import {
  IsString,
  IsOptional,
  IsEnum,
  IsInt,
  IsArray,
  Min,
  MaxLength,
  ArrayMaxSize,
} from 'class-validator';

enum Priority {
  MUST = 'MUST',
  WANT = 'WANT',
  OPTIONAL = 'OPTIONAL',
}

export class AddTripPlaceDto {
  @IsString()
  @MaxLength(500)
  googlePlaceId!: string;

  @IsOptional()
  @IsEnum(Priority)
  priority?: Priority;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  userNote?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  customDuration?: number;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  preferredTime?: string;
}

export class UpdateTripPlaceDto {
  @IsOptional()
  @IsEnum(Priority)
  priority?: Priority;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  userNote?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  customDuration?: number;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  preferredTime?: string;
}

export class ReorderTripPlacesDto {
  @IsArray()
  @IsString({ each: true })
  @ArrayMaxSize(200)
  orderedIds!: string[];
}
