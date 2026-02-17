import { IsString, IsOptional, IsEnum, IsInt, Min } from 'class-validator';

enum Priority {
  MUST = 'MUST',
  WANT = 'WANT',
  OPTIONAL = 'OPTIONAL',
}

export class AddTripPlaceDto {
  @IsString()
  googlePlaceId!: string;

  @IsOptional()
  @IsEnum(Priority)
  priority?: Priority;

  @IsOptional()
  @IsString()
  userNote?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  customDuration?: number;

  @IsOptional()
  @IsString()
  preferredTime?: string;
}

export class UpdateTripPlaceDto {
  @IsOptional()
  @IsEnum(Priority)
  priority?: Priority;

  @IsOptional()
  @IsString()
  userNote?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  customDuration?: number;

  @IsOptional()
  @IsString()
  preferredTime?: string;
}

export class ReorderTripPlacesDto {
  @IsString({ each: true })
  orderedIds!: string[];
}
