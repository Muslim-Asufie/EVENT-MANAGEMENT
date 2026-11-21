import { IsEnum, IsOptional, IsString } from 'class-validator';
import { EventStatus } from '../enums/event-status.enum';

export class QueryEventDto {
  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsEnum(EventStatus, {
    message: 'Status harus salah satu dari PLANNED, ONGOING, COMPLETED',
  })
  status?: EventStatus;

  @IsOptional()
  @IsString()
  date?: string;
}
