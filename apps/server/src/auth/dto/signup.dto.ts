import {
  IsEmail,
  IsString,
  MinLength,
  MaxLength,
  Matches,
} from 'class-validator';

export class SignupDto {
  @IsEmail({}, { message: '올바른 이메일 형식이 아닙니다' })
  email!: string;

  @IsString()
  @MinLength(8, { message: '비밀번호는 8자 이상이어야 합니다' })
  @MaxLength(72, { message: '비밀번호는 72자 이하여야 합니다' })
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, {
    message: '비밀번호는 대문자, 소문자, 숫자를 각각 1개 이상 포함해야 합니다',
  })
  password!: string;

  @IsString()
  @MinLength(1, { message: '이름을 입력해주세요' })
  @MaxLength(50, { message: '이름은 50자 이하여야 합니다' })
  name!: string;
}
