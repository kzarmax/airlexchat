import {StyleSheet} from "react-native";
import {isTablet} from "../../utils/deviceInfo";

export default StyleSheet.create({
    container: {
        flex: 1
    },
    btnContainer: {
        position: 'absolute',
        flex: 1,
        flexDirection: 'row',
        justifyContent: 'space-between',
        width: '100%',
        padding: 24,
        color: 'white'
    },
    list: {
        flex: 1
    },
    itemContainer: {
        padding: 8,
    },
    image: {
        minHeight: isTablet ? 700 : 500,
        width: '100%',
        margin: 2
    },
    imageIndicator: {
        width: '80%',
    },
});