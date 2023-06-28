import { StyleSheet } from 'react-native';
import {COLOR_SEPARATOR} from "../../constants/colors";
import sharedStyles from "../Styles";

export default StyleSheet.create({
    container: {
        flex: 1,
    },
    headerContainer: {
        padding: 16
    },
    headerTitle:{
        marginVertical: 16,
        fontSize: 16,
        textAlign: 'center'
    },
    emptyText: {
        flexGrow: 1,
        flex: 1,
        alignItems: 'center',
        textAlign: 'center'
    },
    list: {
        flex: 1,
        flexGrow: 1
    },
    separator: {
        height: StyleSheet.hairlineWidth,
        backgroundColor: COLOR_SEPARATOR,
        marginLeft: 73
    },
    itemContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 4
    },
    userContainer: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        marginVertical: 4
    },
    avatar: {
        marginLeft: 4,
        fontSize: 20,
        fontWeight: 'bold',
        color: 'black'
    },
    userName: {
        flex: 1,
        marginLeft: 8
    },
    options: {
        flexDirection: 'row',
        alignItems: 'center'
    },
    optionBtn: {
        width: 44,
        alignItems: 'center'
    },
    buttonIcon:{
        color: '#66A9DD'
    },
    buttons: {
        marginHorizontal: 24,
        marginVertical: 8
    },
    modalContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center'
    },
    modalContent: {
        padding: 32,
        width: '100%',
        borderRadius: 4
    },
    modalTitle: {
        fontSize: 16,
        paddingBottom: 8,
        ...sharedStyles.textBold,
        ...sharedStyles.textAlignCenter
    },
    button: {
        marginBottom: 0
    },
    modalButtonContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between'
    },
    tablet: {
        height: undefined
    },
    androidButton: {
        borderRadius: 10,
        justifyContent: 'center',
        height: 48,
        width: 120,
        shadowColor: '#000',
        shadowRadius: 2,
        shadowOpacity: 0.4,
        shadowOffset: {
            width: 0,
            height: 2
        },
        elevation: 8
    },
    androidButtonText: {
        fontSize: 18,
        textAlign: 'center'
    },
});
