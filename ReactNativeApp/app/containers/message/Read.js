import React, {useContext} from 'react';
import PropTypes from 'prop-types';
import {
	View, Text, StyleSheet, TouchableWithoutFeedback
} from 'react-native';
import I18n from '../../i18n';
import {themes} from "../../constants/colors";
import MessageContext from "./Context";

const styles = StyleSheet.create({
	container: {
		flexDirection: 'row',
		alignItems: 'flex-end',
		justifyContent: 'flex-end',
		marginBottom: 2
	},
	read: {
		fontSize: 12,
		paddingRight: 10,
		fontWeight: '300',
		lineHeight: 16
	}
});


const Read = React.memo(({ reads, roomType, onReadsPress, isReadReceiptEnabled, textColor, isOwn, theme }) => {
	if (!isOwn || !isReadReceiptEnabled || !reads) {
		return null;
	}

	const { card } = useContext(MessageContext);
	const num_read = reads.filter(read => read !== card._id).length;

	if (num_read === 0) {
		return null;
	}

	if (roomType === 'd') {
		return (
			<View style={styles.container}>
				<Text style={{ ...styles.read, color: textColor ? textColor: themes[theme].readText }}>{I18n.t('Read')}</Text>
			</View>
		);
	} else {
		return (
			<TouchableWithoutFeedback onPress={onReadsPress}>
				<View style={styles.container}>
					<Text style={{ ...styles.read, color: textColor ? textColor: themes[theme].readText }}>{I18n.t('Read')} {num_read}</Text>
				</View>
			</TouchableWithoutFeedback>
		);
	}
});

Read.propTypes = {
	reads: PropTypes.oneOfType([
		PropTypes.array,
		PropTypes.object
	]),
	isReadReceiptEnabled: PropTypes.bool,
	isOwn: PropTypes.bool,
	roomType: PropTypes.string,
	onReadsPress: PropTypes.func,
	textColor: PropTypes.string,
	theme: PropTypes.string
}

export default Read;
