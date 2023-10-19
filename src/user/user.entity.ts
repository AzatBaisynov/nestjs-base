import { BaseEntity } from "src/base.entity";
import { BeforeInsert, Column, Entity, JoinTable, ManyToMany, ManyToOne } from "typeorm";
import { UserInterface, UserStatus } from "./user.types";
import { hash } from "bcrypt";
import { Confirmation } from "src/confirmation/confirmation.entity";
import { UserRole } from "src/userRole/userRole.entity";

@Entity()
export class User extends BaseEntity implements UserInterface {
	@Column({
		nullable: false
	})
	fullName: string

	@Column({
		unique: true,
		nullable: false
	})
	username: string

	@Column({
		unique: true,
		nullable: false
	})
	email: string

	@Column({
		nullable: false
	})
	password: string

	@Column({
		nullable: false
	})
	status: UserStatus

	@ManyToMany(() => UserRole)
	@JoinTable()
	roles: UserRole[]

	@ManyToOne(() => Confirmation)
	emailConfirmation: Confirmation


	@BeforeInsert()
	async hashPassword() {
		this.password = await hash(this.password, 10)
	}
}