import React, {useState} from 'react';
import {View, StyleSheet, TouchableOpacity} from 'react-native';
import PropTypes from 'prop-types';
import {VectorIcon} from "../../presentation/VectorIcon";
import {themes} from "../../constants/colors";

const styles = StyleSheet.create({
	overContainer: {
		height: 40,
		overflow: 'hidden'
	}
});

const REPLY_MAX_HEIGHT = 44;

const ReplyDescriptionContainer = React.memo(({children, isOwn, style, theme}) => {

	const [height, setHeight] = useState(0);
	const [more, setMore] = useState(false);

	return (
		<TouchableOpacity style={style} onPress={() => setMore(!more)}>
			<View
				onLayout={({nativeEvent: {layout: {height: h}}}) => {
					if (height) return;
					if (h <= REPLY_MAX_HEIGHT) setMore(true);
					if (!more) setHeight(h);
				}}
				style={(height > REPLY_MAX_HEIGHT && !more) ? styles.overContainer : null}>
				{children}
			</View>
			{ height > REPLY_MAX_HEIGHT && !more &&
				<View style={{marginTop: 2}}>
					<VectorIcon type='MaterialCommunityIcons' name='dots-horizontal' size={15}
								color={isOwn ? themes[theme].ownMsgText : themes[theme].otherMsgText}/>
				</View>
			}
		</TouchableOpacity>
	);
});

ReplyDescriptionContainer.propTypes = {
	children: PropTypes.oneOfType([PropTypes.arrayOf(PropTypes.element), PropTypes.element]),
	isOwn: PropTypes.bool,
	style: PropTypes.object,
	theme: PropTypes.string
};

ReplyDescriptionContainer.displayName = 'Reply.DescriptionContainer';

export default ReplyDescriptionContainer;
