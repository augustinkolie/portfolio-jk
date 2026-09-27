import type { LoginRequest } from '@btp/shared';
import { PASSWORD_MAX_LENGTH } from '@btp/shared';
import { IsEmail, IsString, MaxLength, MinLength } from 'class-validator';

export class LoginDto implements LoginRequest {
  @IsEmail({}, { message: "L'adresse email n'est pas valide." })
  email: string;

  @IsString({ message: 'Le mot de passe est obligatoire.' })
  @MinLength(1, { message: 'Le mot de passe est obligatoire.' })
  @MaxLength(PASSWORD_MAX_LENGTH, {
    message: `Le mot de passe ne peut pas dépasser ${PASSWORD_MAX_LENGTH} caractères.`,
  })
  password: string;
}
