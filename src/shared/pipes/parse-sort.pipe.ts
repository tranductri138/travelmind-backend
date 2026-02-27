import { PipeTransform, Injectable, BadRequestException } from '@nestjs/common';

export interface SortOption {
  field: string;
  order: 'asc' | 'desc';
}

@Injectable()
export class ParseSortPipe implements PipeTransform<string, SortOption[]> {
  transform(value: string): SortOption[] {
    if (!value) return [];
    try {
      return value.split(',').map((item) => {
        const [field, order] = item.trim().split(':');
        if (!field || !['asc', 'desc'].includes(order?.toLowerCase())) {
          throw new Error(`Invalid sort: ${item}`);
        }
        return { field, order: order.toLowerCase() as 'asc' | 'desc' };
      });
    } catch {
      throw new BadRequestException(
        'Invalid sort format. Expected: field:asc,field:desc',
      );
    }
  }
}
