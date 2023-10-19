import { UserRole } from "src/userRole/userRole.entity";

export interface UserBody {
	fullName: string;
	email: string;
	username: string;
}

export interface CreateUserInterface extends UserBody{
	password: string;
}


export interface UserInterface {
	id: string;
	fullName: string;
	username: string;
	email: string;
	password: string;
	status: UserStatus;
	roles: UserRole[];
}

export enum UserStatus {
	ON_CHECK = 0,
	ACTIVE = 1,
	INACTIVE = 2,
	DELETED = 3
}
