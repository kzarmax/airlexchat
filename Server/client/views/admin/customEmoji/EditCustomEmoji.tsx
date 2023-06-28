import React, { useCallback, useState, useMemo, useEffect, FC, ChangeEvent } from 'react';
import { Box, Button, Select, ButtonGroup, Margins, TextInput, Field, Icon } from '@rocket.chat/fuselage';

import { useToastMessageDispatch } from '../../../contexts/ToastMessagesContext';
import { useTranslation } from '../../../contexts/TranslationContext';
import { useFileInput } from '../../../hooks/useFileInput';
import { useEndpointUpload } from '../../../hooks/useEndpointUpload';
import { useSetModal } from '../../../contexts/ModalContext';
import { useEndpointAction } from '../../../hooks/useEndpointAction';
import VerticalBar from '../../../components/VerticalBar';
import DeleteSuccessModal from '../../../components/DeleteSuccessModal';
import DeleteWarningModal from '../../../components/DeleteWarningModal';
import { EmojiDescriptor, EmojiParentDescriptor } from './types';
import { useAbsoluteUrl } from '../../../contexts/ServerContext';

type EditCustomEmojiProps = {
	close: () => void;
	onChange: () => void;
	data: EmojiDescriptor;
	categories: EmojiParentDescriptor[];
};

const EditCustomEmoji: FC<EditCustomEmojiProps> = ({ close, onChange, data, categories, ...props }) => {
	const t = useTranslation();
	const dispatchToastMessage = useToastMessageDispatch();
	const setModal = useSetModal();
	const absoluteUrl = useAbsoluteUrl();

	const { _id, name: previousName, parent: previousCategory, aliases: previousAliases, points: previousPoints } = data || {};

	const [name, setName] = useState(() => data?.name ?? '');
	const [aliases, setAliases] = useState(() => data?.aliases ?? '');
	const [emojiFile, setEmojiFile] = useState<Blob>();
	const [parent, setParent] = useState(data?.parent ?? '');
	const [points, setPoints] = useState(data?.points ?? 0);
	const newEmojiPreview = useMemo(() => {
		if (emojiFile) {
			return URL.createObjectURL(emojiFile);
		}

		if (data) {
			return absoluteUrl(`/emoji-custom/${ encodeURIComponent(data.name) }.${ data.extension }`);
		}

		return null;
	}, [absoluteUrl, data, emojiFile]);

	useEffect(() => {
		setName(previousName || '');
		setAliases(previousAliases || '');
		setParent(previousCategory || '0');
		setPoints(previousPoints || 0);
	}, [previousName, previousAliases, previousCategory, previousPoints, _id]);

	const hasUnsavedChanges = useMemo(() => previousName !== name || aliases !== previousAliases || previousCategory !== parent || previousPoints !== points || !!emojiFile, [previousName, name, aliases, previousAliases, parent, previousCategory, points, previousPoints, emojiFile]);

	const saveAction = useEndpointUpload('emoji-custom.update', {}, t('Custom_Emoji_Updated_Successfully'));

	const availableCategories = useMemo(() => {
		let categoryOptions = [];
		categoryOptions.push(['0', 'ルート']);
		categories.forEach(category => {
			categoryOptions.push([ category._id, category.name]);
		});
		return categoryOptions;
	}, [categories]);

	const handleSave = useCallback(async () => {
		if (!newEmojiPreview) {
			return;
		}

		const formData = new FormData();
		formData.append('emoji', emojiFile);
		formData.append('_id', _id);
		formData.append('name', name);
		formData.append('aliases', aliases);
		formData.append('parent', parent);
		formData.append('points', parent === '0' ? points : 0);
		const result = (await saveAction(formData)) as { success: boolean };
		if (result.success) {
			onChange();
		}
	}, [emojiFile, _id, name, aliases, parent, points, saveAction, onChange]);

	const deleteAction = useEndpointAction('POST', 'emoji-custom.delete', useMemo(() => ({ emojiId: _id }), [_id]));

	const handleDeleteButtonClick = useCallback(() => {
		const handleClose = (): void => {
			setModal(null);
			close();
			onChange();
		};

		const handleDelete = async (): Promise<void> => {
			try {
				await deleteAction();
				setModal(() => <DeleteSuccessModal
					children={t('Custom_Emoji_Has_Been_Deleted')}
					onClose={handleClose}
				/>);
			} catch (error) {
				dispatchToastMessage({ type: 'error', message: error });
				onChange();
			}
		};

		const handleCancel = (): void => {
			setModal(null);
		};

		setModal(() => <DeleteWarningModal
			children={t('Custom_Emoji_Delete_Warning')}
			onDelete={handleDelete}
			onCancel={handleCancel}
		/>);
	}, [close, deleteAction, dispatchToastMessage, onChange, setModal, t]);

	const handleAliasesChange = useCallback((e) => setAliases(e.currentTarget.value), [setAliases]);

	const [clickUpload] = useFileInput(setEmojiFile, 'emoji');

	return <VerticalBar.ScrollableContent {...(props as any)}>
		<Field>
			<Field.Label>{t('Name')}</Field.Label>
			<Field.Row>
				<TextInput value={name} onChange={(e: ChangeEvent<HTMLInputElement>): void => setName(e.currentTarget.value)} placeholder={t('Name')} />
			</Field.Row>
		</Field>
		<Field>
			<Field.Label>{t('Aliases')}</Field.Label>
			<Field.Row>
				<TextInput value={aliases} onChange={handleAliasesChange} placeholder={t('Aliases')} />
			</Field.Row>
		</Field>
		<Field>
			<Field.Label>{t('Category')}</Field.Label>
			<Field.Row>
				<Select options={availableCategories} value={parent} onChange={(parent) =>setParent(parent)} placeholder={t('Select_Category')} flexShrink={1}/>
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
			<Field.Label alignSelf='stretch' display='flex' justifyContent='space-between' alignItems='center'>
				{t('Custom_Emoji')}
				<Button square onClick={clickUpload}><Icon name='upload' size='x20'/></Button>
			</Field.Label>
			{newEmojiPreview && <Box display='flex' flexDirection='row' mbs='none' justifyContent='center'>
				<Margins inline='x4'>
					<Box is='img' style={{ objectFit: 'contain' }} w='x120' h='x120' src={newEmojiPreview}/>
				</Margins>
			</Box>}
		</Field>
		<Field>
			<Field.Row>
				<ButtonGroup stretch w='full'>
					<Button onClick={close}>{t('Cancel')}</Button>
					<Button primary onClick={handleSave} disabled={!hasUnsavedChanges}>{t('Save')}</Button>
				</ButtonGroup>
			</Field.Row>
		</Field>
		<Field>
			<Field.Row>
				<ButtonGroup stretch w='full'>
					<Button primary danger onClick={handleDeleteButtonClick}>
						<Icon name='trash' mie='x4'/>{t('Delete')}
					</Button>
				</ButtonGroup>
			</Field.Row>
		</Field>
	</VerticalBar.ScrollableContent>;
};

export default EditCustomEmoji;
