import { NotFoundException } from '@nestjs/common';

export function notFound(what: string): NotFoundException {
  return new NotFoundException(`${what} introuvable. Il a peut-être été supprimé.`);
}
