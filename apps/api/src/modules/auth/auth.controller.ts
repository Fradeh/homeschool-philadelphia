import { Body, Controller, Get, HttpCode, Post, Res, UseGuards } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { AuthUser } from "@homeschool/shared";
import { Response } from "express";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { CurrentUser } from "./decorators/current-user.decorator";
import { LoginDto } from "./dto/login.dto";
import { AuthService } from "./auth.service";

@Controller("auth")
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly config: ConfigService
  ) {}

  @Post("login")
  async login(@Body() dto: LoginDto, @Res({ passthrough: true }) response: Response): Promise<{ user: AuthUser }> {
    const session = await this.authService.login(dto);
    const isProduction = this.config.get<string>("NODE_ENV") === "production";

    response.cookie("homeschool_access_token", session.accessToken, {
      httpOnly: true,
      secure: isProduction,
      sameSite: isProduction ? "none" : "lax",
      path: "/",
      maxAge: 24 * 60 * 60 * 1000
    });

    return { user: session.user };
  }

  @UseGuards(JwtAuthGuard)
  @Get("me")
  me(@CurrentUser() user: AuthUser): AuthUser {
    return user;
  }

  @Post("logout")
  @HttpCode(204)
  logout(@Res({ passthrough: true }) response: Response): void {
    const isProduction = this.config.get<string>("NODE_ENV") === "production";

    response.clearCookie("homeschool_access_token", {
      httpOnly: true,
      secure: isProduction,
      sameSite: isProduction ? "none" : "lax",
      path: "/"
    });
  }
}
