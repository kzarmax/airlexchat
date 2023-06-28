import React from 'react';
import {
	View, Text, FlatList, StyleSheet
} from 'react-native';
import PropTypes from 'prop-types';
import Modal from 'react-native-modal';

import I18n from '../../i18n';
import UserListItem from '../../presentation/UserListItem';

const styles = StyleSheet.create({
	modalContainer: {
		backgroundColor: '#FFF',
		width: '100%',
		height: '60%',
		borderRadius: 10
	},
	titleContainer: {
		width: '100%',
		alignItems: 'center',
		paddingVertical: 18,
		borderBottomWidth: 1,
		borderBottomColor: '#E1E5E8'
	},
	title: {
		color: '#0C0D0F',
		textAlign: 'center',
		fontSize: 18,
		fontWeight: '600'
	},
	listContainer: {
		flex: 1
	},
	separator: {
		height: StyleSheet.hairlineWidth,
		backgroundColor: '#E1E5E8'
		// marginLeft: 60
	}

});

export default class ReadReceipt extends React.PureComponent {
	static propTypes = {
		isVisible: PropTypes.bool.isRequired,
		close: PropTypes.func.isRequired,
		user: PropTypes.object.isRequired,
		baseUrl: PropTypes.string.isRequired,
		// cardId: PropTypes.string.isRequired,
		members: PropTypes.oneOfType([
			PropTypes.array,
			PropTypes.object
		]),
		reads: PropTypes.oneOfType([
			PropTypes.array,
			PropTypes.object
		]),
		theme: PropTypes.string
	}

	onPress = (item) => {
	}

	onLongPress = (user) => {
	}

	renderSeparator = () => <View style={styles.separator} />;

	renderItem = (item) => {
		const { user, baseUrl, reads, theme } = this.props;

		let style = {};
		let icon = 'check';
		const exists = reads.includes(item._id);
		if (!exists) {
			style = { backgroundColor: '#eeeddd' };
			icon = null;
		}

		return (
			<UserListItem
				cardId={item._id}
				username={item.username}
				onPress={() => this.onPress(item)}
				onLongPress={() => this.onLongPress(item)}
				baseUrl={baseUrl}
				testID={`read-receipt-item-${ item.cardId }`}
				user={user}
				icon={icon}
				style={style}
				theme={theme}
			 	/>
		);
	}

	render() {
		const {
			isVisible, close, members
		} = this.props;
		return (
			<Modal
				isVisible={isVisible}
				animationIn='fadeIn'
				animationOut='fadeOut'
				onBackdropPress={close}
				onBackButtonPress={close}
				backdropOpacity={0.7}
			>
				<View style={styles.modalContainer}>
					<View style={styles.titleContainer}>
						<Text style={styles.title}>{I18n.t('Read_Receipt')}</Text>
					</View>
					<View style={styles.listContainer}>
						<FlatList
							data={members}
							renderItem={({ item }) => this.renderItem(item)}
							keyExtractor={item => item.cardId}
							ItemSeparatorComponent={this.renderSeparator}
						/>
					</View>
				</View>
			</Modal>
		);
	}
}
