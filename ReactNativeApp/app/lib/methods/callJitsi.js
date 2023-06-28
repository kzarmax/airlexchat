import reduxStore from '../createStore';
import Navigation from '../Navigation';
import log, { LOG_L_LOW } from '../../utils/log';

const jitsiBaseUrl = ({
	Jitsi_SSL, Jitsi_Domain, Jitsi_URL_Room_Prefix, uniqueID
}) => {
	// if (!Jitsi_Enabled) {
	// 	return '';
	// }
	const uniqueIdentifier = uniqueID || 'undefined';
	const domain = Jitsi_Domain;
	const prefix = Jitsi_URL_Room_Prefix;

	const urlProtocol = Jitsi_SSL ? 'https://' : 'http://';
	const urlDomain = `${ domain }/`;

	return `${ urlProtocol }${ urlDomain }${ prefix }${ uniqueIdentifier }`;
};

async function callJitsi(rid, cardId, onlyAudio = false) {
	let accessToken = null;
	let queryString = '';
	const audio_url=onlyAudio?'1':'0';
	const { settings } = reduxStore.getState();
	const { Jitsi_Enabled_TokenAuth } = settings;
	LOG_L_LOW('callJitsi : ', rid, cardId, onlyAudio);
	// if (Jitsi_Enabled_TokenAuth) {
	// 	try {
	// 		accessToken = await this.sdk.methodCall('jitsi:generateAccessToken', rid);
	// 	} catch (e) {
	// 		log(e);
	// 	}
	// }
	//
	// if (accessToken) {
	// 	queryString = `?jwt=${ accessToken }`;
	// }

	// Default Language Japanese
	Navigation.navigate('JitsiMeetView', { url: `${ jitsiBaseUrl(settings) }${ rid }${audio_url}${ queryString }?lang=ja`,  onlyAudio, rid, cardId });
}

export default callJitsi;
