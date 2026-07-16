import { Injectable, UnauthorizedException } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { AuthUser, UserRole } from "@homeschool/shared";
import { RoleName } from "@prisma/client";
import * as bcrypt from "bcrypt";
import { PrismaService } from "../../prisma/prisma.service";
import { LoginDto } from "./dto/login.dto";

@Injectable()
export class AuthService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly prisma: PrismaService
  ) {}

  async login(dto: LoginDto): Promise<{ accessToken: string; user: AuthUser }> {
    const userRecord = await this.prisma.user.findFirst({
      where: {
        email: {
          equals: dto.email.trim(),
          mode: "insensitive"
        }
      },
      select: {
        id: true,
        email: true,
        passwordHash: true,
        firstName: true,
        lastName: true,
        isActive: true,
        roles: {
          include: { role: true }
        }
      }
    });

    if (!userRecord?.isActive) {
      throw new UnauthorizedException("Invalid credentials");
    }

    const passwordMatches = await bcrypt.compare(dto.password, userRecord.passwordHash);

    if (!passwordMatches) {
      throw new UnauthorizedException("Invalid credentials");
    }

    const user: AuthUser = {
      id: userRecord.id,
      email: userRecord.email,
      firstName: userRecord.firstName,
      lastName: userRecord.lastName,
      roles: userRecord.roles.map(({ role }) => role.name as RoleName as UserRole)
    };

    return {
      accessToken: await this.jwtService.signAsync(user),
      user
    };
  }
}
