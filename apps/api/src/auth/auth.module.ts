import { Global, Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { AppConfig } from '../config/app-config.js';
import { UsersModule } from '../users/users.module.js';
import { AccountController } from './account.controller.js';
import { AuthController } from './auth.controller.js';
import { AuthService } from './auth.service.js';
import { JwtAuthGuard } from './jwt-auth.guard.js';
import { TokensService } from './tokens.service.js';

// Global : les modules métier (projets, médias…) utilisent JwtAuthGuard sans réimporter AuthModule.
@Global()
@Module({
  imports: [
    UsersModule,
    JwtModule.registerAsync({
      inject: [AppConfig],
      useFactory: (config: AppConfig) => ({
        secret: config.jwtAccessSecret,
        signOptions: { expiresIn: config.jwtAccessTtlSeconds, algorithm: 'HS256' },
        verifyOptions: { algorithms: ['HS256'] },
      }),
    }),
  ],
  controllers: [AuthController, AccountController],
  providers: [AuthService, TokensService, JwtAuthGuard],
  exports: [TokensService, JwtAuthGuard],
})
export class AuthModule {}
