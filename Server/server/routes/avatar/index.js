import { WebApp } from 'meteor/webapp';

import { roomAvatar } from './room';
import { userAvatar } from './user';
import {cardAvatar} from "./card";

import './middlewares';

WebApp.connectHandlers.use('/avatar/room/', roomAvatar);
WebApp.connectHandlers.use('/avatar/', userAvatar);
WebApp.connectHandlers.use('/card/', cardAvatar);
