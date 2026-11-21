import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Event } from './entities/event.entity';
import { CreateEventDto } from './dto/create-event.dto';
import { UpdateEventDto } from './dto/update-event.dto';
import { QueryEventDto } from './dto/query-event.dto';
import { Participant } from '../participants/entities/participant.entity';
import { EventStatus } from './enums/event-status.enum';

@Injectable()
export class EventsService {
  constructor(
    @InjectRepository(Event)
    private readonly eventsRepository: Repository<Event>,
    @InjectRepository(Participant)
    private readonly participantsRepository: Repository<Participant>,
  ) {}

  async create(createEventDto: CreateEventDto): Promise<Event> {
    const startDate = new Date(createEventDto.start_date);
    const endDate = new Date(createEventDto.end_date);

    if (endDate < startDate) {
      throw new BadRequestException(
        'Waktu selesai acara tidak boleh lebih awal dari waktu mulai acara',
      );
    }

    const event = this.eventsRepository.create({
      name: createEventDto.name,
      description: createEventDto.description,
      location: createEventDto.location,
      start_date: startDate,
      end_date: endDate,
      status: createEventDto.status ?? EventStatus.PLANNED,
    });

    return await this.eventsRepository.save(event);
  }

  async findAll(query?: QueryEventDto): Promise<Event[]> {
    const qb = this.eventsRepository
      .createQueryBuilder('event')
      .leftJoinAndSelect('event.participants', 'participants');

    if (query?.search) {
      const searchTerm = `%${query.search.toLowerCase()}%`;
      qb.andWhere(
        '(LOWER(event.name) LIKE :search OR LOWER(event.location) LIKE :search OR LOWER(event.description) LIKE :search)',
        { search: searchTerm },
      );
    }

    if (query?.status) {
      qb.andWhere('event.status = :status', { status: query.status });
    }

    if (query?.date) {
      qb.andWhere(
        '(DATE(event.start_date) <= :filterDate AND DATE(event.end_date) >= :filterDate)',
        { filterDate: query.date },
      );
    }

    qb.orderBy('event.created_at', 'DESC');

    const events = await qb.getMany();
    for (const ev of events) {
      ev.participantsCount = ev.participants ? ev.participants.length : 0;
    }
    return events;
  }

  async getSummary() {
    const [
      totalEvents,
      plannedEvents,
      ongoingEvents,
      completedEvents,
      totalParticipants,
    ] = await Promise.all([
      this.eventsRepository.count(),
      this.eventsRepository.count({ where: { status: EventStatus.PLANNED } }),
      this.eventsRepository.count({ where: { status: EventStatus.ONGOING } }),
      this.eventsRepository.count({ where: { status: EventStatus.COMPLETED } }),
      this.participantsRepository.count(),
    ]);

    return {
      totalEvents,
      plannedEvents,
      ongoingEvents,
      completedEvents,
      totalParticipants,
    };
  }

  async findOne(id: number): Promise<Event> {
    const event = await this.eventsRepository.findOne({
      where: { id },
      relations: { participants: true },
    });

    if (!event) {
      throw new NotFoundException('Acara tidak ditemukan');
    }

    event.participantsCount = event.participants
      ? event.participants.length
      : 0;
    return event;
  }

  async update(id: number, updateEventDto: UpdateEventDto): Promise<Event> {
    const event = await this.eventsRepository.findOne({ where: { id } });
    if (!event) {
      throw new NotFoundException('Acara tidak ditemukan');
    }

    const startDate = updateEventDto.start_date
      ? new Date(updateEventDto.start_date)
      : new Date(event.start_date);
    const endDate = updateEventDto.end_date
      ? new Date(updateEventDto.end_date)
      : new Date(event.end_date);

    if (endDate < startDate) {
      throw new BadRequestException(
        'Waktu selesai acara tidak boleh lebih awal dari waktu mulai acara',
      );
    }

    await this.eventsRepository.update(id, updateEventDto);
    return await this.findOne(id);
  }

  async remove(id: number): Promise<{ message: string }> {
    const event = await this.eventsRepository.findOne({ where: { id } });
    if (!event) {
      throw new NotFoundException('Acara tidak ditemukan');
    }

    await this.eventsRepository.delete(id);
    return { message: 'Acara berhasil dihapus' };
  }
}
