/**
 * Dashboard Screen - Thin Client
 * Fetches video data from backend and renders tiles.
 * No filtering or data manipulation - backend decides what to show.
 */
import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    ActivityIndicator,
    Image,
    ScrollView,
    RefreshControl,
    Alert,
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import { VideoAPI } from '../services/api';

export default function DashboardScreen({ navigation }) {
    const { user, logout } = useAuth();
    const [videos, setVideos] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isRefreshing, setIsRefreshing] = useState(false);

    useEffect(() => {
        fetchDashboard();
    }, []);

    const fetchDashboard = async () => {
        try {
            // Fetch from backend - no filtering or manipulation here
            const data = await VideoAPI.getDashboard();
            setVideos(data.videos);
        } catch (error) {
            const message = error.response?.data?.error || 'Failed to load videos';
            Alert.alert('Error', message);
        } finally {
            setIsLoading(false);
            setIsRefreshing(false);
        }
    };

    const handleRefresh = () => {
        setIsRefreshing(true);
        fetchDashboard();
    };

    const handleVideoPress = (video) => {
        // Pass video data to player - no manipulation
        navigation.navigate('VideoPlayer', {
            videoId: video.video_id,
            playbackToken: video.playback_token,
            title: video.title,
        });
    };

    const handleLogout = async () => {
        await logout();
    };

    if (isLoading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#6366f1" />
            </View>
        );
    }

    return (
        <View style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <View>
                    <Text style={styles.greeting}>Welcome back,</Text>
                    <Text style={styles.email}>{user?.email || 'User'}</Text>
                </View>
                <TouchableOpacity onPress={handleLogout} style={styles.logoutButton}>
                    <Text style={styles.logoutText}>Logout</Text>
                </TouchableOpacity>
            </View>

            {/* Video Grid */}
            <ScrollView
                style={styles.scrollView}
                refreshControl={
                    <RefreshControl
                        refreshing={isRefreshing}
                        onRefresh={handleRefresh}
                        tintColor="#6366f1"
                    />
                }
            >
                <Text style={styles.sectionTitle}>Featured Videos</Text>

                <View style={styles.videoGrid}>
                    {videos.map((video) => (
                        <TouchableOpacity
                            key={video.video_id}
                            style={styles.videoCard}
                            onPress={() => handleVideoPress(video)}
                            activeOpacity={0.9}
                        >
                            <Image
                                source={{ uri: video.thumbnail_url }}
                                style={styles.thumbnail}
                                resizeMode="cover"
                            />
                            <View style={styles.playOverlay}>
                                <View style={styles.playButton}>
                                    <Text style={styles.playIcon}>▶</Text>
                                </View>
                            </View>
                            <View style={styles.videoInfo}>
                                <Text style={styles.videoTitle} numberOfLines={2}>
                                    {video.title}
                                </Text>
                                <Text style={styles.videoDescription} numberOfLines={2}>
                                    {video.description}
                                </Text>
                            </View>
                        </TouchableOpacity>
                    ))}
                </View>

                {videos.length === 0 && (
                    <View style={styles.emptyState}>
                        <Text style={styles.emptyText}>No videos available</Text>
                    </View>
                )}
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#0f0f23',
    },
    loadingContainer: {
        flex: 1,
        backgroundColor: '#0f0f23',
        justifyContent: 'center',
        alignItems: 'center',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingTop: 60,
        paddingBottom: 20,
        backgroundColor: '#1a1a2e',
        borderBottomWidth: 1,
        borderBottomColor: '#2a2a4a',
    },
    greeting: {
        fontSize: 14,
        color: '#888',
    },
    email: {
        fontSize: 18,
        fontWeight: '600',
        color: '#fff',
    },
    logoutButton: {
        backgroundColor: '#2a2a4a',
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 8,
    },
    logoutText: {
        color: '#ff6b6b',
        fontWeight: '600',
    },
    scrollView: {
        flex: 1,
        paddingHorizontal: 20,
    },
    sectionTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#fff',
        marginTop: 24,
        marginBottom: 16,
    },
    videoGrid: {
        gap: 20,
        paddingBottom: 40,
    },
    videoCard: {
        backgroundColor: '#1a1a2e',
        borderRadius: 16,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: '#2a2a4a',
    },
    thumbnail: {
        width: '100%',
        height: 200,
        backgroundColor: '#2a2a4a',
    },
    playOverlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: 200,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0,0,0,0.3)',
    },
    playButton: {
        width: 60,
        height: 60,
        borderRadius: 30,
        backgroundColor: 'rgba(99, 102, 241, 0.9)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    playIcon: {
        color: '#fff',
        fontSize: 24,
        marginLeft: 4,
    },
    videoInfo: {
        padding: 16,
    },
    videoTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#fff',
        marginBottom: 8,
    },
    videoDescription: {
        fontSize: 14,
        color: '#888',
        lineHeight: 20,
    },
    emptyState: {
        paddingVertical: 60,
        alignItems: 'center',
    },
    emptyText: {
        color: '#888',
        fontSize: 16,
    },
});
