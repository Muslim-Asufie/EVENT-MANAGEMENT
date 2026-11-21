import { Test, TestingModule } from '@nestjs/testing';
import { ParticipantsService } from './participants.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Participant } from './entities/participant.entity';
import { Event } from '../events/entities/event.entity';
import { NotFoundException } from '@nestjs/common';

describe('ParticipantsService', () => {
  let service: ParticipantsService;
  let participantRepo: any;
  let eventRepo: any;

  const mockParticipant = {
    id: 1,
    name: 'Budi Santoso',
    email: 'budi@example.com',
    phone: '081234567890',
    event_id: 1,
    created_at: new Date(),
    updated_at: new Date(),
    event: { id: 1, name: 'Tech Talk' },
  };

  beforeEach(async () => {
    participantRepo = {
      create: jest.fn().mockImplementation((dto) => dto),
      save: jest.fn().mockImplementation(async (p) => ({ id: 1, ...p })),
      find: jest.fn().mockResolvedValue([mockParticipant]),
      findOne: jest.fn(),
      update: jest.fn().mockResolvedValue({ affected: 1 }),
      delete: jest.fn().mockResolvedValue({ affected: 1 }),
    };

    eventRepo = {
      findOne: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ParticipantsService,
        {
          provide: getRepositoryToken(Participant),
          useValue: participantRepo,
        },
        {
          provide: getRepositoryToken(Event),
          useValue: eventRepo,
        },
      ],
    }).compile();

    service = module.get<ParticipantsService>(ParticipantsService);
  });

  describe('create', () => {
    it('should create participant if event exists', async () => {
      eventRepo.findOne.mockResolvedValue({ id: 1, name: 'Tech Talk' });
      participantRepo.findOne.mockResolvedValue(mockParticipant);

      const dto = {
        name: 'Budi Santoso',
        email: 'budi@example.com',
        phone: '081234567890',
        event_id: 1,
      };

      const result = await service.create(dto);
      expect(result).toBeDefined();
      expect(result.id).toBe(1);
      expect(participantRepo.save).toHaveBeenCalled();
    });

    it('should throw NotFoundException if event does not exist', async () => {
      eventRepo.findOne.mockResolvedValue(null);

      const dto = {
        name: 'Budi Santoso',
        email: 'budi@example.com',
        phone: '081234567890',
        event_id: 999,
      };

      await expect(service.create(dto)).rejects.toThrow(NotFoundException);
      await expect(service.create(dto)).rejects.toThrow('Acara tidak ditemukan');
    });
  });

  describe('findOne', () => {
    it('should return participant by id', async () => {
      participantRepo.findOne.mockResolvedValue(mockParticipant);

      const result = await service.findOne(1);
      expect(result).toEqual(mockParticipant);
    });

    it('should throw NotFoundException if participant does not exist', async () => {
      participantRepo.findOne.mockResolvedValue(null);

      await expect(service.findOne(999)).rejects.toThrow(NotFoundException);
      await expect(service.findOne(999)).rejects.toThrow('Peserta tidak ditemukan');
    });
  });

  describe('update', () => {
    it('should update participant', async () => {
      participantRepo.findOne
        .mockResolvedValueOnce(mockParticipant)
        .mockResolvedValueOnce({ ...mockParticipant, name: 'Budi Updated' });

      const result = await service.update(1, { name: 'Budi Updated' });
      expect(result.name).toBe('Budi Updated');
    });

    it('should throw NotFoundException if target event_id does not exist', async () => {
      participantRepo.findOne.mockResolvedValue(mockParticipant);
      eventRepo.findOne.mockResolvedValue(null);

      await expect(service.update(1, { event_id: 999 })).rejects.toThrow(
        NotFoundException,
      );
      await expect(service.update(1, { event_id: 999 })).rejects.toThrow(
        'Acara tidak ditemukan',
      );
    });
  });

  describe('remove', () => {
    it('should remove participant', async () => {
      participantRepo.findOne.mockResolvedValue(mockParticipant);

      const result = await service.remove(1);
      expect(result).toEqual({ message: 'Peserta berhasil dihapus' });
      expect(participantRepo.delete).toHaveBeenCalledWith(1);
    });

    it('should throw NotFoundException if participant not found', async () => {
      participantRepo.findOne.mockResolvedValue(null);

      await expect(service.remove(999)).rejects.toThrow(NotFoundException);
    });
  });
});
