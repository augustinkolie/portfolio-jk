import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { AuthModule } from './auth/auth.module.js';
import { CategoriesModule } from './categories/categories.module.js';
import { CoursesModule } from './courses/courses.module.js';
import { ConfigModule } from './config/config.module.js';
import { ExperiencesModule } from './experiences/experiences.module.js';
import { ExpertisesModule } from './expertises/expertises.module.js';
import { MediaModule } from './media/media.module.js';
import { MessagesModule } from './messages/messages.module.js';
import { PlansModule } from './plans/plans.module.js';
import { PrismaModule } from './prisma/prisma.module.js';
import { ProjectsModule } from './projects/projects.module.js';
import { RevalidationModule } from './revalidation/revalidation.module.js';
import { SettingsModule } from './settings/settings.module.js';
import { StorageModule } from './storage/storage.module.js';
import { UsersModule } from './users/users.module.js';

@Module({
  imports: [
    ConfigModule,
    PrismaModule,
    StorageModule,
    // Limite par défaut ; /auth et /contact appliquent une limite plus stricte.
    ThrottlerModule.forRoot([{ ttl: 60_000, limit: 120 }]),
    AuthModule,
    UsersModule,
    ProjectsModule,
    CategoriesModule,
    ExpertisesModule,
    ExperiencesModule,
    MediaModule,
    MessagesModule,
    SettingsModule,
    RevalidationModule,
    CoursesModule,
    PlansModule,
  ],
  providers: [{ provide: APP_GUARD, useClass: ThrottlerGuard }],
})
export class AppModule {}
