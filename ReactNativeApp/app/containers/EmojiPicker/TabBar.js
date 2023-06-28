import React from 'react';
import PropTypes from 'prop-types';
import { View, TouchableOpacity, Text, ScrollView } from 'react-native';
import styles from './styles';
import { themes } from '../../constants/colors';
import scrollPersistTaps from '../../utils/scrollPersistTaps';

export default class TabBar extends React.Component {
	static propTypes = {
		goToPage: PropTypes.func,
		activeTab: PropTypes.number,
		tabs: PropTypes.array,
		tabEmojiStyle: PropTypes.object,
		hasFrequency: PropTypes.bool,
		hasAddtionalBtn: PropTypes.bool,
		theme: PropTypes.string
	}

	shouldComponentUpdate(nextProps) {
		const { activeTab, theme } = this.props;
		if (nextProps.activeTab !== activeTab) {
			return true;
		}
		if (nextProps.theme !== theme) {
			return true;
		}
		return false;
	}

	renderTab(tab, i){
        const {
            goToPage, tabEmojiStyle, activeTab, theme
        } = this.props;

        return (
            <TouchableOpacity
                activeOpacity={0.7}
                key={tab}
                onPress={() => goToPage(i)}
                style={styles.tab}
                testID={`reaction-picker-${ tab }`}
            >
                <Text style={[styles.tabEmoji, tabEmojiStyle]}>{tab}</Text>
                {activeTab === i ? <View style={[styles.activeTabLine, { backgroundColor: themes[theme].tintColor }]} /> : <View style={styles.tabLine} />}
            </TouchableOpacity>
        );
	}
	
	render() {
		const {
			tabs, hasFrequency, hasAddtionalBtn
		} = this.props;

		const frequencyTab = tabs[0];
        let realTabs = tabs;
        let scrollContainerStyle = styles.scrollContainer;
        if(hasFrequency){
            realTabs = tabs.slice(1, tabs.length);
            scrollContainerStyle = { ... scrollContainerStyle, marginRight:(hasAddtionalBtn?80:40) };
        }

		return (
            <View style={styles.tabBarContainer} >
                { hasFrequency ? <View style={{ height: 44, paddingTop: 8 }}>
                    { this.renderTab(frequencyTab, 0) }
                </View>: null }
                <View style={scrollContainerStyle} >
                    <ScrollView horizontal={true} showsHorizontalScrollIndicator={false} {...scrollPersistTaps} contentContainerStyle={styles.tabsContainer}>
                        {realTabs.map((tab, i) => this.renderTab(tab, hasFrequency ? i + 1 : i))}
                    </ScrollView>
                </View>
			</View>
		);
	}
}
