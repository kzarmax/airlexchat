import { PointProfile, PointPurchaseHistory } from '../../../models/server/raw';

export async function findPoinProfile({ query = {}, pagination: { sort }}) {
	const options = {
		sort: sort || { points: -1 },
	};
	let pointProfiles = await PointProfile.find(query, options).toArray();
	let total = pointProfiles.length;

	return {
		pointProfiles,
		total
	};
}

export async function findPoinPurchaseHistory({ query = {},  pagination: { offset, count, sort }}) {
	const options = {
		sort: sort || { purchased_at: -1 },
		skip: offset,
		limit: count,
	};
	let pointPurchasedHistories = await PointPurchaseHistory.find(query, options).toArray();
	let total = pointPurchasedHistories.length;

	return {
		pointPurchasedHistories,
		historyTotal: total
	};
}

