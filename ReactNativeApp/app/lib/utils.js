// import reduxStore from './createStore';

export const formatAttachmentUrl = (attachmentUrl, userId, token, server) => {
	// const { settings } = reduxStore.getState();
	// const use_amazon_s3 = settings.FileUpload_Storage_Type === 'AmazonS3';
	// const amazon_s3_cdn_url = settings.FileUpload_S3_CDN;

	// todo  The files saved in GridFS not working.
	// if(use_amazon_s3 && amazon_s3_cdn_url && amazon_s3_cdn_url !== ''){
	// 	const unique_id = settings.uniqueID;
	// 	const upload_id = /file-upload\/(.*?)\//g.exec(attachmentUrl);
	// 	return encodeURI(`${amazon_s3_cdn_url}/${unique_id}/uploads/${rid}/${cardId}/${upload_id[1]}`);
	// }

	if (attachmentUrl.startsWith('http')) {
		if (attachmentUrl.includes('rc_token')) {
			return encodeURI(attachmentUrl);
		}
		return encodeURI(`${ attachmentUrl }?rc_uid=${ userId }&rc_token=${ token }`);
	}
	return encodeURI(`${ server }${ attachmentUrl }?rc_uid=${ userId }&rc_token=${ token }`);
};

export const getUTCTimeStamp = () => {
	let now = new Date();
	return Math.floor(now.getTime() / 1000);
}