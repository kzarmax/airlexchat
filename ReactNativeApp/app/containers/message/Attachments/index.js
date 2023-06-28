import React, {useContext} from 'react';
import { TouchableOpacity, View, Text } from "react-native";
import PropTypes from "prop-types";
import styles from "../styles";
import Attachment from "./Attachment";
import Reply from "../Reply";
import { isEqual } from 'lodash';
import Audio from "../Audio";
import {themes} from "../../../constants/colors";
import {formatAttachmentUrl} from "../../../lib/utils";
import MessageContext from "../Context";
import openLink from "../../../utils/openLink";
import {getThumbnailDescription, isTypeSupported} from "../../../utils/media";
import Markdown from "../../markdown";

const Attachments = React.memo(({
        attachments, timeFormat, isOwn, showAttachment, getCustomEmoji, textColor, theme
    }) => {
    if (!attachments || attachments.length === 0) {
        return null;
    }

    const { user, baseUrl, card, onLongPress } = useContext(MessageContext);
    const elements = [];
    const medias = attachments.filter(file => file.image_url || file.video_url);

    if(medias.length){
        const isAlone= medias.length===1;
        const isOverTwo = medias.length > 2;
        const isOverFour = medias.length > 4;
        const overNumber = isOverFour?medias.length - 4:0;
        let { file_description } = getThumbnailDescription(medias[0].description);

        const onPressMedia = () => {
            if(isAlone){
                const file = medias[0];
                const uri = formatAttachmentUrl(file.video_url || file.image_url, user.id, user.token, baseUrl);
                if (file.video_url && !isTypeSupported(file.video_type)) {
                    return openLink(uri, theme);
                }
                return showAttachment(file, uri);
            }
            showAttachment(null, null, file_description??card.username);
        };

        elements.push(
            <>
                <TouchableOpacity onPress={() => onPressMedia()} onLongPress={onLongPress} style={[ isAlone ? styles.mediaContainer: styles.sliceMediaContainer, !isAlone && { backgroundColor: isOwn?themes[theme].messageOwnBackground:themes[theme].messageOtherBackground, height: isOverTwo? 216: 112 }]}>
                    <>
                        {
                            medias.slice(0, 4).map(media => (
                                <Attachment
                                    file={media}
                                    isAlone={isAlone}
                                    isOwn={isOwn}
                                    textColor={textColor}
                                    getCustomEmoji={getCustomEmoji}
                                    theme={theme}
                                />
                            ))
                        }
                        { isOverFour? <View style={styles.mediaOver}><Text style={styles.overText}>+ {overNumber}</Text></View>: null}
                    </>
                </TouchableOpacity>
                { !isAlone && <Markdown msg={file_description} baseUrl={baseUrl} username={card.username} getCustomEmoji={getCustomEmoji} style={[{ marginTop: 6, width: 216, color: textColor?textColor:themes[theme].auxiliaryText }]} theme={theme} />}
            </>
        )
    }

    const others = attachments.filter(file => !file.image_url && !file.video_url);
    others.forEach((file) => {
        if (file.audio_url) {
            elements.push(<Audio key={file.audio_url} file={file} getCustomEmoji={getCustomEmoji} theme={theme} />);
        } else {
            elements.push(<Reply key={'reply'} attachment={file} timeFormat={timeFormat} getCustomEmoji={getCustomEmoji} theme={theme} isOwn={isOwn} textColor={textColor} />);
        }
    });
    if(elements.length){
        return <View style={{ flex: 1 }}>
            {elements}
        </View>;
    }
    return null;
}, (prevProps, nextProps) => isEqual(prevProps.attachments, nextProps.attachments) && prevProps.theme === nextProps.theme);

Attachments.propTypes = {
    attachments: PropTypes.array,
    timeFormat: PropTypes.string,
    isOwn: PropTypes.bool,
    showAttachment: PropTypes.func,
    getCustomEmoji: PropTypes.func,
    textColor: PropTypes.string,
    theme: PropTypes.string
};
Attachments.displayName = 'MessageAttachments';

export default Attachments;
