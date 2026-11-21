import {
  IsEmail,
  IsInt,
  IsNotEmpty,
  IsString,
  MaxLength,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreateParticipantDto {
  @IsNotEmpty({ message: 'Nama peserta tidak boleh kosong' })
  @IsString({ message: 'Nama peserta harus berupa teks' })
  @MaxLength(150, { message: 'Nama peserta maksimal 150 karakter' })
  name: string;

  @IsNotEmpty({ message: 'Email peserta tidak boleh kosong' })
  @IsEmail({}, { message: 'Format email peserta tidak valid' })
  @MaxLength(150, { message: 'Email peserta maksimal 150 karakter' })
  email: string;

  @IsNotEmpty({ message: 'Nomor telepon tidak boleh kosong' })
  @IsString({ message: 'Nomor telepon harus berupa teks' })
  @MaxLength(20, { message: 'Nomor telepon maksimal 20 karakter' })
  phone: string;

  @IsNotEmpty({ message: 'Event ID tidak boleh kosong' })
  @Type(() => Number)
  @IsInt({ message: 'Event ID harus berupa angka bulat' })
  event_id: number;
}
