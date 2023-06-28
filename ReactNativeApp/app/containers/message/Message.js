import React, {useContext} from 'react';
import PropTypes from 'prop-types';
import { View } from 'react-native';

import User from './User';
import styles from './styles';
import RepliedThread from './RepliedThread';
import MessageAvatar from './MessageAvatar';
import Attachments from './Attachments';
import Urls from './Urls';
import Thread from './Thread';
import Blocks from './Blocks';
import Reactions from './Reactions';
import Broadcast from './Broadcast';
import Discussion from './Discussion';
import Content from './Content';
import CallButton from './CallButton';
import Gift from './Gift';
import Read from './Read';
import moment from 'moment';
import I18n from '../../i18n';
import { BorderlessButton } from "react-native-gesture-handler";
import { CustomIcon } from '../../lib/Icons';
import MessageContext from "./Context";
import Touchable from "./Touchable";

const MessageInner = React.memo((props) => {
	if (props.type === 'discussion-created') {
		return (
			<>
				<Read {...props} />
				<User {...props} />
				<Discussion {...props} />
			</>
		);
	}
	if (props.type === 'jitsi_call_started' || props.type === 'jitsi_video_call_started' ) {
		return (
			<>
				{
					props.isOwn ?
						<View style={{ flexDirection: 'row' }}>
							<View style={{flexGrow: 1, marginHorizontal: 4, alignItems: 'flex-end', justifyContent: 'flex-end'}}>
								<User { ...props } />
							</View>
							<View style={{ maxWidth: '80%', alignItems: 'flex-end' }}>
								<Content { ...props } isInfo/>
								<CallButton { ...props } />
							</View>
						</View>
						:
						[
							<User { ...props } />,
							<Content { ...props } isInfo/>,
							<CallButton { ...props } />
						]
				}
			</>
		);
	}
	if (props.type === 'gift_message' ) {
		return (
			<>
				{
					props.isOwn ?
						<View style={ { flexDirection: 'row' } }>
							<View style={ {
								flexGrow: 1,
								marginHorizontal: 4,
								alignItems: 'flex-end',
								justifyContent: 'flex-end'
							} }>
								<User { ...props } />
							</View>
							<View>
								<Gift { ...props } />
							</View>
						</View>
						:
                        [
                            <User { ...props } />,
                            <Gift { ...props } />
                        ]
				}
			</>
		);
	}
	if (props.blocks && props.blocks.length) {
		return (
			<>
				<Read {...props} />
				<User {...props} />
				<Blocks {...props} />
				<Thread {...props} />
				<Reactions {...props} />
			</>
		);
	}
	return (
		<>
			{
				props.isOwn ?
					<View style={{ flexDirection: 'row' }}>
						<View style={{ marginHorizontal: 4, justifyContent: 'flex-end' }}>
							<Read {...props} />
							<User {...props} />
						</View>
						<View style={{ maxWidth: '80%' }}>
							<Attachments {...props} />
							<View style={{ alignItems: 'flex-end' }}>
								<Content {...props} />
								<Urls {...props} />
							</View>
						</View>
					</View>
					:
					[
							<User {...props} />,
							<Attachments {...props} />,
							<Content {...props} />,
							<Urls {...props} />
					]
			}
			<Thread {...props} />
			<Reactions {...props} />
			<Broadcast {...props} />
		</>
	);
});
MessageInner.displayName = 'MessageInner';

const Message = React.memo((props) => {

	const {author, msg,  ts, timeFormat, isThreadReply, isThreadSequential, isInfo, isHeader, isEditing, isTemp, hasError, isOwn, style} = props;

	const accessibilityLabel = I18n.t('Message_accessibility', { user: author && author.username, time: moment(ts).format(timeFormat), message: msg });

	if (isThreadReply || isThreadSequential || isInfo) {
		const thread = isThreadReply ? <RepliedThread {...props} isOwn={isOwn} /> : null;
		return (
			<View style={[styles.container, isEditing&&styles.editing, style, isOwn?styles.ownReplyThreadContainer:styles.replyThreadContainer]}
				  accessibilityLabel={accessibilityLabel}
			>
				{thread}
				<View style={!isOwn && {flexDirection:'row'}}>
					{isOwn ? null: <MessageAvatar small {...props} />}
					<View
						style={[
							isOwn && styles.messageOwnContent,
							!isOwn && styles.messageContent,
							!hasError && isHeader && styles.messageContentWithHeader,
							!hasError && !isHeader && styles.messageContentWithError,
							isTemp && styles.temp
						]}
					>
						<Content {...props} isOwn={isOwn}/>
					</View>
				</View>
			</View>
		);
	}
	return (
		<View style={[styles.container, isEditing && styles.editing, style]}
			  accessibilityLabel={accessibilityLabel}
		>
			<View style={styles.flex}>
				{isOwn ? null : <MessageAvatar {...props} />}
				<View
					style={[
						isOwn && styles.messageOwnContent,
						!isOwn && styles.messageContent,
						!hasError && isHeader && styles.messageContentWithHeader,
						!hasError && !isHeader && styles.messageContentWithError,
						isTemp && styles.temp
					]}
				>
					<MessageInner {...props} isOwn={isOwn} />
				</View>
			</View>
		</View>
	);
});
Message.displayName = 'Message';

const MessageTouchable = React.memo((props) => {
	const { onPress, onLongPress, onReply, onErrorPress } = useContext(MessageContext);
	const renderError = () => {
		return (
			<BorderlessButton key={'message_' + props.id} onPress={onErrorPress} style={styles.errorButton}>
				<CustomIcon name='warning' color='red' size={30} />
			</BorderlessButton>
		);
	};
	if (props.hasError) {
		return (
			<View key={'message_' + props.id} style={styles.root}>
				{ renderError() }
				<Message {...props} />
			</View>
		);
	}

	const isScrollable = !props.tmid
		&& !props.isThreadRoom
		&& (props.type === null || props.type === 'e2e')
		&& !!(props.msg)
		&& (props.msg.length > 0);

	return (
		<Touchable
			onPress={onPress}
			onLongPress={onLongPress}
			onReply={onReply}
			textColor={props.textColor}
			swipeEnabled={isScrollable}
			disabled={props.isInfo || props.archived || props.isTemp}
			theme={props.theme}
		>
			<View>
				<Message {...props} />
			</View>
		</Touchable>
	);
});
MessageTouchable.displayName = 'MessageTouchable';

MessageTouchable.propTypes = {
	hasError: PropTypes.bool,
	isInfo: PropTypes.bool,
	isTemp: PropTypes.bool,
	isHeader: PropTypes.bool,
	isEdited: PropTypes.bool,
	isEditing: PropTypes.bool,
	archived: PropTypes.bool,
	onErrorPress: PropTypes.func,
	getCustomEmoji: PropTypes.func,
	downloadGiftEmoji:PropTypes.func
};

Message.propTypes = {
	isThreadReply: PropTypes.bool,
	isThreadSequential: PropTypes.bool,
	isInfo: PropTypes.bool,
	isTemp: PropTypes.bool,
	isHeader: PropTypes.bool,
	isEdited: PropTypes.bool,
	isEditing: PropTypes.bool,
	hasError: PropTypes.bool,
	style: PropTypes.any,
	getCustomEmoji: PropTypes.func,
	downloadGiftEmoji: PropTypes.func,
	isReadReceiptEnabled: PropTypes.bool,
	unread: PropTypes.bool,
	reads: PropTypes.oneOfType([
		PropTypes.array,
		PropTypes.object
	]),
	roomType: PropTypes.string,
	searchText: PropTypes.string,
	theme: PropTypes.string
};

MessageInner.propTypes = {
	type: PropTypes.string,
	blocks: PropTypes.array
};

export default MessageTouchable;
