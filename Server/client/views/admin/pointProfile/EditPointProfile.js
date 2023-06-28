import React, { useCallback, useState, useMemo, useEffect } from 'react';
import { Box, Button, ButtonGroup, TextInput, Field, Icon, Skeleton, Throbber, InputBox, Modal } from '@rocket.chat/fuselage';

import { useTranslation } from '../../../contexts/TranslationContext';
import { useEndpointData } from '../../../hooks/useEndpointData';
import { useEndpointUpload } from '../../../hooks/useEndpointUpload';
import { useEndpointAction } from '../../../hooks/useEndpointAction';
import {AsyncStatePhase} from "../../../hooks/useAsyncState";
import VerticalBar from '../../../components/VerticalBar';

const DeleteWarningModal = ({ onDelete, onCancel, ...props }) => {
	const t = useTranslation();
	return <Modal {...props}>
		<Modal.Header>
			<Icon color='danger' name='modal-warning' size={20}/>
			<Modal.Title>{t('Are_you_sure')}</Modal.Title>
			<Modal.Close onClick={onCancel}/>
		</Modal.Header>
		<Modal.Content fontScale='p1'>
			{t('Point_Profile_Delete_Warning')}
		</Modal.Content>
		<Modal.Footer>
			<ButtonGroup align='end'>
				<Button ghost onClick={onCancel}>{t('Cancel')}</Button>
				<Button primary danger onClick={onDelete}>{t('Delete')}</Button>
			</ButtonGroup>
		</Modal.Footer>
	</Modal>;
};

const SuccessModal = ({ onClose, ...props }) => {
	const t = useTranslation();
	return <Modal {...props}>
		<Modal.Header>
			<Icon color='success' name='checkmark-circled' size={20}/>
			<Modal.Title>{t('Deleted')}</Modal.Title>
			<Modal.Close onClick={onClose}/>
		</Modal.Header>
		<Modal.Content fontScale='p1'>
			{t('Point_Profile_Has_Been_Deleted')}
		</Modal.Content>
		<Modal.Footer>
			<ButtonGroup align='end'>
				<Button primary onClick={onClose}>{t('Ok')}</Button>
			</ButtonGroup>
		</Modal.Footer>
	</Modal>;
};

export function EditPointProfileWithData({ _id, onChange, ...props }) {
	const t = useTranslation();
	const query = useMemo(() => ({
		query: JSON.stringify({ _id }),
	// TODO: remove cache. Is necessary for data invalidation
	}), [_id]);

	const { value: data = { profiles: {} }, phase: state, error, reload } = useEndpointData('point-profile.list', query);

	if (state === AsyncStatePhase.LOADING) {
		return <Box pb='x20'>
			<Skeleton mbs='x8'/>
			<InputBox.Skeleton w='full'/>
			<Skeleton mbs='x8'/>
			<InputBox.Skeleton w='full'/>
			<ButtonGroup stretch w='full' mbs='x8'>
				<Button disabled><Throbber inheritColor/></Button>
				<Button primary disabled><Throbber inheritColor/></Button>
			</ButtonGroup>
			<ButtonGroup stretch w='full' mbs='x8'>
				<Button primary danger disabled><Throbber inheritColor/></Button>
			</ButtonGroup>
		</Box>;
	}

	if (error || !data || !data.profiles || data.profiles.update.length < 1) {
		return <Box fontScale='h1' pb='x20'>{t('Custom_User_Status_Error_Invalid_User_Status')}</Box>;
	}

	return <EditPointProfile data={data.profiles.update[0]} onChange={onChange} {...props}/>;
}

export function EditPointProfile({ close, onChange, data, ...props }) {
	const t = useTranslation();

	const { _id, points: previousPoints, price: previousPrice } = data || {};
	const previousPointProfile = data || {};

	const [points, setPoints] = useState(previousPoints);
	const [price, setPrice] = useState(previousPrice);

	const [modal, setModal] = useState();

	useEffect(() => {
		setPoints(previousPoints || 0);
		setPrice((previousPrice) || 0);

	}, [previousPoints, previousPrice, previousPointProfile, _id]);

	const hasUnsavedChanges = useMemo(() => previousPoints !== points || price !== previousPrice, [previousPoints, points, price, previousPrice]);

	const saveAction = useEndpointUpload('point-profile.update', {}, t('Point_Profile_Updated_Successfully'));

	const handleSave = useCallback(async () => {
		const formData = new FormData();
		formData.append('_id', _id);
		formData.append('points', points);
		formData.append('price', price);
		const result = await saveAction(formData);
		if (result.success) {
			onChange();
		}
	}, [_id, points, price, saveAction, onChange]);

	const deleteAction = useEndpointAction('POST', 'point-profile.delete', useMemo(() => ({ pointProfileId: _id }), [_id]));

	const onDeleteConfirm = useCallback(async () => {
		const result = await deleteAction();
		if (result.success) {
			setModal(() => <SuccessModal onClose={() => { setModal(undefined); close(); onChange(); }}/>);
		}
	}, [close, deleteAction, onChange]);

	const openConfirmDelete = useCallback(() => setModal(() => <DeleteWarningModal onDelete={onDeleteConfirm} onCancel={() => setModal(undefined)}/>), [onDeleteConfirm, setModal]);

	return <>
		<VerticalBar.ScrollableContent {...props}>
			<Field>
				<Field.Label>{t('Points')}</Field.Label>
				<Field.Row>
					<TextInput value={points} onChange={(e) => setPoints(e.currentTarget.value)} placeholder={t('points')} />
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
						<Button primary onClick={handleSave} disabled={!hasUnsavedChanges}>{t('Save')}</Button>
					</ButtonGroup>
				</Field.Row>
			</Field>
			<Field>
				<Field.Row>
					<ButtonGroup stretch w='full'>
						<Button primary danger onClick={openConfirmDelete}><Icon name='trash' mie='x4'/>{t('Delete')}</Button>
					</ButtonGroup>
				</Field.Row>
			</Field>
		</VerticalBar.ScrollableContent>
		{ modal }
	</>;
}
