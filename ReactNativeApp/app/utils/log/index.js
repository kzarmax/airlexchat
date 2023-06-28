import firebaseAnalytics from '@react-native-firebase/analytics';
import { isFDroidBuild } from '../../constants/environment';
import config from '../../../config';
import events from './events';

const analytics = firebaseAnalytics || '';
let bugsnag = '';
let crashlytics;

if (!isFDroidBuild) {
	const { Client } = require('bugsnag-react-native');
	crashlytics = require('@react-native-firebase/crashlytics').default;
	bugsnag = new Client(config.BUGSNAG_API_KEY);
}

export { analytics };
export const loggerConfig = bugsnag.config;
export const { leaveBreadcrumb } = bugsnag;
export { events };

let metadata = {};

export const logServerVersion = (serverVersion) => {
	metadata = {
		serverVersion
	};
};

export const logEvent = (eventName, payload) => {
	try {
		if (!isFDroidBuild) {
			analytics().logEvent(eventName, payload);
			leaveBreadcrumb(eventName, payload);
		}
	} catch {
		// Do nothing
	}
};

export const setCurrentScreen = (currentScreen) => {
	analytics().logScreenView({
		screen_class: currentScreen,
		screen_name: currentScreen,
	});
	leaveBreadcrumb(currentScreen, { type: 'navigation' });
};

export default (e, message = null) => {
	if (e instanceof Error && bugsnag && e.message !== 'Aborted' && !__DEV__) {
		bugsnag.notify(e, (report) => {
			report.metadata = {
				details: {
					...metadata
				}
			};
		});
		if (!isFDroidBuild) {
			crashlytics().recordError(e);
		}
	} else {
		LOG_L_TOP(message?message:'Error: ', e);
	}
};


/**
 * Debug Log Level
 *
 *   ALLOW_LOG_LEVEL: ALLOW CONSOLE LOG LEVEL
 *
 * LOG LEVELS
 *   NONE: 		NO_CONSOLE_LOG,
 *   TOP: 		TOP_CONSOLE_LOG,
 *   MIDDLE: 	MIDDLE_CONSOLE_LOG,
 *   LOW: 		LOW_CONSOLE_LOG,
 *   LOWEST:	LOWEST_CONSOLE_LOG
 *
 * @type {number}
 */
export const LOG_LEVEL_TOP = 0;
export const LOG_LEVEL_MIDDLE = 1;
export const LOG_LEVEL_LOW = 2;
export const LOG_LEVEL_LOWEST = 3;
export const LOG_LEVEL_NONE = -1;

export const ALLOW_LOG_LEVEL = LOG_LEVEL_LOW;
/**
 *
 * @param message
 * @param params
 * @constructor
 */
export const LOG_L_TOP = (message, ...params)=>{
	LOG_L(LOG_LEVEL_TOP, message, ...params);
};

/**
 *
 * @param message
 * @param params
 * @constructor
 */
export const LOG_L_MIDDLE = (message, ...params) => {
	LOG_L(LOG_LEVEL_MIDDLE, message, ...params);
};

/**
 *
 * @param message
 * @param params
 * @constructor
 */
export const LOG_L_LOW = (message, ...params) => {
	LOG_L(LOG_LEVEL_LOW, message, ...params);
};

/**
 *
 * @param message
 * @param params
 * @constructor
 */
export const LOG_L_LOWEST = (message, ...params) =>{
	LOG_L(LOG_LEVEL_LOWEST, message, ...params);
};

/**
 *
 * @param log_level
 * @param message
 * @param params
 * @constructor
 */
export const LOG_L = (log_level, message, ...params) => {
	if (ALLOW_LOG_LEVEL !== LOG_LEVEL_NONE && log_level <= ALLOW_LOG_LEVEL) {
		console.log(message, ...params);
	}
};
