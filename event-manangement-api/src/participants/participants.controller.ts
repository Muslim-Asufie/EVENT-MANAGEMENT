import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { ParticipantsService } from './participants.service';
import { CreateParticipantDto } from './dto/create-participant.dto';
import { UpdateParticipantDto } from './dto/update-participant.dto';
import { QueryParticipantDto } from './dto/query-participant.dto';

@Controller('participants')
export class ParticipantsController {
  constructor(private readonly participantsService: ParticipantsService) {}

  @Get()
  findAll(@Query() query: QueryParticipantDto) {
    return this.participantsService.findAll(query.event_id);
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.participantsService.findOne(id);
  }

  @Post()
  create(@Body() createParticipantDto: CreateParticipantDto) {
    return this.participantsService.create(createParticipantDto);
  }

  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateParticipantDto: UpdateParticipantDto,
  ) {
    return this.participantsService.update(id, updateParticipantDto);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.participantsService.remove(id);
  }
}
