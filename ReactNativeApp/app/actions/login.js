import * as types from './actionsTypes';

export function loginRequest(credentials, logoutOnError) {
	return {
		type: types.LOGIN.REQUEST,
		credentials,
		logoutOnError
	};
}

export function loginReset() {
	return {
		type: types.LOGIN.RESET,
	}
}

export function loginSuccess(data) {
	return {
		type: types.LOGIN.SUCCESS,
		data
	};
}

export function loginFailure(err) {
	return {
		type: types.LOGIN.FAILURE,
		err
	};
}

export function logout(forcedByServer = false) {
	return {
		type: types.LOGOUT,
		forcedByServer
	};
}

export function setUser(user) {
	return {
		type: types.USER.SET,
		user
	};
}

export function setLoginServices(data) {
	return {
		type: types.LOGIN.SET_SERVICES,
		data
	};
}

export function setPreference(preference) {
	return {
		type: types.LOGIN.SET_PREFERENCE,
		preference
	};
}

export function setLocalAuthenticated(isLocalAuthenticated) {
	return {
		type: types.LOGIN.SET_LOCAL_AUTHENTICATED,
		isLocalAuthenticated
	};
}
