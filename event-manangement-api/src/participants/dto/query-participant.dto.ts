import { IsInt, IsOptional } from 'class-validator';
import { Type } from 'class-transformer';

export class QueryParticipantDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'event_id harus berupa angka' })
  event_id?: number;
}
