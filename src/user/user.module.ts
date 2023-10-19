import { Module } from "@nestjs/common";
import { UserController } from "./user.controller";
import { UserAndUserRoleModuleConfig } from "src/config/module.config";

@Module({
	imports: [UserAndUserRoleModuleConfig.entityImports],
	controllers: [ UserController ],
	providers: UserAndUserRoleModuleConfig.providers
})
export class UserModule {}