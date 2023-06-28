import React from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';

import * as HeaderButtom from '../../../containers/HeaderButton';
import database from '../../../lib/database';
import { getUserSelector } from '../../../selectors/login';
import * as HeaderButton from "../../../containers/HeaderButton";
import Touchable from "react-native-platform-touchable";
import MaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons";
import {themes} from "../../../constants/colors";
import RocketChat from "../../../lib/rocketchat";

class RightButtonsContainer extends React.PureComponent {
	static propTypes = {
		userId: PropTypes.string,
		threadsEnabled: PropTypes.bool,
		rid: PropTypes.string,
		cardId: PropTypes.string,
		starIcon: PropTypes.string,
		t: PropTypes.string,
		tmid: PropTypes.string,
		navigation: PropTypes.object,
		toggleFav: PropTypes.func,
		toggleCall: PropTypes.func,
		goRoomActionsView: PropTypes.func,
		toggleFollowThread: PropTypes.func
	};

	constructor(props) {
		super(props);
		this.state = {
			isFollowingThread: true
		};
	}

	async componentDidMount() {
		const { tmid } = this.props;
		if (tmid) {
			const db = database.active;
			try {
				const threadRecord = await db.collections.get('messages').find(tmid);
				this.observeThead(threadRecord);
			} catch (e) {
				log(e);
			}
		}
	}

	componentWillUnmount() {
		if (this.threadSubscription && this.threadSubscription.unsubscribe) {
			this.threadSubscription.unsubscribe();
		}
	}

	observeThead = (threadRecord) => {
		const threadObservable = threadRecord.observe();
		this.threadSubscription = threadObservable
			.subscribe(thread => this.updateThread(thread));
	}

	updateThread = (thread) => {
		const { cardId } = this.props;
		this.setState({
			isFollowingThread: thread.replies && !!thread.replies.find(t => t === cardId)
		});
	}

	toggleFollowThread = () => {
		const { isFollowingThread } = this.state;
		const { toggleFollowThread } = this.props;
		if (toggleFollowThread) {
			toggleFollowThread(isFollowingThread);
		}
	}

	render() {
		const { isFollowingThread } = this.state;
		const { goRoomActionsView, toggleFav, toggleCall, starIcon, t, tmid, theme } = this.props;
		if (t === 'l') {
			return null;
		}
		if (tmid) {
			return (
				<HeaderButtom.Container>
					<HeaderButtom.Item
						title='bell'
						iconName={isFollowingThread ? 'notification' : 'notification-disabled'}
						onPress={this.toggleFollowThread}
						testID={isFollowingThread ? 'room-view-header-unfollow' : 'room-view-header-follow'}
					/>
				</HeaderButtom.Container>
			);
		}

		return (
			<HeaderButton.Container>
				<HeaderButton.Item
					title='star'
					titleStyle
					iconName={starIcon}
					onPress={toggleFav}
					testID='room-view-header-star'/>
				<HeaderButtom.Item
					title='phone'
					titleStyle
					iconName={'phone'}
					onPress={toggleCall}
					testID={'room-view-header-phone'}
				/>
				<Touchable onPress={goRoomActionsView}>
					<MaterialCommunityIcons name={'chevron-triple-right'} size={32} color={themes[theme].headerTitleColor} style={{ paddingHorizontal: 8, marginLeft: 16 }}/>
				</Touchable>
			</HeaderButton.Container>
		);
	}
}

const mapStateToProps = state => ({
	userId: getUserSelector(state).id
});

export default connect(mapStateToProps)(RightButtonsContainer);
