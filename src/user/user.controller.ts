import { Controller, Get, Post, Body, Param, UseGuards, Request, Res } from "@nestjs/common";
import { UserService } from "./user.service";
import { ConfigService } from "@nestjs/config";
import { CreateUserInterface, UserBody, UserStatus } from "./user.types";
import { User } from "./user.entity";
import { JwtAuthGuard } from "src/auth/jwt-auth.guard";
import { Response } from 'express';
import { UserRoleName } from "src/userRole/userRole.types";

@Controller('users')
export class UserController {
	constructor(
		private readonly userService: UserService,
		private configService: ConfigService
	) { }

	@Get()
	findAll() {
		return this.userService.findAll()
	}

	@Post()
	async createUser(@Body() body: CreateUserInterface): Promise<User> {
		return await this.userService.createUser(body)
	}

	@UseGuards(JwtAuthGuard)
	@Post('confirm/:code')
	async confirmUserEmail(
		@Param('code')
		code: string,
		@Request()
		{ user }
	) {
		return await this.userService.confirmUserEmail(user.id, code)
	}

	@UseGuards(JwtAuthGuard)
	@Post("update/email/:email")
	async registerNewEmail(
		@Param('email')
		email: string,
		@Request()
		{ user }
	) {
		return await this.userService.registerNewUserEmail(user.id, email)
	}

	@Get('/test')
	async test() {
		return await this.userService.findUsersByRole(UserRoleName.USER, [UserStatus.ACTIVE, UserStatus.ON_CHECK])
	}

	@Post("super-admin")
	async createNewSuperAdmin(
		@Body() user: UserBody
	) {
		return await this.userService.createSuperAdmin(user)
	}
}
