import React, { useRef, useState, useCallback } from 'react';
import {
    View,
    PanResponder,
    StyleSheet,
    Animated,
    TouchableOpacity,
    Text,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import HomeScreen from '../screens/HomeScreen';
import DashboardScreen from '../screens/DashboardScreen';
import GamesScreen from '../screens/GamesScreen';
import ChatScreen from '../screens/ChatScreen';
import DiaryScreen from '../screens/DiaryScreen';
import ProfileScreen from '../screens/ProfileScreen';
import { COLOR } from '../config/theme';


const TABS = [
    { name: 'Home', icon: 'home', iconOutline: 'home-outline', Component: HomeScreen },
    { name: 'Dashboard', icon: 'grid', iconOutline: 'grid-outline', Component: DashboardScreen },
    { name: 'Games', icon: 'game-controller', iconOutline: 'game-controller-outline', Component: GamesScreen },
    { name: 'Chat', icon: 'chatbubbles', iconOutline: 'chatbubbles-outline', Component: ChatScreen },
    { name: 'Diary', icon: 'book', iconOutline: 'book-outline', Component: DiaryScreen },
    { name: 'Profile', icon: 'person', iconOutline: 'person-outline', Component: ProfileScreen },
];

const SWIPE_THRESHOLD = 60;

// Screen names that live in the root Stack navigator (full-screen pushes)
const GAME_SCREENS = [
    'EmotionMatch', 'ChromaticRush', 'BreathSync', 'ImpulseGuard',
    'PatternRelease', 'OrderShift', 'SensoryFlow', 'CalmPath',
    'LightBuilder', 'MomentumSteps',
    // New full-screen screens
    'WeeklyReport', 'Achievements', 'Changelog',
];

export default function SwipeTabNavigator({ navigation: stackNavigation }: any) {
    const [activeIndex, setActiveIndex] = useState(0);
    const translateX = useRef(new Animated.Value(0)).current;

    const goToTab = useCallback((index: number) => {
        setActiveIndex(index);
        translateX.setValue(0);
    }, [translateX]);

    const panResponder = useRef(
        PanResponder.create({
            onMoveShouldSetPanResponder: (_, gestureState) => {
                return (
                    Math.abs(gestureState.dx) > 10 &&
                    Math.abs(gestureState.dx) > Math.abs(gestureState.dy) * 1.5
                );
            },
            onPanResponderMove: (_, gestureState) => {
                translateX.setValue(gestureState.dx * 0.3);
            },
            onPanResponderRelease: (_, gestureState) => {
                const { dx } = gestureState;

                if (dx < -SWIPE_THRESHOLD) {
                    setActiveIndex(prev => Math.min(prev + 1, TABS.length - 1));
                } else if (dx > SWIPE_THRESHOLD) {
                    setActiveIndex(prev => Math.max(prev - 1, 0));
                }

                Animated.spring(translateX, {
                    toValue: 0,
                    useNativeDriver: true,
                    tension: 80,
                    friction: 12,
                }).start();
            },
        })
    ).current;

    const ActiveComponent = TABS[activeIndex].Component;

    // Navigation object passed to each tab screen.
    // Game screen names are forwarded to the root Stack navigator so they
    // actually open the full-screen game components.
    const fakeNavigation = {
        navigate: (name: string, params?: any) => {
            if (GAME_SCREENS.includes(name)) {
                // Forward to the root Stack so the game screen mounts properly
                stackNavigation.navigate(name, params);
            } else {
                const idx = TABS.findIndex(t => t.name === name);
                if (idx !== -1) goToTab(idx);
            }
        },
        goBack: () => stackNavigation.goBack(),
        replace: (name: string, params?: any) => stackNavigation.replace(name, params),
        push: (name: string, params?: any) => stackNavigation.push(name, params),
        pop: () => stackNavigation.pop(),
        addListener: () => ({ remove: () => { } }),
        isFocused: () => true,
        dispatch: (action: any) => stackNavigation.dispatch(action),
    };

    return (
        <View style={styles.container}>
            {/* Swipeable Content Area */}
            <Animated.View
                style={[styles.content, { transform: [{ translateX }] }]}
                {...panResponder.panHandlers}
            >
                <ActiveComponent
                    navigation={fakeNavigation as any}
                    route={{ key: TABS[activeIndex].name, name: TABS[activeIndex].name } as any}
                />
            </Animated.View>

            {/* Custom Bottom Tab Bar */}
            <View style={styles.tabBar}>
                {TABS.map((tab, index) => {
                    const focused = activeIndex === index;
                    return (
                        <TouchableOpacity
                            key={tab.name}
                            style={styles.tabItem}
                            onPress={() => goToTab(index)}
                            activeOpacity={0.7}
                        >
                            <View style={[styles.iconWrapper, focused && styles.iconWrapperActive]}>
                                <Ionicons
                                    name={focused ? (tab.icon as any) : (tab.iconOutline as any)}
                                    size={focused ? 22 : 20}
                                    color={focused ? COLOR.purple500 : '#4B5563'}
                                />
                            </View>
                            <Text style={[styles.tabLabel, focused && styles.tabLabelActive]}>
                                {tab.name}
                            </Text>
                        </TouchableOpacity>
                    );
                })}
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#0a0514',
    },
    content: {
        flex: 1,
    },
    tabBar: {
        flexDirection: 'row',
        backgroundColor: '#0d0820',
        borderTopColor: 'rgba(255,255,255,0.08)',
        borderTopWidth: 1,
        paddingBottom: 6,
        paddingTop: 6,
        height: 62,
    },
    tabItem: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    iconWrapper: {
        padding: 4,
        borderRadius: 12,
    },
    iconWrapperActive: {
        backgroundColor: 'rgba(139, 92, 246, 0.12)',
    },
    tabLabel: {
        fontSize: 10,
        fontWeight: '600',
        color: '#4B5563',
        marginTop: 2,
    },
    tabLabelActive: {
        color: COLOR.purple500,
    },
});
