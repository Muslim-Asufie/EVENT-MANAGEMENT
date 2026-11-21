import { Test, TestingModule } from '@nestjs/testing';
import { EventsService } from './events.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Event } from './entities/event.entity';
import { Participant } from '../participants/entities/participant.entity';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { EventStatus } from './enums/event-status.enum';

describe('EventsService', () => {
  let service: EventsService;
  let eventRepo: any;
  let participantRepo: any;

  const mockEvent = {
    id: 1,
    name: 'Workshop Web Development',
    description: 'Belajar Next.js dan NestJS',
    location: 'Lab Informatika',
    start_date: new Date('2026-12-01T09:00:00Z'),
    end_date: new Date('2026-12-01T17:00:00Z'),
    status: EventStatus.PLANNED,
    created_at: new Date(),
    updated_at: new Date(),
    participants: [],
  };

  beforeEach(async () => {
    eventRepo = {
      create: jest.fn().mockImplementation((dto) => dto),
      save: jest.fn().mockImplementation(async (event) => ({ id: 1, ...event })),
      findOne: jest.fn(),
      update: jest.fn().mockResolvedValue({ affected: 1 }),
      delete: jest.fn().mockResolvedValue({ affected: 1 }),
      count: jest.fn(),
      createQueryBuilder: jest.fn(),
    };

    participantRepo = {
      count: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EventsService,
        {
          provide: getRepositoryToken(Event),
          useValue: eventRepo,
        },
        {
          provide: getRepositoryToken(Participant),
          useValue: participantRepo,
        },
      ],
    }).compile();

    service = module.get<EventsService>(EventsService);
  });

  describe('create', () => {
    it('should create an event successfully when end_date >= start_date', async () => {
      const dto = {
        name: 'Workshop Web',
        location: 'Lab 1',
        start_date: '2026-12-01T09:00:00Z',
        end_date: '2026-12-01T17:00:00Z',
      };

      const result = await service.create(dto);
      expect(result).toHaveProperty('id', 1);
      expect(result.status).toBe(EventStatus.PLANNED);
      expect(eventRepo.save).toHaveBeenCalled();
    });

    it('should throw BadRequestException when end_date < start_date', async () => {
      const dto = {
        name: 'Workshop Web',
        location: 'Lab 1',
        start_date: '2026-12-02T09:00:00Z',
        end_date: '2026-12-01T09:00:00Z',
      };

      await expect(service.create(dto)).rejects.toThrow(BadRequestException);
      await expect(service.create(dto)).rejects.toThrow(
        'Waktu selesai acara tidak boleh lebih awal dari waktu mulai acara',
      );
    });
  });

  describe('findOne', () => {
    it('should return an event with participantsCount', async () => {
      eventRepo.findOne.mockResolvedValue(mockEvent);

      const result = await service.findOne(1);
      expect(result).toBeDefined();
      expect(result.id).toBe(1);
      expect(result.participantsCount).toBe(0);
    });

    it('should throw NotFoundException if event is not found', async () => {
      eventRepo.findOne.mockResolvedValue(null);

      await expect(service.findOne(999)).rejects.toThrow(NotFoundException);
      await expect(service.findOne(999)).rejects.toThrow('Acara tidak ditemukan');
    });
  });

  describe('update', () => {
    it('should update event successfully', async () => {
      eventRepo.findOne
        .mockResolvedValueOnce(mockEvent)
        .mockResolvedValueOnce({ ...mockEvent, name: 'Updated Event' });

      const result = await service.update(1, { name: 'Updated Event' });
      expect(result.name).toBe('Updated Event');
      expect(eventRepo.update).toHaveBeenCalledWith(1, { name: 'Updated Event' });
    });

    it('should throw BadRequestException when updated end_date is before start_date', async () => {
      eventRepo.findOne.mockResolvedValue(mockEvent);

      await expect(
        service.update(1, { end_date: '2026-11-30T09:00:00Z' }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw NotFoundException if event does not exist', async () => {
      eventRepo.findOne.mockResolvedValue(null);

      await expect(service.update(999, { name: 'New' })).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('remove', () => {
    it('should delete event successfully', async () => {
      eventRepo.findOne.mockResolvedValue(mockEvent);

      const result = await service.remove(1);
      expect(result).toEqual({ message: 'Acara berhasil dihapus' });
      expect(eventRepo.delete).toHaveBeenCalledWith(1);
    });

    it('should throw NotFoundException if event does not exist', async () => {
      eventRepo.findOne.mockResolvedValue(null);

      await expect(service.remove(999)).rejects.toThrow(NotFoundException);
    });
  });

  describe('getSummary', () => {
    it('should return statistical summary', async () => {
      eventRepo.count
        .mockResolvedValueOnce(10) // total
        .mockResolvedValueOnce(4) // planned
        .mockResolvedValueOnce(3) // ongoing
        .mockResolvedValueOnce(3); // completed
      participantRepo.count.mockResolvedValueOnce(25);

      const summary = await service.getSummary();
      expect(summary).toEqual({
        totalEvents: 10,
        plannedEvents: 4,
        ongoingEvents: 3,
        completedEvents: 3,
        totalParticipants: 25,
      });
    });
  });
});
