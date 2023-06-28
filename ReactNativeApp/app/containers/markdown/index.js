import React, { PureComponent } from 'react';
import { Text, Image } from 'react-native';
import { Parser, Node } from 'commonmark';
import Renderer from 'commonmark-react-renderer';
import PropTypes from 'prop-types';
import removeMarkdown from 'remove-markdown';

import shortnameToUnicode from '../../utils/shortnameToUnicode';
import I18n from '../../i18n';
import { themes } from '../../constants/colors';

import MarkdownLink from './Link';
import MarkdownList from './List';
import MarkdownListItem from './ListItem';
import MarkdownAtMention from './AtMention';
import MarkdownHashtag from './Hashtag';
import MarkdownBlockQuote from './BlockQuote';
import MarkdownEmoji from './Emoji';
import MarkdownTable from './Table';
import MarkdownTableRow from './TableRow';
import MarkdownTableCell from './TableCell';
import mergeTextNodes from './mergeTextNodes';

import styles from './styles';
import {filterRepliedMessage, isValidURL} from '../../utils/url';
import UserPreferences from "../../lib/userPreferences";
import RocketChat from "../../lib/rocketchat";
import { isIOS } from '../../utils/deviceInfo';

// Support <http://link|Text>
const formatText = text => text.replace(
	new RegExp('(?:<|<)((?:https|http):\\/\\/[^\\|]+)\\|(.+?)(?=>|>)(?:>|>)', 'gm'),
	(match, url, title) => `[${ title }](${ url })`
);

const emojiRanges = [
	'\u00a9|\u00ae|[\u2000-\u3300]|\ud83c[\ud000-\udfff]|\ud83d[\ud000-\udfff]|\ud83e[\ud000-\udfff]', // unicode emoji from https://www.regextester.com/106421
	':.{1,40}:', // custom emoji
	' |\n' // allow spaces and line breaks
].join('|');

const removeSpaces = str => str && str.replace(/\s/g, '');

const removeAllEmoji = str => str.replace(new RegExp(emojiRanges, 'g'), '');

const isOnlyEmoji = (str) => {
	str = removeSpaces(str);
	return !removeAllEmoji(str).length;
};

const removeOneEmoji = str => str.replace(new RegExp(emojiRanges), '');

const emojiCount = (str) => {
	str = removeSpaces(str);
	let oldLength = 0;
	let counter = 0;

	while (oldLength !== str.length) {
		oldLength = str.length;
		str = removeOneEmoji(str);
		if (oldLength !== str.length) {
			counter += 1;
		}
	}

	return counter;
};

const parser = new Parser();

class Markdown extends PureComponent {
	static propTypes = {
		msg: PropTypes.string,
		getCustomEmoji: PropTypes.func,
		baseUrl: PropTypes.string,
		username: PropTypes.string,
		tmid: PropTypes.string,
		isEdited: PropTypes.bool,
		numberOfLines: PropTypes.number,
		customEmojis: PropTypes.bool,
		useRealName: PropTypes.bool,
		channels: PropTypes.oneOfType([PropTypes.array, PropTypes.object]),
		mentions: PropTypes.oneOfType([PropTypes.array, PropTypes.object]),
		navToRoomInfo: PropTypes.func,
		preview: PropTypes.bool,
		theme: PropTypes.string,
		testID: PropTypes.string,
		style: PropTypes.array,
		isOwn: PropTypes.bool
	};

	constructor(props) {
		super(props);
		this.state = {
			textsize: 16
		};
		this.renderer = this.createRenderer(props.preview);
	}

	componentDidMount() {
		this.getTextSize();
	}

	async getTextSize() {
		try {
			const value = await UserPreferences.getStringAsync(RocketChat.TEXT_SIZE);
			if (value !== null) {
				this.setState({ textsize: Number(value) });
			}
		} catch (error) {
			// ???????????
			return 16;
		}
	}

	createRenderer = () => new Renderer({
		renderers: {
			text: this.renderText,

			emph: Renderer.forwardChildren,
			strong: Renderer.forwardChildren,
			del: Renderer.forwardChildren,
			code: this.renderText,
			link: this.renderLink,
			image: this.renderImage,
			atMention: this.renderAtMention,
			emoji: this.renderEmoji,
			hashtag: this.renderHashtag,

			paragraph: this.renderParagraph,
			heading: this.renderHeading,
			codeBlock: this.renderText,
			blockQuote: this.renderBlockQuote,

			list: this.renderList,
			item: this.renderListItem,

			hardBreak: this.renderBreak,
			thematicBreak: this.renderBreak,
			softBreak: this.renderBreak,

			htmlBlock: this.renderText,
			htmlInline: this.renderText,

			table: this.renderTable,
			table_row: this.renderTableRow,
			table_cell: this.renderTableCell,

			editedIndicator: this.renderEditedIndicator
		},
		renderParagraphsInLists: true
	});

	editedMessage = (ast) => {
		const { isEdited } = this.props;
		if (isEdited) {
			const editIndicatorNode = new Node('edited_indicator');
			if (ast.lastChild && ['heading', 'paragraph'].includes(ast.lastChild.type)) {
				ast.lastChild.appendChild(editIndicatorNode);
			} else {
				const node = new Node('paragraph');
				node.appendChild(editIndicatorNode);

				ast.appendChild(node);
			}
		}
	};

	renderText = ({ context, literal }) => {
		const {
			numberOfLines, style = [], isOwn, searchText, theme
		} = this.props;
		const {
			textsize
		} = this.state;
		const defaultStyle = [
			this.isMessageContainsOnlyEmoji ? styles.textBig : {},
			...context.map(type => styles[type])
		];

		if(context.includes('strong')){
			literal = `*${literal}*`;
		}

		// Search Text from Message
		if(searchText && searchText.length > 0){
			const lowerLiteral = literal.toLowerCase();
			const lowerSearchText = searchText.toLowerCase();
			if(lowerLiteral.search(lowerSearchText) >= 0) {
				const startIndex = lowerLiteral.indexOf(lowerSearchText);
				const beforeString = literal.substring(0, startIndex);
				const searchedString = literal.substring(startIndex, startIndex + lowerSearchText.length);
				const nextString = literal.substring(startIndex + lowerSearchText.length, lowerLiteral.length);
				return (
					<Text
						style={ [
							styles.text,
							defaultStyle,
							{
								color: (isOwn ? themes[theme].ownMsgText : themes[theme].otherMsgText),
								fontSize: textsize,
							},
							...style
						] }
						numberOfLines={ numberOfLines }
					>
						{ beforeString }
						<Text
							style={ [
								styles.text,
								defaultStyle,
								{
									color: (isOwn ? themes[theme].otherMsgText : themes[theme].ownMsgText),
									backgroundColor: isOwn ? 'yellow' : 'green',
									fontSize: textsize,
								},
								...style
							] }>
							{ searchedString }
						</Text>
						{ nextString }
					</Text>
				)
			}
		}

		return (
			<Text
				accessibilityLabel={literal}
				style={[styles.text, defaultStyle,
				{
					color: (isOwn ? themes[theme].ownMsgText : themes[theme].otherMsgText),
					fontSize: textsize,
				},
				...style]}
				numberOfLines={numberOfLines}
			>
				{literal}
			</Text>
		);
	}

	renderBreak = () => {
		const { tmid } = this.props;
		return <Text>{tmid ? ' ' : '\n'}</Text>;
	}

	renderParagraph = ({ children }) => {
		const { numberOfLines, style, isOwn, theme } = this.props;
		if (!children || children.length === 0) {
			return null;
		}
		return (
			<Text style={[styles.text, style, { color: isOwn ? themes[theme].ownMsgText : themes[theme].otherMsgText }]} numberOfLines={numberOfLines}>
				{children}
			</Text>
		);
	};

	renderLink = ({ children, href }) => {
		const { theme } = this.props;
		return (
			<MarkdownLink
				link={href}
				theme={theme}
			>
				{children}
			</MarkdownLink>
		);
	}

	renderHashtag = ({ hashtag }) => {
		const {
			channels, navToRoomInfo, style, theme
		} = this.props;
		return (
			<MarkdownHashtag
				hashtag={hashtag}
				channels={channels}
				navToRoomInfo={navToRoomInfo}
				theme={theme}
				style={style}
			/>
		);
	}

	renderAtMention = ({ mentionName }) => {
		const {
			username, mentions, navToRoomInfo, useRealName, style, isOwn, theme
		} = this.props;
		return (
			<MarkdownAtMention
				mentions={mentions}
				mention={mentionName}
				useRealName={useRealName}
				username={username}
				navToRoomInfo={navToRoomInfo}
				isOwn={isOwn}
				theme={theme}
				style={style}
			/>
		);
	}

	renderEmoji = ({ literal }) => {
		const {
			getCustomEmoji, baseUrl, customEmojis, style, theme
		} = this.props;
		return (
			<MarkdownEmoji
				literal={literal}
				isMessageContainsOnlyEmoji={this.isMessageContainsOnlyEmoji}
				getCustomEmoji={getCustomEmoji}
				baseUrl={baseUrl}
				customEmojis={customEmojis}
				style={style}
				theme={theme}
			/>
		);
	}

	renderImage = ({ src }) => {
		if (!isValidURL(src)) {
			return null;
		}

		return (
			<Image
				style={styles.inlineImage}
				source={{ uri: encodeURI(src) }}
			/>
		);
	}

	renderEditedIndicator = () => {
		const {	textsize } = this.state;
		const { theme } = this.props;
		return <Text style={[styles.edited, { fontSize: textsize, color: themes[theme].infoText }]}> ({I18n.t('edited')})</Text>;
	}

	renderHeading = ({ children, level }) => {
		const { numberOfLines, isOwn, theme } = this.props;
		const textStyle = styles[`heading${ level }Text`];
		return (
			<Text numberOfLines={numberOfLines} style={[textStyle, { color: isOwn ? themes[theme].ownMsgText : themes[theme].otherMsgText }]}>
				{children}
			</Text>
		);
	};

	renderList = ({
		children, start, tight, type
	}) => {
		const { numberOfLines } = this.props;
		return (
			<MarkdownList
				ordered={type !== 'bullet'}
				start={start}
				tight={tight}
				numberOfLines={numberOfLines}
			>
				{children}
			</MarkdownList>
		);
	};

	renderListItem = ({
		children, context, ...otherProps
	}) => {
		const { theme } = this.props;
		const level = context.filter(type => type === 'list').length;

		return (
			<MarkdownListItem
				level={level}
				theme={theme}
				{...otherProps}
			>
				{children}
			</MarkdownListItem>
		);
	};

	renderBlockQuote = ({ children }) => {
		const { theme } = this.props;
		return (
			<MarkdownBlockQuote theme={theme}>
				{children}
			</MarkdownBlockQuote>
		);
	}

	renderTable = ({ children, numColumns }) => {
		const { theme } = this.props;
		return (
			<MarkdownTable numColumns={numColumns} theme={theme}>
				{children}
			</MarkdownTable>
		);
	}

	renderTableRow = (args) => {
		const { theme } = this.props;
		return <MarkdownTableRow {...args} theme={theme} />;
	}

	renderTableCell = (args) => {
		const { theme } = this.props;
		return <MarkdownTableCell {...args} theme={theme} />;
	}

	render() {
		const {
			msg, numberOfLines, preview = false, theme, style = [], isOwn, testID
		} = this.props;

		if (!msg) {
			return null;
		}

		let m = formatText(msg);

		// Ex: '[ ](https://open.rocket.chat/group/test?msg=abcdef)  Test'
		// Return: 'Test'
		m = filterRepliedMessage(m);

		if (preview) {
			m = shortnameToUnicode(m);
			// Removes sequential empty spaces
			m = m.replace(/\s+/g, ' ');
			m = removeMarkdown(m);
			m = m.replace(/\n+/g, ' ');
			return (
				<Text accessibilityLabel={m} style={[styles.text, { color: isOwn ? themes[theme].ownMsgText : themes[theme].otherMsgText }, ...style]} numberOfLines={numberOfLines} testID={testID}>
					{m}
				</Text>
			);
		}

		// TODO IOS Parse Message '~' Loop
		if(isIOS){
			m = m.replace(/~/g, '-');
		}

		let ast = parser.parse(m);
		ast = mergeTextNodes(ast);
		this.isMessageContainsOnlyEmoji = isOnlyEmoji(m) && emojiCount(m) <= 3;
		this.editedMessage(ast);
		return this.renderer.render(ast);
	}
}

export default Markdown;
