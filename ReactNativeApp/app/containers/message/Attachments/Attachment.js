import PropTypes from "prop-types";
import React from "react";
import Image from "../Image";
import Video from "../Video";

const Attachment = React.memo(({
   file, isOwn, isAlone, getCustomEmoji, textColor, theme
}) => {
    if (file.image_url) {
        return <Image key={file.image_url} file={file} getCustomEmoji={getCustomEmoji} isOwn={isOwn} isAlone={isAlone} textColor={textColor} theme={theme} />;
    }
    if (file.video_url) {
        return <Video key={file.video_url} file={file} getCustomEmoji={getCustomEmoji} isOwn={isOwn} isAlone={isAlone} textColor={textColor} theme={theme} />;
    }
    return null;
});

Attachment.propTypes = {
    file: PropTypes.object,
    isOwn: PropTypes.bool,
    isAlone: PropTypes.bool,
    textColor: PropTypes.string,
    getCustomEmoji: PropTypes.func,
    theme: PropTypes.string
};
Attachment.displayName = 'Attachment';

export default Attachment;