import React from 'react';
import PropTypes from 'prop-types';
import JitsiMeet, { JitsiMeetView as RNJitsiMeetView } from 'react-native-jitsi-meet';
import { connect } from 'react-redux';

import RocketChat from '../lib/rocketchat';
import { getUserSelector } from '../selectors/login';

import sharedStyles from './Styles';
import log from '../utils/log'
import {showToast} from "../utils/info";

const formatUrl = (url, baseUrl, avatarETag, uriSize, avatarAuthURLFragment) => (
	avatarETag?`${ baseUrl }/avatar/${ url }?etag=${avatarETag}&format=png&width=${ uriSize }&height=${ uriSize }${ avatarAuthURLFragment }`
		:`${ baseUrl }/avatar/${ url }?format=png&width=${ uriSize }&height=${ uriSize }${ avatarAuthURLFragment }`
);

class JitsiMeetView extends React.Component {
	static propTypes = {
		navigation: PropTypes.object,
		baseUrl: PropTypes.string,
		user: PropTypes.shape({
			id: PropTypes.string,
			username: PropTypes.string,
			name: PropTypes.string,
			token: PropTypes.string
		}),
		card: PropTypes.object
	}

	constructor(props) {
		super(props);
		this.rid = props.route.params?.rid;
		this.cardId = props.route.params?.cardId;
		this.onConferenceTerminated = this.onConferenceTerminated.bind(this);
		this.onConferenceWillJoin = this.onConferenceWillJoin.bind(this);
		this.jitsiTimeout = null;
	}

	componentDidMount() {
		const { route, user, baseUrl, card } = this.props;
		const {
			id: userId, token
		} = user;

		let avatarAuthURLFragment = `&rc_token=${ token }&rc_uid=${ userId }`;

		const avatar = formatUrl(card._id, baseUrl, card.avatarETag, 100, avatarAuthURLFragment);

		setTimeout(async () => {
			try{
				const userInfo = {
					email: `${card.username}@airlex.com`,
					displayName:card.username,
					avatar
				};
				const url = route.params?.url;
				const onlyAudio = route.params?.onlyAudio;

				await RocketChat.createJitsiCall(this.rid, this.cardId, onlyAudio);
				if (onlyAudio) {
					JitsiMeet.audioCall(url, userInfo);
				} else {
					JitsiMeet.call(url, userInfo);
				}
			}
			catch(e){
				const { navigation } = this.props;
				log(e, 'Create_JitsiCall_Error:');
				if(e.error === 'error-starting-video-call'){
					showToast(e.reason);
				}
				navigation.pop();
			}
		}, 1000);
	}

	componentWillUnmount() {
		const { route } = this.props;
		JitsiMeet.endCall();
		const onlyAudio = route.params?.onlyAudio;
		RocketChat.endJitsiCall(this.rid, this.cardId, onlyAudio).catch(e => log(e, 'End_JitsiCall_Failed'));
		console.log('end JitsiCall --------- ');
	}

	onConferenceWillJoin = (nativeEvent) => {

	}

	onConferenceTerminated = (nativeEvent) => {
		const { navigation } = this.props;
		navigation.pop();
	}

	render() {
		return (
			<RNJitsiMeetView
				onConferenceTerminated={this.onConferenceTerminated}
				onConferenceWillJoin={this.onConferenceWillJoin}
				style={sharedStyles.container}
			/>
		);
	}
}

const mapStateToProps = state => ({
	user: getUserSelector(state),
	baseUrl: state.server.server,
	card: state.cards.selected
});

export default connect(mapStateToProps)(JitsiMeetView);
