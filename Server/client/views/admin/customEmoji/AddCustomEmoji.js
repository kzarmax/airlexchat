import React, { useCallback, useState, useMemo } from 'react';
import { Box, Button, Select, ButtonGroup, Margins, TextInput, Field, Icon } from '@rocket.chat/fuselage';

import { useTranslation } from '../../../contexts/TranslationContext';
import { useFileInput } from '../../../hooks/useFileInput';
import { useEndpointUpload } from '../../../hooks/useEndpointUpload';
import VerticalBar from '../../../components/VerticalBar';

function AddCustomEmoji({ close, categories, onChange, ...props }) {
	const t = useTranslation();

	const [name, setName] = useState('');
	const [aliases, setAliases] = useState('');
	const [emojiFile, setEmojiFile] = useState();
	const [newEmojiPreview, setNewEmojiPreview] = useState('');
	const [parent, setParent] = useState('0');
	const [points, setPoints] = useState(0);

	const setEmojiPreview = useCallback(async (file) => {
		setEmojiFile(file);
		setNewEmojiPreview(URL.createObjectURL(file));
	}, [setEmojiFile]);

	const saveAction = useEndpointUpload('emoji-custom.create', {}, t('Custom_Emoji_Added_Successfully'));

	const handleSave = useCallback(async () => {
		const formData = new FormData();
		formData.append('emoji', emojiFile);
		formData.append('name', name);
		formData.append('aliases', aliases);
		formData.append('parent', parent);
		formData.append('points', parent === '0' ? points : 0);
		const result = await saveAction(formData);

		if (result.success) {
			onChange();
			close();
		}
	}, [emojiFile, name, aliases, parent, points, saveAction, onChange, close]);

	const [clickUpload] = useFileInput(setEmojiPreview, 'emoji');

	const availableCategories = useMemo(() => {
		let categoryOptions = [];
		categoryOptions.push(['0', 'ルート']);
		categories.forEach(category => {
			categoryOptions.push([ category._id, category.name]);
		});
		return categoryOptions;
	}, [categories]);

	return <VerticalBar.ScrollableContent {...props}>
		<Field>
			<Field.Label>{t('Name')}</Field.Label>
			<Field.Row>
				<TextInput value={name} onChange={(e) => setName(e.currentTarget.value)} placeholder={t('Name')} />
			</Field.Row>
		</Field>
		<Field>
			<Field.Label>{t('Aliases')}</Field.Label>
			<Field.Row>
				<TextInput value={aliases} onChange={(e) => setAliases(e.currentTarget.value)} placeholder={t('Aliases')} />
			</Field.Row>
		</Field>
		<Field>
			<Field.Label alignSelf='stretch' display='flex' justifyContent='space-between' alignItems='center'>
				{t('Custom_Emoji')}
				<Button square onClick={clickUpload}><Icon name='upload' size='x20'/></Button>
			</Field.Label>
			{ newEmojiPreview && <Box display='flex' flexDirection='row' mi='neg-x4' justifyContent='center'>
				<Margins inline='x4'>
					<Box is='img' style={{ objectFit: 'contain' }} w='x120' h='x120' src={newEmojiPreview}/>
				</Margins>
			</Box> }
		</Field>
		<Field>
			<Field.Label>{t('Category')}</Field.Label>
			<Field.Row>
				<Select options={availableCategories} value={parent} onChange={(parent) => setParent(parent)} placeholder={t('Select_Category')} flexShrink={1}/>
			</Field.Row>
		</Field>
		{ parent !== '0' ? null :
			<Field>
				<Field.Label>{t('Points')}</Field.Label>
				<Field.Row>
					<TextInput value={points} onChange={(e) => setPoints(e.currentTarget.value ? parseInt(e.currentTarget.value) : 0)} placeholder={t('Points')} />
				</Field.Row>
			</Field>
		}
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

export default AddCustomEmoji;
