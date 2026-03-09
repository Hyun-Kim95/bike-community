import { Controller, Get, Query } from '@nestjs/common';
import { RegionsService } from './regions.service';

@Controller('regions')
export class RegionsController {
  constructor(private readonly regionsService: RegionsService) {}

  @Get('parents')
  async getParents() {
    const regions = await this.regionsService.findParents();
    return {
      items: regions.map((r) => ({
        code: r.code,
        name: r.name,
      })),
    };
  }

  @Get('children')
  async getChildren(@Query('parentCode') parentCode: string) {
    if (!parentCode) {
      return { items: [] };
    }
    const regions = await this.regionsService.findChildren(parentCode);
    return {
      items: regions.map((r) => ({
        code: r.code,
        name: r.name,
      })),
    };
  }
}

