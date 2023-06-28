import XRegExp from "xregexp";


export const filterMentionName = (name) => {
    if(!name){
        return null;
    }
    return name.replace(new XRegExp('[^0-9a-zA-Z\\p{Hiragana}\\p{Katakana}\\p{Han}-_.]', 'g'), '');
}
