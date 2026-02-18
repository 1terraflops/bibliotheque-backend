import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, Length } from 'class-validator';

export class GetTokenDto {
  @ApiProperty({
    description: "User's email",
    example: 'email@mail.com',
  })
  @IsEmail()
  email: string;

  @ApiProperty({
    description: "User's password",
    example: '12345678',
  })
  @IsString()
  @Length(6, 100)
  password: string;
}
