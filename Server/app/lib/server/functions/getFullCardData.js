import { Cards, CardProfiles } from '../../../models';
import { hasPermission } from '../../../authorization';

const defaultFields = {
	cId: 1,
	userId: 1,
	name: 1,
	username: 1,
	active: 1,
	comment: 1,
	blocks: 1,
	isSecret:1,
	back_color:1,
	text_color:1,
};

const fullFields = {
	createdAt: 1,
	scene: 1,
	secret: 1,
	order: 1
};

export const getFullCardData = function({ userId, cardId, limit: l }) {
	const userToRetrieveFullCardData = Cards.findOneById(cardId);
	const isMyOwnCard = userToRetrieveFullCardData && userToRetrieveFullCardData.userId === userId;
	const viewFullOtherUserInfo = hasPermission(userId, 'view-full-other-user-info');
	const limit = !viewFullOtherUserInfo ? 1 : l;

	if (!cardId && limit <= 1) {
		return undefined;
	}

	const fields = isMyOwnCard || viewFullOtherUserInfo ? { ...defaultFields, ...fullFields } : { ...defaultFields };

	const options = {
		fields,
		limit,
		sort: { username: 1 },
	};

	const card = Cards.findOneById(cardId, options);
	if (!card) {
		return null;
	}

	let profiles;
	if (isMyOwnCard || viewFullOtherUserInfo) {
		profiles = CardProfiles.findByCardId(cardId).fetch();
	} else {
		profiles = CardProfiles.findPublicItemByCardId(cardId).fetch();
	}

	card.profiles = profiles;

	return card;
};

export const getFullCardDataWithCId = function({ cId }) {
	const options = {
		defaultFields
	};
	const cardData = Cards.findOneByCId(cId, options);

	if (!cardData) {
		return undefined;
	}

	cardData.profiles = CardProfiles.findPublicItemByCardId(cardData._id).fetch();

	return cardData;
};
