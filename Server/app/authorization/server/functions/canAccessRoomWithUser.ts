import { Promise } from 'meteor/promise';

import { Authorization } from '../../../../server/sdk';
import { IAuthorization } from '../../../../server/sdk/types/IAuthorization';

export const canAccessRoomWithUserAsync = Authorization.canAccessRoomWithUser;

export const canAccessRoomWithUser = (...args: Parameters<IAuthorization['canAccessRoomWithUser']>): boolean => Promise.await(canAccessRoomWithUserAsync(...args));
