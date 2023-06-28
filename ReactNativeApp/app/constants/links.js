import { getBundleId, isIOS } from '../utils/deviceInfo';

const APP_STORE_ID = '1466592518';

export const PLAY_MARKET_LINK = `https://play.google.com/store/apps/details?id=${ getBundleId }`;
export const FDROID_MARKET_LINK = 'https://f-droid.org/en/packages/chat.airlex.android';
export const APP_STORE_LINK = `https://itunes.apple.com/app/id${ APP_STORE_ID }`;
export const LICENSE_LINK = 'https://bitbucket.org/kenji_s/airlex.chat.app/src/master/ReactNativeApp/LICENSE';
export const STORE_REVIEW_LINK = isIOS ? `itms-apps://itunes.apple.com/app/id${ APP_STORE_ID }?action=write-review` : `market://details?id=${ getBundleId }`;
export const CONTACT_US_LINK = 'https://airlex.co.jp/customer/';
export const FAQ_LINK = 'https://airlex.co.jp/faq/';
export const TERMS_OF_SERVICE_LINK = 'https://airlex.co.jp/privacy-statement/';