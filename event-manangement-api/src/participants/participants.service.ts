import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Participant } from './entities/participant.entity';
import { Event } from '../events/entities/event.entity';
import { CreateParticipantDto } from './dto/create-participant.dto';
import { UpdateParticipantDto } from './dto/update-participant.dto';

@Injectable()
export class ParticipantsService {
  constructor(
    @InjectRepository(Participant)
    private readonly participantsRepository: Repository<Participant>,
    @InjectRepository(Event)
    private readonly eventsRepository: Repository<Event>,
  ) {}

  async create(createParticipantDto: CreateParticipantDto): Promise<Participant> {
    const event = await this.eventsRepository.findOne({
      where: { id: createParticipantDto.event_id },
    });

    if (!event) {
      throw new NotFoundException('Acara tidak ditemukan');
    }

    const participant = this.participantsRepository.create(createParticipantDto);
    const saved = await this.participantsRepository.save(participant);
    return await this.findOne(saved.id);
  }

  async findAll(eventId?: number): Promise<Participant[]> {
    const where = eventId ? { event_id: eventId } : {};
    return await this.participantsRepository.find({
      where,
      relations: { event: true },
      order: { created_at: 'DESC' },
    });
  }

  async findOne(id: number): Promise<Participant> {
    const participant = await this.participantsRepository.findOne({
      where: { id },
      relations: { event: true },
    });

    if (!participant) {
      throw new NotFoundException('Peserta tidak ditemukan');
    }

    return participant;
  }

  async update(
    id: number,
    updateParticipantDto: UpdateParticipantDto,
  ): Promise<Participant> {
    const participant = await this.participantsRepository.findOne({
      where: { id },
    });

    if (!participant) {
      throw new NotFoundException('Peserta tidak ditemukan');
    }

    if (updateParticipantDto.event_id !== undefined) {
      const event = await this.eventsRepository.findOne({
        where: { id: updateParticipantDto.event_id },
      });

      if (!event) {
        throw new NotFoundException('Acara tidak ditemukan');
      }
    }

    await this.participantsRepository.update(id, updateParticipantDto);
    return await this.findOne(id);
  }

  async remove(id: number): Promise<{ message: string }> {
    const participant = await this.participantsRepository.findOne({
      where: { id },
    });

    if (!participant) {
      throw new NotFoundException('Peserta tidak ditemukan');
    }

    await this.participantsRepository.delete(id);
    return { message: 'Peserta berhasil dihapus' };
  }
}
