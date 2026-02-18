import { IsEmail, IsString, MinLength, MaxLength } from 'class-validator';

export class LoginDto {
  @IsEmail({}, { message: '올바른 이메일 형식이 아닙니다' })
  email!: string;

  @IsString()
  @MinLength(1, { message: '비밀번호를 입력해주세요' })
  @MaxLength(72, { message: '비밀번호는 72자 이하여야 합니다' })
  password!: string;
}
