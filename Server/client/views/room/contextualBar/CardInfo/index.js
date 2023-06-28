import React from 'react';
import { Box, Margins } from '@rocket.chat/fuselage';
import {css} from "@rocket.chat/css-in-js";

import { useTranslation } from '../../../../contexts/TranslationContext';
import VerticalBar from '../../../../components/VerticalBar';
import { useTimeAgo } from '../../../../hooks/useTimeAgo';
import CardAvatar from '../../../../components/avatar/CardAvatar';

const Label = (props) => <Box fontScale='p2' color='default' {...props} />;
const wordBreak = css`
	word-break: break-word;
`;

const Info = ({ className, ...props }) =>
	<Box
		className={[className, wordBreak]}
		flexShrink={0}
		mbe='x4'
		is='span'
		fontScale='p1'
		color='hint'
		withTruncatedText
		{...props}
	/>;
const Avatar = ({ id, title, ...props }) => <CardAvatar title={title} id={id} {...props}/>;

export const CardInfo = React.memo(function CardInfo({
	id,
	name,
	username,
	cId,
	comment,
	createdAt,
	emails,
	isSecret,
	data,
	...props
}) {
	const t = useTranslation();

	const timeAgo = useTimeAgo();

	return <VerticalBar.ScrollableContent p='x24' {...props}>

		<Box alignSelf='center' display='flex' flexDirection='column'>
			<Avatar size={'x200'} id={id} title={username} type='ca' etag={data?.avatarETag}/>
			<Label>{username}</Label>
		</Box>

		<Box alignSelf='center' display='flex' flexDirection='column'>
			<Avatar size={'x200'} id={id} title={name} type='ci' etag={data?.avatarETag}/>
			<Label>{name}</Label>
		</Box>

		<Margins block='x4'>
			<Label>{t('Username')}</Label>
			<Info>{username}</Info>

			<Label>{t('Name')}</Label>
			<Info>{name}</Info>

			<Label>{t('Card_ID')}</Label>
			<Info>{cId}</Info>

			<Label>{t('Comment')}</Label>
			<Info>{comment}</Info>

			{emails && <><Label>{t('Email')}</Label>
			<Info>{emails[0].address}</Info></>}

			<Label>{t('Is_Secret')}</Label>
			<Info>{(data?.isSecret)?t('Yes'):t('No')}</Info>

			<Label>{t('Created_at')}</Label>
			<Info>{timeAgo(createdAt)}</Info>

		</Margins>

	</VerticalBar.ScrollableContent>;
});

CardInfo.Avatar = Avatar;
CardInfo.Label = Label;
CardInfo.Info = Info;

