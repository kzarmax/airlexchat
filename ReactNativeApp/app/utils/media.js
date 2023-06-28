import moment from 'moment';
import { RNFFmpeg, RNFFmpegConfig } from 'react-native-ffmpeg';

import * as VideoThumbnails from 'expo-video-thumbnails';
import log, { LOG_L_LOW, LOG_L_MIDDLE } from './log';
import RocketChat from "../lib/rocketchat";
import {isAndroid, isIOS} from "./deviceInfo";


export const SUPPORTED_TYPES = ['video/quicktime', 'video/mp4', ...(isIOS ? [] : ['video/3gp', 'video/mkv'])];
export const isTypeSupported = type => SUPPORTED_TYPES.indexOf(type) !== -1;

export const canUploadFile = (file, allowList, maxFileSize) => {
	if (!(file && file.path)) {
		return { success: true };
	}
	if (maxFileSize > -1 && file.size > maxFileSize) {
		return { success: false, error: 'error-file-too-large' };
	}
	// if white list is empty, all media types are enabled
	if (!allowList || allowList === '*') {
		return { success: true };
	}
	const allowedMime = allowList.split(',');
	if (allowedMime.includes(file.mime)) {
		return { success: true };
	}
	const wildCardGlob = '/*';
	const wildCards = allowedMime.filter(item => item.indexOf(wildCardGlob) > 0);
	if (file.mime && wildCards.includes(file.mime.replace(/(\/.*)$/, wildCardGlob))) {
		return { success: true };
	}
	return { success: false, error: 'error-invalid-file-type' };
};


export async function compressVideo(file){
	let compressVideo = file;

	if (file && file.path && /video/.test(file.mime)) {
		let filename = 'video-' + moment().format('YYYMMDDHISS');

		let tArray = file.path.replace('file://', '')
			.split('/');
		tArray.pop();
		tArray.push(filename + '.mp4');
		const outputFilePath = tArray.join('/');
		const command = '-i ' + file.path + ' -b:v 16M ' + outputFilePath;

		await RNFFmpeg.execute(command);
		const statisticsData = await RNFFmpegConfig.getLastReceivedStatistics();
		LOG_L_LOW('Statistics; frame: ' + statisticsData.videoFrameNumber.toFixed(1) + ', fps: ' + statisticsData.videoFps.toFixed(1) + ', quality: ' + statisticsData.videoQuality.toFixed(1) +
			', size: ' + statisticsData.size + ', time: ' + statisticsData.time);

		// Error size == 0 -> Compressing Failed
		if(statisticsData.size){
			compressVideo = {
				name: filename,
				description: file.description,
				width: file.width,
				height: file.height,
				path: 'file://' + outputFilePath,
				size: statisticsData.size,
				mime: file.mime,
				modificationDate: file.modificationDate
			};
		}
	}
	return compressVideo;
}


export async function compressAudio(file){
	let compressAudio = file;

	if (file && file.path && /audio/.test(file.mime)) {
		let filename = 'audio-' + moment().format('YYYMMDDHISS') + '.wav';

		let tArray = file.path.replace('file://', '')
			.split('/');
		tArray.pop();
		tArray.push(filename);
		const outputFilePath = tArray.join('/');
		const command = '-i ' + file.path + ' ' + outputFilePath;
		await RNFFmpeg.execute(command);
		const statisticsData = await RNFFmpegConfig.getLastReceivedStatistics();
		LOG_L_MIDDLE('Statistics; frame: ' + statisticsData.videoFrameNumber.toFixed(1) + ', fps: ' + statisticsData.videoFps.toFixed(1) + ', quality: ' + statisticsData.videoQuality.toFixed(1) +
			', size: ' + statisticsData.size + ', time: ' + statisticsData.time);

		// Error size == 0 -> Compressing Failed
		if(statisticsData.size){
			compressAudio = {
				name: filename,
				description: file.description,
				width: file.width,
				height: file.height,
				path:  'file://' + outputFilePath,
				size:  statisticsData.size,
				type: 'audio/wav',
				modificationDate: file.modificationDate
			};
		}
	}
	return compressAudio;
}

export async function compressMedia(file, rid, server, user, cardId){

	if (file && file.path) {
		if (/video/.test(file.mime)) {
			let compressed_file = file;
			// Video Compression In Android
			if(isAndroid){
				compressed_file = await compressVideo(file);
			}

			try{
				const thumbnail = await VideoThumbnails.getThumbnailAsync(compressed_file.path, { time: 100 });
				const response = await RocketChat.uploadFile(rid, cardId, thumbnail, server, user);
				if (response.success && response.id) {
					compressed_file = {
						...compressed_file,
						thumbnail: response.url
					};
				}
			} catch (err){
				log(err, 'Create Video Thumbnail Error:')
			}

			return compressed_file;
		} else if(/audio/.test(file.mime)) {
			return await compressAudio(file);
		}
	}

	return file;
}

export function getThumbnailDescription(description){
	if(description){
		try{
			const json_description = JSON.parse(description);
			return {thumbnail: json_description.thumbnail, file_description: json_description.description};
		} catch (e){
		}
	}
	return {thumbnail: false, file_description: description};
}