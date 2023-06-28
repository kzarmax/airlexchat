import React, { useCallback, useState } from 'react';
import { Button, ButtonGroup, TextInput, Field, Icon } from '@rocket.chat/fuselage';

import { useTranslation } from '../../../contexts/TranslationContext';
import { useEndpointUpload } from '../../../hooks/useEndpointUpload';
import VerticalBar from '../../../components/VerticalBar';

export function AddPointProfile({ close, onChange, ...props }) {
	const t = useTranslation();

	const [points, setPoints] = useState(0);
	const [price, setPrice] = useState(0);

	const saveAction = useEndpointUpload('point-profile.create', {}, t('Point_Profile_Added_Successfully'));

	const handleSave = useCallback(async () => {
		const formData = new FormData();
		formData.append('points', points);
		formData.append('price', price);
		const result = await saveAction(formData);

		if (result.success) {
			onChange();
			close();
		}
	}, [points, price, saveAction, onChange, close]);


	return <VerticalBar.ScrollableContent {...props}>
		<Field>
			<Field.Label>{t('Points')}</Field.Label>
			<Field.Row>
				<TextInput value={points} onChange={(e) => setPoints(e.currentTarget.value)} placeholder={t('Points')} />
			</Field.Row>
		</Field>
		<Field>
			<Field.Label>{t('Price')}</Field.Label>
			<Field.Row>
				<TextInput value={price} onChange={(e) => setPrice(e.currentTarget.value)} placeholder={t('Price')} />
			</Field.Row>
		</Field>
		<Field>
			<Field.Row>
				<ButtonGroup stretch w='full'>
					<Button onClick={close}>{t('Cancel')}</Button>
					<Button primary onClick={handleSave}>{t('Save')}</Button>
				</ButtonGroup>
			</Field.Row>
		</Field>
		<Field>
			<Field.Row>
				<ButtonGroup stretch w='full'>
					<Button primary danger><Icon name='trash' mie='x4'/>{t('Delete')}</Button>
				</ButtonGroup>
			</Field.Row>
		</Field>
	</VerticalBar.ScrollableContent>;
}
