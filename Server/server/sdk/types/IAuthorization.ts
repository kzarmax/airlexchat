import { IRoom } from '../../../definition/IRoom';
import { ICard } from '../../../definition/ICard';
import { IUser } from '../../../definition/IUser';

export type RoomAccessValidator = (room: Partial<IRoom>, card: Partial<ICard>, extraData?: Record<string, any>) => Promise<boolean>;
export type RoomAccessWithUserValidator = (room: Partial<IRoom>, user: Partial<IUser>, extraData?: Record<string, any>) => Promise<boolean>;

export interface IAuthorization {
	hasAllPermission(userId: string, permissions: string[], scope?: string): Promise<boolean>;
	hasPermission(userId: string, permissionId: string, scope?: string): Promise<boolean>;
	hasAtLeastOnePermission(userId: string, permissions: string[], scope?: string): Promise<boolean>;
	addRoleRestrictions(role: string, permissions: string[]): Promise<void>;
	canAccessRoom: RoomAccessValidator;
	canAccessRoomWithUser: RoomAccessWithUserValidator;
}
