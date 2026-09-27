import { MAX_PAGE_SIZE, PAGE_SIZE, type Paginated } from '@btp/shared';
import { Type } from 'class-transformer';
import { IsInt, IsOptional, Max, Min } from 'class-validator';

export class PaginationQueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(MAX_PAGE_SIZE)
  limit = PAGE_SIZE;

  get skip(): number {
    return (this.page - 1) * this.limit;
  }
}

export function paginated<T>(items: T[], total: number, query: PaginationQueryDto): Paginated<T> {
  return { items, total, page: query.page, limit: query.limit };
}
