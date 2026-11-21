import {
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  IsDateString,
} from 'class-validator';
import { EventStatus } from '../enums/event-status.enum';

export class CreateEventDto {
  @IsNotEmpty({ message: 'Nama acara tidak boleh kosong' })
  @IsString({ message: 'Nama acara harus berupa teks' })
  @MaxLength(150, { message: 'Nama acara maksimal 150 karakter' })
  name: string;

  @IsOptional()
  @IsString({ message: 'Deskripsi acara harus berupa teks' })
  description?: string;

  @IsNotEmpty({ message: 'Lokasi acara tidak boleh kosong' })
  @IsString({ message: 'Lokasi acara harus berupa teks' })
  @MaxLength(200, { message: 'Lokasi acara maksimal 200 karakter' })
  location: string;

  @IsNotEmpty({ message: 'Waktu mulai acara tidak boleh kosong' })
  @IsDateString({}, { message: 'Format waktu mulai acara tidak valid (ISO 8601)' })
  start_date: string;

  @IsNotEmpty({ message: 'Waktu selesai acara tidak boleh kosong' })
  @IsDateString({}, { message: 'Format waktu selesai acara tidak valid (ISO 8601)' })
  end_date: string;

  @IsOptional()
  @IsEnum(EventStatus, {
    message: 'Status acara harus berupa PLANNED, ONGOING, atau COMPLETED',
  })
  status?: EventStatus;
}
