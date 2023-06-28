
import React, { useMemo } from 'react';
import { Box } from '@rocket.chat/fuselage';

import { CardInfo } from '../../room/contextualBar/CardInfo';
import { useTranslation } from '../../../contexts/TranslationContext';
import { FormSkeleton } from '../../../components/Skeleton';
import { useEndpointData } from '../../../hooks/useEndpointData';
import { AsyncStatePhase } from '../../../hooks/useAsyncState';

export function CardInfoWithData({ id, ...props }) {
	const t = useTranslation();

	const { value: data, phase: state, error, reload } = useEndpointData('cards.info', useMemo(() => ({ ...id && { cardId: id }}), [id]));

	const card = useMemo(() => {
		const { card } = data || { card: {} };
		const {
			_id,
			name,
			username,
			cId,
			comment,
			createdAt,
			isSecret,
			user
		} = card;
		return {
			id: _id,
			name,
			username,
			cId,
			comment,
			createdAt,
			isSecret,
			emails: user?.emails
		};
	}, [data]);

	if (state === AsyncStatePhase.LOADING) {
		return <FormSkeleton/>;
	}

	if (error) {
		return <Box mbs='x16'>{t('Card_not_found')}</Box>;
	}

	return <CardInfo
		{...card}
		data={data.card}
		{...props}
	/>;
}
