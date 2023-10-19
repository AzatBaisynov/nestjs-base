import { Injectable } from "@nestjs/common";
import { UserService } from "src/user/user.service";
import { JwtService } from "@nestjs/jwt";
import { UserInterface } from "src/user/user.types";
import { compare } from "bcrypt";

@Injectable()
export class AuthService {
	 constructor(
		private userService: UserService,
		private jwtService: JwtService
	 ) {}

	 async validateUser(username: string, password: string) {
		const user = await this.userService.findByUsername(username)
		const isMatch = await compare(password, user.password)
		if (user && isMatch) {
			const { password, ...result } = user
			return result
		}
		return null
	 }
	 
	 async createToken(user: UserInterface) {
		const payload = { username: user.username, email: user.email, id: user.id, roles: user.roles }
		return {
			access_token: this.jwtService.sign(payload) 
		}
	 }
}