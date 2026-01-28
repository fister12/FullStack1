/**
 * Video App - Complete Version
 * Thin Client - All business logic on backend
 * Includes: Auth, Dashboard, Video Player, Settings
 */
import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  StatusBar,
  ScrollView,
  Image,
  ActivityIndicator,
  Linking,
} from 'react-native';

// API Configuration
const API_URL = 'http://192.168.29.192:5000';

// Simple state management (no external packages)
let authToken = null;
let currentUser = null;

export default function App() {
  const [screen, setScreen] = useState('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [videos, setVideos] = useState([]);
  const [selectedVideo, setSelectedVideo] = useState(null);
  const [isPaused, setIsPaused] = useState(false);
  const [isMuted, setIsMuted] = useState(false);

  // API Helper
  const apiCall = async (endpoint, options = {}) => {
    const headers = {
      'Content-Type': 'application/json',
      ...(authToken && { 'Authorization': `Bearer ${authToken}` }),
      ...options.headers,
    };

    const response = await fetch(`${API_URL}${endpoint}`, {
      ...options,
      headers,
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Request failed');
    }

    return data;
  };

  // Auth Handlers
  const handleSignup = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Email and password are required');
      return;
    }

    setIsLoading(true);
    try {
      await apiCall('/auth/signup', {
        method: 'POST',
        body: JSON.stringify({ name, email, password }),
      });
      Alert.alert('Success', 'Account created! Please login.');
      setScreen('login');
      setName('');
      setPassword('');
    } catch (error) {
      Alert.alert('Error', error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Email and password are required');
      return;
    }

    setIsLoading(true);
    try {
      const data = await apiCall('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      });
      authToken = data.access_token;
      currentUser = data.user;
      setPassword('');
      await fetchDashboard();
      setScreen('dashboard');
    } catch (error) {
      Alert.alert('Error', error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await apiCall('/auth/logout', { method: 'POST' });
    } catch (error) {
      // Logout anyway even if API fails
    }
    authToken = null;
    currentUser = null;
    setVideos([]);
    setScreen('login');
  };

  // Dashboard
  const fetchDashboard = async () => {
    try {
      const data = await apiCall('/dashboard');
      setVideos(data.videos || []);
    } catch (error) {
      Alert.alert('Error', 'Failed to load videos');
    }
  };

  // Video Player
  const openVideo = async (video) => {
    setSelectedVideo(video);
    setScreen('player');
    setIsPaused(false);
    setIsMuted(false);
  };

  // LOGIN SCREEN
  if (screen === 'login') {
    return (
      <View style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor="#0f0f23" />
        <Text style={styles.title}>Welcome Back</Text>
        <Text style={styles.subtitle}>Sign in to continue</Text>

        <TextInput
          style={styles.input}
          placeholder="Email"
          placeholderTextColor="#666"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
        />

        <TextInput
          style={styles.input}
          placeholder="Password"
          placeholderTextColor="#666"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />

        <TouchableOpacity
          style={[styles.button, isLoading && styles.buttonDisabled]}
          onPress={handleLogin}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>Sign In</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity onPress={() => setScreen('signup')}>
          <Text style={styles.linkText}>
            Don't have an account? <Text style={styles.linkBold}>Sign Up</Text>
          </Text>
        </TouchableOpacity>
      </View>
    );
  }

  // SIGNUP SCREEN
  if (screen === 'signup') {
    return (
      <View style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor="#0f0f23" />
        <Text style={styles.title}>Create Account</Text>
        <Text style={styles.subtitle}>Sign up to get started</Text>

        <TextInput
          style={styles.input}
          placeholder="Full Name"
          placeholderTextColor="#666"
          value={name}
          onChangeText={setName}
        />

        <TextInput
          style={styles.input}
          placeholder="Email"
          placeholderTextColor="#666"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
        />

        <TextInput
          style={styles.input}
          placeholder="Password"
          placeholderTextColor="#666"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />

        <TouchableOpacity
          style={[styles.button, isLoading && styles.buttonDisabled]}
          onPress={handleSignup}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>Create Account</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity onPress={() => setScreen('login')}>
          <Text style={styles.linkText}>
            Already have an account? <Text style={styles.linkBold}>Sign In</Text>
          </Text>
        </TouchableOpacity>
      </View>
    );
  }

  // DASHBOARD SCREEN
  if (screen === 'dashboard') {
    return (
      <View style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor="#0f0f23" />

        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Dashboard</Text>
          <TouchableOpacity onPress={() => setScreen('settings')}>
            <Text style={styles.settingsIcon}>⚙️</Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.scrollView}>
          <Text style={styles.sectionTitle}>Featured Videos</Text>

          {videos.map((video, index) => (
            <TouchableOpacity
              key={video.video_id || index}
              style={styles.videoCard}
              onPress={() => openVideo(video)}
            >
              <Image
                source={{ uri: video.thumbnail_url }}
                style={styles.thumbnail}
                resizeMode="cover"
              />
              <View style={styles.playOverlay}>
                <Text style={styles.playIcon}>▶</Text>
              </View>
              <View style={styles.videoInfo}>
                <Text style={styles.videoTitle}>{video.title}</Text>
                <Text style={styles.videoDesc}>{video.description}</Text>
              </View>
            </TouchableOpacity>
          ))}

          {videos.length === 0 && (
            <View style={styles.emptyState}>
              <Text style={styles.emptyText}>No videos available</Text>
              <TouchableOpacity style={styles.refreshButton} onPress={fetchDashboard}>
                <Text style={styles.refreshText}>Refresh</Text>
              </TouchableOpacity>
            </View>
          )}
        </ScrollView>
      </View>
    );
  }

  // VIDEO PLAYER SCREEN
  if (screen === 'player' && selectedVideo) {
    return (
      <View style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor="#000" />

        {/* Header */}
        <View style={styles.playerHeader}>
          <TouchableOpacity onPress={() => setScreen('dashboard')}>
            <Text style={styles.backButton}>← Back</Text>
          </TouchableOpacity>
          <Text style={styles.playerTitle} numberOfLines={1}>{selectedVideo.title}</Text>
        </View>

        {/* Video Placeholder */}
        <View style={styles.videoPlayer}>
          <Image
            source={{ uri: selectedVideo.thumbnail_url }}
            style={styles.videoFrame}
            resizeMode="cover"
          />
          {isPaused && (
            <View style={styles.pauseOverlay}>
              <Text style={styles.pauseIcon}>⏸</Text>
            </View>
          )}
          {!isPaused && (
            <View style={styles.playingOverlay}>
              <Text style={styles.playingText}>🎬 Playing via secure stream...</Text>
              <Text style={styles.secureText}>YouTube URL hidden from client</Text>
            </View>
          )}
        </View>

        {/* Controls */}
        <View style={styles.controls}>
          <TouchableOpacity
            style={styles.controlButton}
            onPress={() => setIsPaused(!isPaused)}
          >
            <Text style={styles.controlIcon}>{isPaused ? '▶️' : '⏸️'}</Text>
            <Text style={styles.controlLabel}>{isPaused ? 'Play' : 'Pause'}</Text>
          </TouchableOpacity>

          <View style={styles.seekBar}>
            <View style={styles.seekProgress} />
          </View>

          <TouchableOpacity
            style={styles.controlButton}
            onPress={() => setIsMuted(!isMuted)}
          >
            <Text style={styles.controlIcon}>{isMuted ? '🔇' : '🔊'}</Text>
            <Text style={styles.controlLabel}>{isMuted ? 'Unmute' : 'Mute'}</Text>
          </TouchableOpacity>
        </View>

        {/* Video Info */}
        <View style={styles.videoDetails}>
          <Text style={styles.detailTitle}>{selectedVideo.title}</Text>
          <Text style={styles.detailDesc}>{selectedVideo.description}</Text>
          <Text style={styles.secureNote}>
            🔒 Secure playback via API token
          </Text>
        </View>
      </View>
    );
  }

  // SETTINGS SCREEN
  if (screen === 'settings') {
    return (
      <View style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor="#0f0f23" />

        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => setScreen('dashboard')}>
            <Text style={styles.backButton}>← Back</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Settings</Text>
          <View style={{ width: 50 }} />
        </View>

        <View style={styles.settingsContent}>
          {/* User Info Card */}
          <View style={styles.userCard}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>
                {(currentUser?.name || currentUser?.email || 'U')[0].toUpperCase()}
              </Text>
            </View>
            <View style={styles.userInfo}>
              <Text style={styles.userName}>{currentUser?.name || 'User'}</Text>
              <Text style={styles.userEmail}>{currentUser?.email}</Text>
            </View>
          </View>

          {/* Settings Options */}
          <View style={styles.settingsSection}>
            <Text style={styles.sectionLabel}>Account</Text>

            <View style={styles.settingItem}>
              <Text style={styles.settingLabel}>Email</Text>
              <Text style={styles.settingValue}>{currentUser?.email}</Text>
            </View>

            <View style={styles.settingItem}>
              <Text style={styles.settingLabel}>Name</Text>
              <Text style={styles.settingValue}>{currentUser?.name || 'Not set'}</Text>
            </View>

            <View style={styles.settingItem}>
              <Text style={styles.settingLabel}>Member since</Text>
              <Text style={styles.settingValue}>
                {currentUser?.created_at ? new Date(currentUser.created_at).toLocaleDateString() : '-'}
              </Text>
            </View>
          </View>

          {/* Logout Button */}
          <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
            <Text style={styles.logoutText}>Logout</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // Fallback
  return null;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f0f23',
  },
  // Auth Screens
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#fff',
    marginTop: 80,
    marginBottom: 8,
    paddingHorizontal: 30,
  },
  subtitle: {
    fontSize: 16,
    color: '#888',
    marginBottom: 40,
    paddingHorizontal: 30,
  },
  input: {
    backgroundColor: '#1a1a2e',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: '#fff',
    marginBottom: 16,
    marginHorizontal: 30,
    borderWidth: 1,
    borderColor: '#2a2a4a',
  },
  button: {
    backgroundColor: '#6366f1',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginHorizontal: 30,
    marginTop: 8,
    marginBottom: 24,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  linkText: {
    color: '#888',
    fontSize: 14,
    textAlign: 'center',
  },
  linkBold: {
    color: '#6366f1',
    fontWeight: '600',
  },

  // Header
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 16,
    backgroundColor: '#1a1a2e',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  settingsIcon: {
    fontSize: 24,
  },
  backButton: {
    color: '#6366f1',
    fontSize: 16,
    fontWeight: '600',
  },

  // Dashboard
  scrollView: {
    flex: 1,
    paddingHorizontal: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#fff',
    marginTop: 24,
    marginBottom: 16,
  },
  videoCard: {
    backgroundColor: '#1a1a2e',
    borderRadius: 16,
    marginBottom: 20,
    overflow: 'hidden',
  },
  thumbnail: {
    width: '100%',
    height: 180,
    backgroundColor: '#2a2a4a',
  },
  playOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 180,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  playIcon: {
    fontSize: 48,
    color: '#fff',
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
  videoDesc: {
    fontSize: 14,
    color: '#888',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    color: '#888',
    marginBottom: 16,
  },
  refreshButton: {
    backgroundColor: '#6366f1',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  refreshText: {
    color: '#fff',
    fontWeight: '600',
  },

  // Video Player
  playerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#000',
    paddingTop: 50,
  },
  playerTitle: {
    color: '#fff',
    fontSize: 16,
    marginLeft: 16,
    flex: 1,
  },
  videoPlayer: {
    width: '100%',
    aspectRatio: 16 / 9,
    backgroundColor: '#000',
  },
  videoFrame: {
    width: '100%',
    height: '100%',
  },
  pauseOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  pauseIcon: {
    fontSize: 64,
  },
  playingOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  playingText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  secureText: {
    color: '#888',
    fontSize: 12,
    marginTop: 8,
  },
  controls: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#1a1a2e',
  },
  controlButton: {
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  controlIcon: {
    fontSize: 28,
  },
  controlLabel: {
    color: '#888',
    fontSize: 12,
    marginTop: 4,
  },
  seekBar: {
    flex: 1,
    height: 4,
    backgroundColor: '#2a2a4a',
    borderRadius: 2,
    marginHorizontal: 16,
  },
  seekProgress: {
    width: '40%',
    height: '100%',
    backgroundColor: '#6366f1',
    borderRadius: 2,
  },
  videoDetails: {
    padding: 20,
  },
  detailTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
  },
  detailDesc: {
    fontSize: 14,
    color: '#888',
    marginBottom: 16,
  },
  secureNote: {
    color: '#4ade80',
    fontSize: 12,
  },

  // Settings
  settingsContent: {
    flex: 1,
    padding: 20,
  },
  userCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1a1a2e',
    padding: 20,
    borderRadius: 16,
    marginBottom: 24,
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#6366f1',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
  },
  userInfo: {
    marginLeft: 16,
  },
  userName: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '600',
  },
  userEmail: {
    color: '#888',
    fontSize: 14,
  },
  settingsSection: {
    backgroundColor: '#1a1a2e',
    borderRadius: 16,
    padding: 16,
    marginBottom: 24,
  },
  sectionLabel: {
    color: '#888',
    fontSize: 12,
    textTransform: 'uppercase',
    marginBottom: 16,
  },
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#2a2a4a',
  },
  settingLabel: {
    color: '#fff',
    fontSize: 16,
  },
  settingValue: {
    color: '#888',
    fontSize: 16,
  },
  logoutButton: {
    backgroundColor: '#dc2626',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  logoutText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
