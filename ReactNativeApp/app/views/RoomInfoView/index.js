import React from 'react';
import PropTypes from 'prop-types';
import {
	View, Text, ScrollView, Alert
} from 'react-native';
import { connect } from 'react-redux';
import Swipeout from 'react-native-swipeout';

import Avatar from '../../containers/Avatar';
import Button from '../../containers/Button';
import styles from './styles';
import RocketChat from '../../lib/rocketchat';
import log from '../../utils/log';
import I18n from '../../i18n';
import * as HeaderButton from '../../containers/HeaderButton';
import StatusBar from '../../containers/StatusBar';
import {withTheme} from "../../theme";
import {themes} from "../../constants/colors";
import RoomTypeIcon from "../../containers/RoomTypeIcon";

class RoomInfoView extends React.Component {
	static navigationOptions = ({ route, navigation }) => {
		const rid = route.params?.rid;
		const isOwner = route.params?.isOwner;
		const room = route.params?.room;

		return {
			title: I18n.t('Profile'),
			headerRight: () => (
				isOwner
					? (
						<HeaderButton.Container>
							<HeaderButton.Item iconName='edit' onPress={() => navigation.navigate('RoomInfoEditView', { rid, room })} testID='room-info-view-edit-button' />
						</HeaderButton.Container>
					)
					: null
			)
		};
	}

	static propTypes = {
		navigation: PropTypes.object,
		user: PropTypes.shape({
			id: PropTypes.string,
			token: PropTypes.string
		}),
		Message_TimeFormat: PropTypes.string,
		allRoles: PropTypes.object,
		theme: PropTypes.string
	}

	constructor(props) {
		super(props);

		this.rid = props.route.params?.rid;
		this.cardId = props.route.params?.cardId;
		this.room = props.route.params?.room;
		this.mounted = false;

		this.state = {
			room: this.room || {},
			roles: [],
			member: {}
		};

		if (this.room && this.room.observe && this.room.rid) {
			this.roomObservable = this.room.observe();
			this.subscription = this.roomObservable
				.subscribe((changes) => {
					if (this.mounted) {
						this.setState({room: changes});
					} else {
						this.state.room = changes;
					}
				});
		}

		this.unsubscribeFocus = props.navigation.addListener('focus', () => this.getMember());
	}

	async componentDidMount() {
		this.mounted = true;
	}

	componentWillUnmount() {
		if(this.subscription && this.subscription.unsubscribe){
			this.subscription.unsubscribe();
		}
		if(this.unsubscribeFocus){
			this.unsubscribeFocus();
		}
	}

	getMember = async() => {
		const { room } = this.state;
		try {
			const roomMember = await RocketChat.getRoomMembers(room.rid, this.cardId, true);
			this.setState({ member: roomMember || {} });
		} catch (e) {
			log(e);
			this.setState({ member: {} });
		}
	}

	addMember = () => {
		const { navigation } = this.props;
		const { room } = this.state;
		navigation.navigate('GroupAddQRView', { rid: room.rid });
	}

	memberDeleteAlert = (kickId, name) => {
		Alert.alert(
			I18n.t('Do_you_want_to_kick_member', { name }),
			'',
			[
				{ text: I18n.t('Yes'), onPress: () => this.memberDelete(kickId), style: 'default' },
				{ text: I18n.t('No'), onPress: () => {}, style: 'default' }
			],
			{ cancelable: false }
		);
	}

	memberDelete = async(kickId) => {
		const { room } = this.state;
		try{
			await RocketChat.kickGroup(room.rid, this.cardId, kickId);
			await this.getMember();
		} catch (e) {
			Alert.alert(I18n.t('Oops'), '操作が失敗しました。');
		}
	}

	renderMember = () => {
		const { theme } = this.props;
		const { member, room } = this.state;
		const rows = [];

		if (member.total) {
			member.records.forEach((m) => {
				const swipeoutBtns = [{
					text: '削除',
					backgroundColor: '#F95522',
					onPress: () => this.memberDeleteAlert(m._id, m.username)
				}];

				rows.push(
					<Swipeout
						key={`add-list-swipout-key-${ m._id }`}
						right={swipeoutBtns}
						style={{ borderRadius: 5, backgroundColor: themes[theme].backgroundColor }}
						disabled={!room.isOwner || this.cardId === m._id}
						autoClose
					>
						<View style={styles.groupMemberContainer} key={`group-member-list-${ m._id }`}>
							<View style={styles.titleContainer}>
								<Avatar
									key={`group-member-avatar-${ m._id }`}
									style={styles.cardIconButton}
									borderRadius={20}
									type='ca'
									text={m._id}
									size={40}
								/>
								<Text style={[styles.title, { fontSize: 15, color: themes[theme].bodyText }, m.isOwner&&{ marginRight: 140 }]} numberOfLines={1} ellipsizeMode={'tail'}>{m.username}</Text>
								{m.isOwner
									? (
										<Text style={[styles.ownerLabel, { fontSize: 15 }]} numberOfLines={1} textAlign='right'>{I18n.t('Group_owner')}</Text>
									)
									: null}
							</View>
						</View>
					</Swipeout>
				);
			});
		}
		return rows;
	}

	render() {
		const { navigation, theme } = this.props;
		const { room } = this.state;
		if (!room) {
			return <View />;
		}

		return (
			<View style={{ ...styles.container, backgroundColor: themes[theme].backgroundColor }}>
				<ScrollView style={styles.scroll}>
					<StatusBar />
					<View style={styles.avatarContainer}>
						<Avatar
							text={room.name}
							size={100}
							borderRadius={50}
							style={styles.avatar}
							type={room.t}
							rid={room.rid}
						/>
						<View style={styles.roomTitleContainer}>
							<Text testID='room-info-view-group-title' style={{ ...styles.roomTitle, color: themes[theme].auxiliaryText }} key='room-info-group-title'>{I18n.t('Group_name')}</Text>
							<View style={styles.roomNameContainer}>
								{
									room.adhoc
										? (
											<View style={styles.roomTitleRow}>
												<Text testID='room-info-view-name' style={{ ...styles.roomName, color: themes[theme].bodyText }} key='room-info-name'>{room.name}</Text>
											</View>
										)
										: (
											<View style={styles.roomTitleRow}>
												<Text testID='room-info-view-name' style={{ ...styles.roomName, color: themes[theme].bodyText }} key='room-info-name'>{room.name}</Text>
											</View>
										)
								}
							</View>
						</View>
					</View>
					<View style={styles.sectionSeparatorBorder} />
					<View style={styles.descriptionContainer}>
						<Text style={{ ...styles.itemLabel,  color: themes[theme].auxiliaryText }}>{I18n.t('Description')}</Text>
						<Text
							style={[!room.description && styles.itemContent__empty, { color: themes[theme].bodyText }]}
							testID={`room-info-view-description`}
						>
							{ room.description??I18n.t(`No_description_provided`) }
						</Text>
					</View>
					<View style={styles.sectionSeparatorBorder} />
					<Text style={{ ...styles.nameLabel, color: themes[theme].auxiliaryText }}>{I18n.t('Group_member')}</Text>
					{this.renderMember()}
				</ScrollView>
				{!room.adhoc
					? (
						<View style={styles.footer}>
							<Button
								testID='sidebar-toggle-status'
								type='primary'
								onPress={() => navigation.navigate('GroupAddQRView', { rid: room.rid })}
								text={I18n.t('Add_User')}
								size='w'
								theme={theme}
							/>
						</View>
					)
					: null
				}
			</View>
		);
	}
}


const mapStateToProps = state => ({
	user: {
		id: state.login.user && state.login.user.id,
		token: state.login.user && state.login.user.token
	},
	Message_TimeFormat: state.settings.Message_TimeFormat,
	allRoles: state.roles,
});

export default connect(mapStateToProps, null)(withTheme(RoomInfoView));
