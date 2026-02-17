import { IsOptional, IsDateString } from 'class-validator';

export class OptimizeRouteDto {
  @IsOptional()
  @IsDateString()
  date?: string;
}
