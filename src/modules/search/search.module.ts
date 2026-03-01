import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { SearchController } from './search.controller.js';
import { SearchService } from './search.service.js';
import { PrismaModule } from '../../core/database/prisma.module.js';

@Module({
  imports: [HttpModule, PrismaModule],
  controllers: [SearchController],
  providers: [SearchService],
  exports: [SearchService],
})
export class SearchModule {}
