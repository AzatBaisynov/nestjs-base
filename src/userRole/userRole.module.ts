import { Module } from "@nestjs/common";
import { UserAndUserRoleModuleConfig } from "src/config/module.config";

@Module({
	imports: [UserAndUserRoleModuleConfig.entityImports],
	controllers: [],
	providers: UserAndUserRoleModuleConfig.providers
})
export class UserRoleModule { }