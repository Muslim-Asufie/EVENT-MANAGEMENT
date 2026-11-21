import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Participant } from './entities/participant.entity';
import { Event } from '../events/entities/event.entity';
import { ParticipantsService } from './participants.service';
import { ParticipantsController } from './participants.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Participant, Event])],
  controllers: [ParticipantsController],
  providers: [ParticipantsService],
  exports: [ParticipantsService],
})
export class ParticipantsModule {}
