import { IInquiry } from '../../../definition/IInquiry';
import { IMessage } from '../../../definition/IMessage';
import { IRole } from '../../../definition/IRole';
import { IRoom } from '../../../definition/IRoom';
import { ISetting } from '../../../definition/ISetting';
import { ISubscription } from '../../../definition/ISubscription';
import { IUser } from '../../../definition/IUser';
import { AutoUpdateRecord } from '../types/IMeteor';
import { IEmoji } from '../../../definition/IEmoji';
import { IUserStatus } from '../../../definition/IUserStatus';
import { IUserSession } from '../../../definition/IUserSession';
import { ILoginServiceConfiguration } from '../../../definition/ILoginServiceConfiguration';
import { IInstanceStatus } from '../../../definition/IInstanceStatus';
import { IIntegrationHistory } from '../../../definition/IIntegrationHistory';
import { ILivechatDepartmentAgents } from '../../../definition/ILivechatDepartmentAgents';
import { IIntegration } from '../../../definition/IIntegration';
import { ICard } from '../../../definition/ICard';

export type EventSignatures = {
	'emoji.deleteCustom'(emoji: IEmoji): void;
	'emoji.updateCustom'(emoji: IEmoji): void;
	'license.module'(data: { module: string; valid: boolean }): void;
	'livechat-inquiry-queue-observer'(data: { action: string; inquiry: IInquiry }): void;
	'message'(data: { action: string; message: IMessage }): void;
	'meteor.autoUpdateClientVersionChanged'(data: {record: AutoUpdateRecord }): void;
	'notify.ephemeralMessage'(uid: string, rid: string, message: Partial<IMessage>): void;
	'permission.changed'(data: { clientAction: string; data: any }): void;
	'room'(data: { action: string; room: Partial<IRoom> }): void;
	'room.avatarUpdate'(room: Partial<IRoom>): void;
	'setting'(data: { action: string; setting: Partial<ISetting> }): void;
	'stream'([streamer, eventName, payload]: [string, string, string]): void;
	'subscription'(data: { action: string; subscription: Partial<ISubscription> }): void;
	'user.avatarUpdate'(user: Partial<IUser>): void;
	'user.deleted'(user: Partial<IUser>): void;
	'user.deleteCustomStatus'(userStatus: IUserStatus): void;
	'user.nameChanged'(user: Partial<IUser>): void;
	'user.roleUpdate'(update: Record<string, any>): void;
	'user.updateCustomStatus'(userStatus: IUserStatus): void;
	'presence.status'(data: { user: Partial<IUser> }): void;
	'watch.messages'(data: { clientAction: string; message: Partial<IMessage> }): void;
	'watch.roles'(data: { clientAction: string; role: Partial<IRole> }): void;
	'watch.rooms'(data: { clientAction: string; room: Pick<IRoom, '_id'> & Partial<IRoom> }): void;
	'watch.subscriptions'(data: { clientAction: string; subscription: Partial<ISubscription> }): void;
	'watch.userSessions'(data: { clientAction: string; userSession: Partial<IUserSession> }): void;
	'watch.inquiries'(data: { clientAction: string; inquiry: IInquiry; diff?: Record<string, any> }): void;
	'watch.settings'(data: { clientAction: string; setting: ISetting }): void;
	'watch.users'(data: { clientAction: string; data?: Partial<IUser>; diff?: Record<string, any>; unset?: Record<string, number>; id: string }): void;
	'watch.loginServiceConfiguration'(data: { clientAction: string; data: Partial<ILoginServiceConfiguration>; id: string }): void;
	'watch.instanceStatus'(data: { clientAction: string; data?: Partial<IInstanceStatus>; diff?: Record<string, any>; id: string }): void;
	'watch.integrationHistory'(data: { clientAction: string; data: Partial<IIntegrationHistory>; diff?: Record<string, any>; id: string }): void;
	'watch.integrations'(data: { clientAction: string; data: Partial<IIntegration>; id: string }): void;
	'watch.livechatDepartmentAgents'(data: { clientAction: string; data: Partial<ILivechatDepartmentAgents>; diff?: Record<string, any>; id: string }): void;
	'card.avatarUpdate'(card: Partial<ICard>): void;
	'card.imageUpdate'(card: Partial<ICard>): void;
	'card.nameChanged'(card: Partial<ICard>): void;
}
