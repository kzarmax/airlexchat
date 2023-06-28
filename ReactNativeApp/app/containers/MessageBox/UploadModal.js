import React, { Component } from 'react';
import {
	View, Text, StyleSheet, Image, ScrollView, TouchableHighlight
} from 'react-native';
import PropTypes from 'prop-types';
import Modal from 'react-native-modal';
import equal from 'deep-equal';

import TextInput from '../TextInput';
import Button from '../Button';
import I18n from '../../i18n';
import sharedStyles from '../../views/Styles';
import { isIOS } from '../../utils/deviceInfo';
import {
	COLOR_PRIMARY, COLOR_BACKGROUND_CONTAINER, COLOR_WHITE, COLOR_DANGER, themes
} from '../../constants/colors';
import { CustomIcon } from '../../lib/Icons';
import { canUploadFile } from '../../utils/media';
import { withTheme } from "../../theme";
import FastImage from "@rocket.chat/react-native-fast-image";
import {formatAttachmentUrl} from "../../lib/utils";
import {withDimensions} from "../../dimensions";

const cancelButtonColor = COLOR_BACKGROUND_CONTAINER;

const styles = StyleSheet.create({
	modal: {
		alignItems: 'center'
	},
	titleContainer: {
		flexDirection: 'row',
		padding: 16
	},
	title: {
		fontSize: 20,
		...sharedStyles.textBold
	},
	container: {
		height: 400,
		flexDirection: 'column',
		borderRadius: 12,
		padding: 16
	},
	scrollView: {
		flex: 1,
		marginTop: 4
	},
	image: {
		height: 180,
		width: '100%',
		marginBottom: 8,
	},
	bigPreview: {
		height: 250
	},
	buttonContainer: {
		flexDirection: 'row',
		justifyContent: 'space-between'
	},
	button: {
		marginBottom: 0
	},
	androidButton: {
		borderRadius: 10,
		justifyContent: 'center',
		height: 48,
		width: 120,
		shadowColor: '#000',
		shadowRadius: 2,
		shadowOpacity: 0.4,
		shadowOffset: {
			width: 0,
			height: 2
		},
		elevation: 8
	},
	androidButtonText: {
		fontSize: 18,
		textAlign: 'center'
	},
	fileIcon: {
		color: COLOR_PRIMARY,
		margin: 20,
		flex: 1,
		textAlign: 'center'
	},
	errorIcon: {
		color: COLOR_DANGER
	},
	fileMime: {
		...sharedStyles.textBold,
		textAlign: 'center',
		fontSize: 20,
		marginBottom: 20
	},
	errorContainer: {
		margin: 20,
		flex: 1,
		textAlign: 'center',
		justifyContent: 'center',
		alignItems: 'center'
	},
	video: {
		flex: 1,
		borderRadius: 4,
		height: 150,
		width: '100%',
		backgroundColor: '#1f2329',
		marginBottom: 6,
		alignItems: 'center',
		justifyContent: 'center'
	},
	inputDescription: {
		paddingTop: 8
	},
	playIcon:{
		flex:1,
		alignItems:'center',
		justifyContent: 'center',
		width:'100%',
		height: '100%'
	}
});

class UploadModal extends Component {
	static propTypes = {
		isVisible: PropTypes.bool,
		file: PropTypes.oneOfType([PropTypes.array, PropTypes.object]),
		rid: PropTypes.string,
		cardId: PropTypes.string,
		baseUrl: PropTypes.string,
		user: PropTypes.object,
		isArray: PropTypes.bool,
		close: PropTypes.func,
		submit: PropTypes.func,
		width: PropTypes.number,
		FileUpload_MediaTypeWhiteList: PropTypes.string,
		FileUpload_MaxFileSize: PropTypes.number,
		isFetching: PropTypes.bool,
		theme: PropTypes.string,
	}

	state = {
		description: '',
		file: {}
	};

	static getDerivedStateFromProps(props, state) {
		if (!equal(props.file, state.file) && props.file && props.file.path) {
			return {
				file: props.file,
				description: ''
			};
		}
		return null;
	}

	shouldComponentUpdate(nextProps, nextState) {
		const { description, file } = this.state;
		const {
			width, isVisible, isFetching, isArray, theme
		} = this.props;

		if (!equal(nextState.file, file)) {
			return true;
		}
		if (nextState.description !== description) {
			return true;
		}
		if (nextProps.theme !== theme) {
			return true;
		}
		if (nextProps.isFetching !== isFetching) {
			return true;
		}
		if (nextProps.width !== width) {
			return true;
		}
		if (nextProps.isVisible !== isVisible) {
			return true;
		}
		return !equal(nextProps.isArray, isArray);
	}

	submit = () => {
		const { file, submit, isArray } = this.props;
		const { description } = this.state;
		submit({ file, description, isArray });
		this.setState({ file: {}, description: '' });
	}

	renderError = (file) => {
		const { FileUpload_MaxFileSize, close, theme } = this.props;
		const { width } = this.props;
		const errorMessage = (FileUpload_MaxFileSize > -1 && file.size > FileUpload_MaxFileSize)
			? 'error-file-too-large'
			: 'error-invalid-file-type';
		return (
			<View style={[styles.container, { width: width - 32 }]}>
				<View style={styles.titleContainer}>
					<Text style={styles.title}>{I18n.t(errorMessage)}</Text>
				</View>
				<View style={styles.errorContainer}>
					<CustomIcon name='close' size={120} style={styles.errorIcon} />
				</View>
				<Text style={styles.fileMime}>{ file.mime }</Text>
				<View style={styles.buttonContainer}>
					{
						(isIOS)
							? (
								<Button
									title={I18n.t('Cancel')}
									type='secondary'
									backgroundColor={cancelButtonColor}
									style={styles.button}
									onPress={close}
									theme={theme}
								/>
							)
							: (
								<TouchableHighlight
									onPress={close}
									style={[styles.androidButton, { backgroundColor: cancelButtonColor }]}
									underlayColor={cancelButtonColor}
									activeOpacity={0.5}
								>
									<Text style={[styles.androidButtonText, { ...sharedStyles.textBold, color: COLOR_PRIMARY }]}>{I18n.t('Cancel')}</Text>
								</TouchableHighlight>
							)
					}
				</View>
			</View>
		);
	}

	renderButtons = () => {
		const { close, isFetching, theme } = this.props;
		if (isIOS) {
			return (
				<View style={styles.buttonContainer}>
					<Button
						title={I18n.t('Cancel')}
						type='secondary'
						size='V'
						style={styles.button}
						onPress={close}
						isFetching={isFetching}
						disabled={isFetching}
						textColor={COLOR_PRIMARY}
						theme={theme}
					/>
					<Button
						title={I18n.t('Send')}
						type='primary'
						size='V'
						style={styles.button}
						onPress={this.submit}
						isFetching={isFetching}
						disabled={isFetching}
						textColor={COLOR_WHITE}
						theme={theme}
					/>
				</View>
			);
		}
		// FIXME: RNGH don't work well on Android modals: https://github.com/kmagiera/react-native-gesture-handler/issues/139
		return (
			<View style={styles.buttonContainer}>
				<TouchableHighlight
					onPress={close}
					style={[styles.androidButton, { backgroundColor: cancelButtonColor }]}
					underlayColor={cancelButtonColor}
					activeOpacity={0.5}
				>
					<Text style={[styles.androidButtonText, { ...sharedStyles.textBold, color: COLOR_PRIMARY }]}>{I18n.t('Cancel')}</Text>
				</TouchableHighlight>
				<TouchableHighlight
					onPress={isFetching?() => {}:this.submit}
					style={[styles.androidButton, { backgroundColor: COLOR_PRIMARY }]}
					underlayColor={COLOR_PRIMARY}
					activeOpacity={0.5}
				>
					<Text style={[styles.androidButtonText, { ...sharedStyles.textMedium, color: COLOR_WHITE }]}>{I18n.t('Send')}</Text>
				</TouchableHighlight>
			</View>
		);
	}

	renderItemPreview(file) {
		const { rid, cardId, user, baseUrl, theme } = this.props;

		if(!file){
			return null;
		}

		if (file.mime && file.mime.match(/image/)) {
			return (<Image source={{ isStatic: true, uri: file.path }} style={styles.image} resizeMode={FastImage.resizeMode.contain}/>);
		}
		if (file.mime && file.mime.match(/video/)) {
			const { thumbnail } = file;
			if(thumbnail){
				let image_uri = formatAttachmentUrl(thumbnail, user.id, user.token, baseUrl, rid, cardId)
				return (
					<View style={{ alignItems: 'center', justifyContent: 'center', width: '100%'}}>
						<Image
							key={encodeURI(thumbnail)}
							source={{ uri: encodeURI(image_uri) }}
							style={styles.image}
							resizeMode={FastImage.resizeMode.contain}
						/>
						<View style={[styles.playIcon, { position: 'absolute' }]}>
							<CustomIcon
								name='play'
								size={54}
								color={themes[theme].buttonText}
							/>
						</View>
					</View>
				);
			} else {
				return (
					<View style={styles.video}>
						<CustomIcon name='play' size={72} color={COLOR_WHITE} />
					</View>
				);
			}
		}
		return (
			<>
				<CustomIcon name='attach' size={72} style={styles.fileIcon} />
				<Text style={{ color: themes[theme].bodyText }}>{ file.filename }</Text>
			</>
		);
	}

	renderPreview() {
		const { file, isArray } = this.props;

		if(isArray){
			let items = [];
			file.forEach(item => {
				items.push(this.renderItemPreview(item));
			});
			return items;
		} else {
			return this.renderItemPreview(file);
		}
	}

	render() {
		const {
			width, isVisible, close, file, FileUpload_MediaTypeWhiteList, FileUpload_MaxFileSize, isArray, theme
		} = this.props;
		const { description } = this.state;
		let files = file;
		if(!isArray){
			files = [files];
		}
		let showError = false;
		let errorFile = null;
		files.forEach((item) => {
			if(!canUploadFile(item, FileUpload_MediaTypeWhiteList, FileUpload_MaxFileSize)){
				showError = true;
				errorFile = item;
			}
		});
		return (
			<Modal
				isVisible={isVisible}
				style={styles.modal}
				animationIn='fadeIn'
				animationOut='fadeOut'
				useNativeDriver
				hideModalContentWhileAnimating
				avoidKeyboard
			>
				{(showError) ? this.renderError(errorFile)
					: (
						<View style={{ ...styles.container, width: width - 32, backgroundColor: themes[theme].modalBackground }}>
							<View style={styles.titleContainer}>
								<Text style={{ ...styles.title, color: themes[theme].titleText }}>{I18n.t('Upload_file_question_mark')}</Text>
							</View>

							<ScrollView style={styles.scrollView} contentContainerStyle={{ alignItems: 'center', justifyContent: 'center' }}>
								{this.renderPreview()}
							</ScrollView>
							<TextInput
								containerStyle={styles.inputDescription}
								placeholder={I18n.t('File_description')}
								value={description}
								onChangeText={value => this.setState({ description: value })}
								theme={theme}
							/>
							{this.renderButtons()}
						</View>
					)}
			</Modal>
		);
	}
}

export default withDimensions(withTheme(UploadModal));
