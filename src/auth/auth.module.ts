import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { UserService } from "src/user/user.service";
import { User } from "src/user/user.entity";
import { AuthService } from "./auth.service";
import { UserModule } from "src/user/user.module";
import { PassportModule } from "@nestjs/passport";
import { JwtModule } from "@nestjs/jwt";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { JwtStrategy } from "./jwt.strategy";
import { AuthController } from "./auth.controller";
import { LocalStrategy } from "./local.strategy";
import { Confirmation } from "src/confirmation/confirmation.entity";
import { ConfirmationService } from "src/confirmation/confirmation.service";
import { UserRole } from "src/userRole/userRole.entity";
import { UserRoleService } from "src/userRole/userRole.service";

@Module({
	imports: [
		TypeOrmModule.forFeature([ User, Confirmation, UserRole ]),
		UserModule,
		PassportModule,
		JwtModule.registerAsync({
			imports: [ConfigModule],
			useFactory: (configService: ConfigService) => ({
				secret: configService.get<string>('JWT_SECRET'),
				signOptions: { expiresIn: '1h' }
			}),
			inject: [ConfigService]
		})
	],
	controllers: [ AuthController ],
	providers: [ AuthService, UserService, LocalStrategy, JwtStrategy, ConfirmationService, UserRoleService]
})
export class AuthModule { }