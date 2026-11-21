import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from './../src/app.module';
import { DataSource } from 'typeorm';

describe('Event Management API (e2e)', () => {
  let app: INestApplication;
  let dataSource: DataSource;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api');
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        transform: true,
      }),
    );

    await app.init();
    dataSource = app.get(DataSource);
  });

  afterAll(async () => {
    if (dataSource?.isInitialized) {
      await dataSource.query('DELETE FROM participants');
      await dataSource.query('DELETE FROM events');
    }
    await app.close();
  });

  let createdEventId: number;
  let createdParticipantId: number;

  describe('/api/events', () => {
    it('POST /api/events - should fail if end_date < start_date', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/events')
        .send({
          name: 'Invalid Date Event',
          location: 'Aula UMM',
          start_date: '2026-12-05T10:00:00Z',
          end_date: '2026-12-04T10:00:00Z',
        });

      expect(response.status).toBe(400);
      expect(response.body.message).toContain(
        'Waktu selesai acara tidak boleh lebih awal dari waktu mulai acara',
      );
    });

    it('POST /api/events - should fail on empty required fields', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/events')
        .send({
          name: '',
        });

      expect(response.status).toBe(400);
    });

    it('POST /api/events - should create event successfully', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/events')
        .send({
          name: 'Seminar Nasional AI 2026',
          description: 'Membahas perkembangan AI dan Agentic Workflow',
          location: 'GKB 4 Hall UMM',
          start_date: '2026-12-10T08:00:00Z',
          end_date: '2026-12-10T16:00:00Z',
          status: 'PLANNED',
        });

      expect(response.status).toBe(201);
      expect(response.body.id).toBeDefined();
      expect(response.body.name).toBe('Seminar Nasional AI 2026');
      expect(response.body.status).toBe('PLANNED');
      createdEventId = response.body.id;
    });

    it('GET /api/events - should list events and support search and status filter', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/events?search=Seminar&status=PLANNED')
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThan(0);
      expect(response.body[0].id).toBe(createdEventId);
      expect(response.body[0].participantsCount).toBeDefined();
    });

    it('GET /api/events/summary - should return statistics summary', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/events/summary')
        .expect(200);

      expect(response.body).toHaveProperty('totalEvents');
      expect(response.body).toHaveProperty('plannedEvents');
      expect(response.body).toHaveProperty('ongoingEvents');
      expect(response.body).toHaveProperty('completedEvents');
      expect(response.body).toHaveProperty('totalParticipants');
      expect(response.body.totalEvents).toBeGreaterThanOrEqual(1);
    });

    it('GET /api/events/:id - should get event details with participants', async () => {
      const response = await request(app.getHttpServer())
        .get(`/api/events/${createdEventId}`)
        .expect(200);

      expect(response.body.id).toBe(createdEventId);
      expect(Array.isArray(response.body.participants)).toBe(true);
    });

    it('PATCH /api/events/:id - should update event status to ONGOING', async () => {
      const response = await request(app.getHttpServer())
        .patch(`/api/events/${createdEventId}`)
        .send({ status: 'ONGOING' })
        .expect(200);

      expect(response.body.status).toBe('ONGOING');
    });

    it('PATCH /api/events/:id - should reject invalid updated dates', async () => {
      const response = await request(app.getHttpServer())
        .patch(`/api/events/${createdEventId}`)
        .send({ end_date: '2026-12-01T00:00:00Z' })
        .expect(400);

      expect(response.body.message).toContain(
        'Waktu selesai acara tidak boleh lebih awal dari waktu mulai acara',
      );
    });
  });

  describe('/api/participants', () => {
    it('POST /api/participants - should fail for non-existent event_id', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/participants')
        .send({
          name: 'Ahmad Fauzi',
          email: 'ahmad@example.com',
          phone: '081234567890',
          event_id: 999999,
        })
        .expect(404);

      expect(response.body.message).toContain('Acara tidak ditemukan');
    });

    it('POST /api/participants - should fail on invalid email format', async () => {
      await request(app.getHttpServer())
        .post('/api/participants')
        .send({
          name: 'Ahmad Fauzi',
          email: 'not-an-email',
          phone: '081234567890',
          event_id: createdEventId,
        })
        .expect(400);
    });

    it('POST /api/participants - should add participant to event', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/participants')
        .send({
          name: 'Ahmad Fauzi',
          email: 'ahmad.fauzi@example.com',
          phone: '081234567890',
          event_id: createdEventId,
        })
        .expect(201);

      expect(response.body.id).toBeDefined();
      expect(response.body.name).toBe('Ahmad Fauzi');
      expect(response.body.event.id).toBe(createdEventId);
      createdParticipantId = response.body.id;
    });

    it('GET /api/participants - should list all participants and filter by event_id', async () => {
      const response = await request(app.getHttpServer())
        .get(`/api/participants?event_id=${createdEventId}`)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBe(1);
      expect(response.body[0].id).toBe(createdParticipantId);
      expect(response.body[0].event).toBeDefined();
      expect(response.body[0].event.name).toBe('Seminar Nasional AI 2026');
    });

    it('GET /api/participants/:id - should get participant details', async () => {
      const response = await request(app.getHttpServer())
        .get(`/api/participants/${createdParticipantId}`)
        .expect(200);

      expect(response.body.id).toBe(createdParticipantId);
      expect(response.body.name).toBe('Ahmad Fauzi');
    });

    it('PATCH /api/participants/:id - should update participant', async () => {
      const response = await request(app.getHttpServer())
        .patch(`/api/participants/${createdParticipantId}`)
        .send({ phone: '089999999999' })
        .expect(200);

      expect(response.body.phone).toBe('089999999999');
    });
  });

  describe('Cascade Deletion', () => {
    it('DELETE /api/events/:id - should delete event and cascade delete its participants', async () => {
      await request(app.getHttpServer())
        .delete(`/api/events/${createdEventId}`)
        .expect(200);

      // Event should now be 404
      await request(app.getHttpServer())
        .get(`/api/events/${createdEventId}`)
        .expect(404);

      // Participant should also be gone due to cascade
      await request(app.getHttpServer())
        .get(`/api/participants/${createdParticipantId}`)
        .expect(404);
    });
  });
});
