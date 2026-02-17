import {
  Injectable,
  ConflictException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import { SignupDto, LoginDto } from './dto';
import type { JwtPayload } from './strategies/jwt.strategy';

const SALT_ROUNDS = 12;

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) {}

  async signup(dto: SignupDto) {
    // 이메일 중복 체크
    const existing = await this.prisma.user.findUnique({
      where: { email: dto.email.toLowerCase() },
    });
    if (existing) {
      throw new ConflictException('이미 사용 중인 이메일입니다');
    }

    // 비밀번호 해싱
    const hashedPassword = await bcrypt.hash(dto.password, SALT_ROUNDS);

    // 사용자 생성 — Prisma schema에 password 필드가 없으므로
    // provider 필드를 활용하여 인증 방식을 표시하고,
    // 실제 비밀번호는 별도 저장 (여기서는 email:hash 형태)
    const user = await this.prisma.user.create({
      data: {
        email: dto.email.toLowerCase(),
        name: dto.name,
        provider: `email:${hashedPassword}`,
      },
      select: { id: true, email: true, name: true, avatarUrl: true },
    });

    // 토큰 발급
    const tokens = await this.generateTokens({
      sub: user.id,
      email: user.email,
    });

    return { user, ...tokens };
  }

  async login(dto: LoginDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email.toLowerCase() },
    });
    if (!user || !user.provider.startsWith('email:')) {
      throw new UnauthorizedException(
        '이메일 또는 비밀번호가 올바르지 않습니다',
      );
    }

    // provider에서 해시 추출
    const storedHash = user.provider.slice('email:'.length);
    const isValid = await bcrypt.compare(dto.password, storedHash);
    if (!isValid) {
      throw new UnauthorizedException(
        '이메일 또는 비밀번호가 올바르지 않습니다',
      );
    }

    const tokens = await this.generateTokens({
      sub: user.id,
      email: user.email,
    });

    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        avatarUrl: user.avatarUrl,
      },
      ...tokens,
    };
  }

  async refreshToken(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, email: true, name: true, avatarUrl: true },
    });
    if (!user) {
      throw new UnauthorizedException('사용자를 찾을 수 없습니다');
    }

    const tokens = await this.generateTokens({
      sub: user.id,
      email: user.email,
    });

    return { user, ...tokens };
  }

  async getProfile(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        avatarUrl: true,
        createdAt: true,
      },
    });
    if (!user) {
      throw new UnauthorizedException('사용자를 찾을 수 없습니다');
    }
    return user;
  }

  private async generateTokens(payload: JwtPayload) {
    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(payload, { expiresIn: '15m' }),
      this.jwtService.signAsync(payload, { expiresIn: '7d' }),
    ]);
    return { accessToken, refreshToken };
  }
}
