import { IsEmail, IsString, Length } from 'class-validator';

export class GetTokenDto {
  @IsEmail()
  email: string;

  @IsString()
  @Length(6, 100)
  password: string;
}
