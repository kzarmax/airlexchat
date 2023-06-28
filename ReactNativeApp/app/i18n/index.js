import i18n from 'i18n-js';
import { I18nManager } from 'react-native';

export * from './isRTL';

export const LANGUAGES = [
	{
		label: '日本語',
		value: 'ja',
		file: require('./locales/ja').default
	},
	{
		label: 'English',
		value: 'en',
		file: require('./locales/en').default
	}
];

const translations = LANGUAGES.reduce((ret, item) => {
	ret[item.value] = item.file;
	return ret;
}, {});

i18n.translations = translations;
i18n.fallbacks = true;

const defaultLanguage = { languageTag: 'ja', isRTL: false };
const { languageTag, isRTL } = defaultLanguage;

I18nManager.forceRTL(isRTL);
I18nManager.swapLeftAndRightInRTL(isRTL);
i18n.locale = languageTag;
i18n.isRTL = I18nManager.isRTL;

export default i18n;
