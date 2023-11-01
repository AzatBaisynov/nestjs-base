import { Injectable, HttpStatus, HttpException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { CreateUserInterface, UserBody, UserStatus } from "./user.types";
import { InjectRepository } from "@nestjs/typeorm";
import { User } from "./user.entity";
import { SelectQueryBuilder, Repository } from "typeorm";
import { ConfirmationService } from "src/confirmation/confirmation.service";
import { MailerService } from "@nestjs-modules/mailer/dist";
import { ConfirmationStatus } from "src/confirmation/confirmation.types";
import { UserRoleService } from "src/userRole/userRole.service";
import { UserRoleName } from "src/userRole/userRole.types";
import { UserRole } from "src/userRole/userRole.entity";
import { hash } from "bcrypt";
import { DataSource } from "typeorm";

@Injectable()
export class UserService {
	constructor(
		private readonly confirmationService: ConfirmationService,
		private configService: ConfigService,
		@InjectRepository(User)
		private userRepository: Repository<User>,
		private readonly mailerService: MailerService,
		private readonly userRoleService: UserRoleService
	) { }

	findAll() {
		console.log(this.configService.get<string>('DATABASE_USER'))
		console.log(this.configService.get<string>('DATABASE_PASSWORD'))
		return [{ id: 1, name: "Max" }]
	}

	async findUsersByRole(roleName: UserRoleName, statuses: UserStatus[]): Promise<User[]> {
		return this.userRepository
			.createQueryBuilder('user')
			.innerJoinAndSelect('user.roles', 'user_role', 'user_role.roleName = :roleName AND user.status in (:...statuses)', { roleName, statuses })
			.getMany()
	}

	async findById(id: string): Promise<User | null> {
		return await this.userRepository.findOne({
			where: {
				id
			},
			relations: {
				emailConfirmation: true
			}
		})
	}

	async findByUsername(username: string): Promise<User | null> {
		return await this.userRepository.findOneBy({ username })
	}

	private generateUser(body: UserBody): User {
		const user = new User();
		user.fullName = body.fullName;
		user.username = body.username;
		user.email = body.email;
		user.status = UserStatus.ON_CHECK;
		return user
	}

	private async checkExistingRole(role: UserRoleName): Promise<UserRole> {
		const userRole = await this.userRoleService.findRoleByRoleName(role)

		if (!userRole) {
			throw new HttpException('User role doesnt exist', HttpStatus.INTERNAL_SERVER_ERROR)
		}

		return userRole
	}

	async createUser(body: CreateUserInterface): Promise<User> {

		const userRole = await this.checkExistingRole(UserRoleName.USER)

		const user = this.generateUser(body)
		user.password = body.password
		user.roles = [ userRole ]
		const emailConfirmation = await this.confirmationService.createEmailConfirmation();
		user.emailConfirmation = emailConfirmation
		const createdUser = await this.userRepository.save(user)
		await this.mailerService.sendMail({
			to: user.email,
			from: this.configService.get<string>('EMAIL'),
			subject: "Please confirm your email!",
			text: `Your confirmation code is: ${emailConfirmation.code}`,
			html: ""
		})
		return createdUser
	}

	async confirmUserEmail(userId: string, code: string) {
		const user = await this.findById(userId)
		const emailConfirmation = await this.confirmationService.confirmEmailConfirmation(code, user.emailConfirmation)
		switch (emailConfirmation.confirmationStatus) {
			case ConfirmationStatus.PENDING: {
				throw new HttpException(`Code is incorrect, you have ${emailConfirmation.attempts} attempts`, HttpStatus.NOT_ACCEPTABLE)
			}
			case ConfirmationStatus.DECLINED: {
				throw new HttpException('You dont have no attempts anymore, register new email', HttpStatus.NOT_ACCEPTABLE)
			}
			case ConfirmationStatus.ACTIVATED: {
				await this.userRepository.update(userId, { status: UserStatus.ACTIVE })
				return await this.findById(userId)
			}
		}
	}

	async registerNewUserEmail(userId: string, email: string) {
		const user = await this.findById(userId)
		if (user.status === UserStatus.DELETED || user.status === UserStatus.INACTIVE) {
			throw new HttpException("User is inactive or was deleted", HttpStatus.FORBIDDEN)
		}
		try {
			await this.confirmationService.closeConfirmation(user.emailConfirmation.id)
			const emailConfirmation = await this.confirmationService.createEmailConfirmation()
			await this.userRepository.update(user.id, { email, emailConfirmation })
			const updatedUser = await this.findById(user.id)
			await this.mailerService.sendMail({
				to: updatedUser.email,
				from: this.configService.get<string>('EMAIL'),
				subject: "Please confirm your email!",
				text: `Your confirmation code is: ${emailConfirmation.code}`,
				html: ""
			})
			return updatedUser
		} catch (err) {
			throw new HttpException(err.message, HttpStatus.BAD_REQUEST)
		}
	}

	async createSuperAdmin(body: UserBody) {
		const superAdminRole = await this.checkExistingRole(UserRoleName.SUPER_ADMIN)

		const existingSuperAdmin = await this.findUsersByRole(UserRoleName.SUPER_ADMIN, [ UserStatus.ON_CHECK, UserStatus.ACTIVE ])

		if (existingSuperAdmin.length) {
			throw new HttpException("SuperAdmin User already exist", HttpStatus.FORBIDDEN)
		}

		const superAdmin = await this.generateUser(body)
		const randomPassword = (await hash(Math.random().toString(), 3)).slice(0, 8)
		superAdmin.password = randomPassword
		console.log("random pass: ", randomPassword)
		superAdmin.roles = [superAdminRole]	

		const createdSuperAdmin = await this.userRepository.save(superAdmin)

		await this.mailerService.sendMail({
			to: superAdmin.email,
			from: this.configService.get<string>('EMAIL'),
			subject: "Please confirm your email!",
			text: `Your password is: ${randomPassword}, enter your password to activate your account`,
			html: ""
		})

		return createdSuperAdmin
	}

	/* TODO: Create method to change super admin email */
	async changeSuperAdminEmail() {

	}
	/* TODO *********************************************/

	/* TODO: Resend password to super admin email */
	async resendSuperAdminPassword() {
		
	}
	/* TODO ***************************************/

	async confirmSuperAdminAccountByPassword(userId: string) {
		await this.userRepository.update(userId, { status: UserStatus.ACTIVE })
		return this.findById(userId)
	}
}