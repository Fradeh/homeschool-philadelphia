import { Injectable, UnauthorizedException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { PassportStrategy } from "@nestjs/passport";
import { ExtractJwt, Strategy, type VerifiedCallback } from "passport-jwt";
import { AuthUser, UserRole } from "@homeschool/shared";
import { RoleName } from "@prisma/client";
import { Request } from "express";
import { PrismaService } from "../../../prisma/prisma.service";

function extractCookieToken(request: Request): string | null {
  const cookieHeader = request.headers.cookie;
  if (!cookieHeader) return null;

  const cookies = cookieHeader.split(";").map((cookie) => cookie.trim());
  const tokenCookie = cookies.find((cookie) => cookie.startsWith("homeschool_access_token="));
  if (!tokenCookie) return null;

  return decodeURIComponent(tokenCookie.slice("homeschool_access_token=".length));
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    config: ConfigService,
    private readonly prisma: PrismaService
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([extractCookieToken, ExtractJwt.fromAuthHeaderAsBearerToken()]),
      ignoreExpiration: false,
      passReqToCallback: false,
      secretOrKey: config.getOrThrow<string>("JWT_SECRET")
    });
  }

  async validate(payload: AuthUser, done?: VerifiedCallback): Promise<AuthUser> {
    const user = await this.prisma.user.findUnique({
      where: { id: payload.id },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        isActive: true,
        roles: { include: { role: true } }
      }
    });

    if (!user?.isActive) {
      throw new UnauthorizedException("Invalid session");
    }

    return {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      roles: user.roles.map(({ role }) => role.name as RoleName as UserRole)
    };
  }
}
