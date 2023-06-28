import { StyleSheet } from 'react-native';
import sharedStyles from '../Styles';

export default StyleSheet.create({
	container: {
		flex: 1,
	},
	scroll: {
		flex: 1,
		flexDirection: 'column',
		padding: 10,
		marginBottom: 100
	},
	descriptionContainer: {
		padding: 10,
		justifyContent: 'center'
	},
	avatarContainer: {
		height: 100,
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'center'
	},
	avatar: {
		marginHorizontal: 10
	},
	roomTitleContainer: {
		flexDirection: 'column',
		flex: 2
	},
	roomNameContainer: {
		fontSize: 14,
		paddingTop: 10
	},
	roomTitle: {
		fontWeight: '600',
		fontSize: 14
	},
	roomName: {
		fontSize: 18,
		fontWeight: 'bold'
	},
	roomDescription: {
		fontSize: 14,
		color: '#ccc',
		paddingTop: 10
	},
	roomTitleRow: {
		flexDirection: 'row',
		alignItems: 'center'
	},
	status: {
		borderWidth: 4,
		bottom: -4,
		right: -4
	},
	itemLabel: {
		fontWeight: '600',
		marginBottom: 10
	},
	itemContent__empty: {
		fontStyle: 'italic'
	},
	rolesContainer: {
		flexDirection: 'row',
		flexWrap: 'wrap'
	},
	roleBadge: {
		padding: 8,
		backgroundColor: '#ddd',
		borderRadius: 2,
		marginRight: 5,
		marginBottom: 5
	},
	titleContainer: {
		flex: 1,
		flexDirection: 'row',
		alignItems: 'center'
	},
	groupMemberContainer: {
		width: '100%',
		paddingTop: 2,
		paddingLeft: 30,
		paddingVertical: 2
	},
	title: {
		...sharedStyles.textSemibold,
		color: '#0C0D0F',
		fontSize: 18,
		paddingLeft: 15,
		flex: 1
	},
	sectionSeparatorBorder: {
		marginTop: 10,
		borderColor: '#EBEDF1',
		borderTopWidth: 1
	},
	nameLabel: {
		fontWeight: '600',
		marginTop: 10,
		marginBottom: 10,
		paddingLeft: 10
	},
	footer: {
		position: 'absolute',
		right: 20,
		left: 20,
		bottom: 0,
		height: 100
	},
	ownerLabel: {
		...sharedStyles.textSemibold,
		color: '#ccc',
		fontSize: 18,
		position: 'absolute',
		right: 10
	}
});
