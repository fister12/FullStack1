/**
 * Video Player Screen - Thin Client
 * Uses WebView to load video from backend embed URL.
 * Never sees raw YouTube URL - only backend-provided embed.
 */
import React, { useState, useRef } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    ActivityIndicator,
    SafeAreaView,
} from 'react-native';
import { WebView } from 'react-native-webview';
import { useAuth } from '../context/AuthContext';
import { VideoAPI } from '../services/api';

export default function VideoPlayerScreen({ route, navigation }) {
    const { videoId, playbackToken, title } = route.params;
    const { user } = useAuth();
    const webViewRef = useRef(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    // Build embed URL - backend handles the actual YouTube URL
    // The app NEVER sees the raw YouTube URL
    const embedUrl = VideoAPI.buildEmbedUrl(videoId, playbackToken, user?.id);

    const handleGoBack = () => {
        navigation.goBack();
    };

    const handleError = (syntheticEvent) => {
        const { nativeEvent } = syntheticEvent;
        console.error('WebView error:', nativeEvent);
        setError('Failed to load video');
        setIsLoading(false);
    };

    const handleLoad = () => {
        setIsLoading(false);
    };

    return (
        <SafeAreaView style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={handleGoBack} style={styles.backButton}>
                    <Text style={styles.backText}>← Back</Text>
                </TouchableOpacity>
                <Text style={styles.title} numberOfLines={1}>
                    {title}
                </Text>
                <View style={styles.placeholder} />
            </View>

            {/* Video Player WebView */}
            <View style={styles.playerContainer}>
                {isLoading && (
                    <View style={styles.loadingOverlay}>
                        <ActivityIndicator size="large" color="#6366f1" />
                        <Text style={styles.loadingText}>Loading video...</Text>
                    </View>
                )}

                {error ? (
                    <View style={styles.errorContainer}>
                        <Text style={styles.errorText}>{error}</Text>
                        <TouchableOpacity
                            style={styles.retryButton}
                            onPress={() => {
                                setError(null);
                                setIsLoading(true);
                                webViewRef.current?.reload();
                            }}
                        >
                            <Text style={styles.retryText}>Retry</Text>
                        </TouchableOpacity>
                    </View>
                ) : (
                    <WebView
                        ref={webViewRef}
                        source={{ uri: embedUrl }}
                        style={styles.webview}
                        onLoad={handleLoad}
                        onError={handleError}
                        allowsFullscreenVideo
                        allowsInlineMediaPlayback
                        javaScriptEnabled
                        domStorageEnabled
                    />
                )}
            </View>

            {/* Video Info */}
            <View style={styles.infoContainer}>
                <Text style={styles.infoTitle}>{title}</Text>
                <Text style={styles.infoSubtitle}>
                    Secure playback via API
                </Text>
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#0f0f23',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 12,
        backgroundColor: '#1a1a2e',
        borderBottomWidth: 1,
        borderBottomColor: '#2a2a4a',
    },
    backButton: {
        paddingVertical: 8,
        paddingRight: 16,
    },
    backText: {
        color: '#6366f1',
        fontSize: 16,
        fontWeight: '600',
    },
    title: {
        flex: 1,
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
        textAlign: 'center',
    },
    placeholder: {
        width: 60,
    },
    playerContainer: {
        width: '100%',
        aspectRatio: 16 / 9,
        backgroundColor: '#000',
    },
    webview: {
        flex: 1,
        backgroundColor: '#000',
    },
    loadingOverlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#000',
        zIndex: 1,
    },
    loadingText: {
        color: '#888',
        marginTop: 12,
        fontSize: 14,
    },
    errorContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#000',
    },
    errorText: {
        color: '#ff6b6b',
        fontSize: 16,
        marginBottom: 16,
    },
    retryButton: {
        backgroundColor: '#6366f1',
        paddingHorizontal: 24,
        paddingVertical: 12,
        borderRadius: 8,
    },
    retryText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
    infoContainer: {
        padding: 20,
        borderBottomWidth: 1,
        borderBottomColor: '#2a2a4a',
    },
    infoTitle: {
        color: '#fff',
        fontSize: 20,
        fontWeight: 'bold',
        marginBottom: 8,
    },
    infoSubtitle: {
        color: '#888',
        fontSize: 14,
    },
});
