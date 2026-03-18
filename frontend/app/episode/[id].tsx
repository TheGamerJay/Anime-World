import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, Dimensions, Image, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Colors, Spacing, Radius } from '../../src/theme';
import { useAuth } from '../../src/AuthContext';
import { historyAPI } from '../../src/api';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export default function EpisodePlayerScreen() {
  const router = useRouter();
  const { id, ep, title, anime_title, image } = useLocalSearchParams<{
    id: string; ep: string; title: string; anime_title: string; image: string;
  }>();
  const { user } = useAuth();
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (user && id && ep) {
      historyAPI.update({
        anime_id: parseInt(id),
        episode_number: parseInt(ep || '1'),
        title: title || `Episode ${ep}`,
        anime_title: anime_title || 'Unknown',
        image_url: image ? decodeURIComponent(image) : '',
        progress: 0,
      }).catch(() => {});
    }
  }, [user, id, ep]);

  useEffect(() => {
    let interval: any;
    if (isPlaying) {
      interval = setInterval(() => {
        setProgress(prev => {
          if (prev >= 100) {
            setIsPlaying(false);
            return 100;
          }
          return prev + 0.5;
        });
      }, 100);
    }
    return () => clearInterval(interval);
  }, [isPlaying]);

  const decodedImage = image ? decodeURIComponent(image) : '';
  const decodedTitle = title ? decodeURIComponent(title) : `Episode ${ep}`;
  const decodedAnimeTitle = anime_title ? decodeURIComponent(anime_title) : '';

  const formatTime = (pct: number) => {
    const totalSeconds = Math.floor((pct / 100) * 1440);
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <View style={styles.container}>
      {/* Video Area */}
      <View style={styles.videoContainer}>
        <Image source={{ uri: decodedImage }} style={styles.videoImage} />
        <LinearGradient colors={['rgba(0,0,0,0.3)', 'transparent', 'rgba(0,0,0,0.5)']} style={styles.videoOverlay}>
          {/* Top bar */}
          <SafeAreaView edges={['top']} style={styles.topBar}>
            <TouchableOpacity testID="player-back-btn" onPress={() => router.back()} style={styles.playerNavBtn}>
              <Ionicons name="chevron-back" size={24} color="#fff" />
            </TouchableOpacity>
            <View style={styles.topBarRight}>
              <TouchableOpacity style={styles.playerNavBtn}>
                <Ionicons name="settings-outline" size={20} color="#fff" />
              </TouchableOpacity>
            </View>
          </SafeAreaView>

          {/* Center play button */}
          <TouchableOpacity
            testID="play-pause-btn"
            onPress={() => setIsPlaying(!isPlaying)}
            style={styles.centerPlayBtn}
          >
            <View style={styles.playCircle}>
              <Ionicons name={isPlaying ? 'pause' : 'play'} size={36} color="#fff" />
            </View>
          </TouchableOpacity>

          {/* Bottom controls */}
          <View style={styles.bottomControls}>
            <Text style={styles.timeText}>{formatTime(progress)}</Text>
            <View style={styles.progressBar}>
              <LinearGradient
                colors={[Colors.brand.cyan, Colors.brand.pink]}
                start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                style={[styles.progressFill, { width: `${progress}%` }]}
              />
            </View>
            <Text style={styles.timeText}>24:00</Text>
          </View>
        </LinearGradient>
      </View>

      {/* Episode Info */}
      <View style={styles.infoSection}>
        <Text style={styles.animeTitle}>{decodedAnimeTitle}</Text>
        <Text style={styles.episodeTitle}>E{ep} · {decodedTitle}</Text>

        <View style={styles.actionRow}>
          <TouchableOpacity style={styles.actionButton}>
            <Ionicons name="thumbs-up-outline" size={22} color={Colors.text.secondary} />
            <Text style={styles.actionLabel}>Like</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionButton}>
            <Ionicons name="share-outline" size={22} color={Colors.text.secondary} />
            <Text style={styles.actionLabel}>Share</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionButton}>
            <Ionicons name="download-outline" size={22} color={Colors.text.secondary} />
            <Text style={styles.actionLabel}>Download</Text>
          </TouchableOpacity>
        </View>

        {/* Demo notice */}
        <View style={styles.demoNotice}>
          <LinearGradient colors={[Colors.brand.cyanDim, Colors.brand.pinkDim]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.demoGradient}>
            <Ionicons name="information-circle" size={18} color={Colors.brand.cyan} />
            <Text style={styles.demoText}>This is a demo player. Actual streaming requires licensing.</Text>
          </LinearGradient>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg.default },
  videoContainer: { width: SCREEN_WIDTH, height: SCREEN_WIDTH * 0.56, backgroundColor: '#000', position: 'relative' },
  videoImage: { width: '100%', height: '100%', opacity: 0.7 },
  videoOverlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, justifyContent: 'space-between' },
  topBar: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: Spacing.md },
  topBarRight: { flexDirection: 'row', gap: 8 },
  playerNavBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', alignItems: 'center' },
  centerPlayBtn: { alignSelf: 'center' },
  playCircle: {
    width: 64, height: 64, borderRadius: 32, backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: 'rgba(255,255,255,0.3)',
  },
  bottomControls: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: Spacing.md, paddingBottom: 12, gap: 8 },
  progressBar: { flex: 1, height: 4, backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 2, overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 2 },
  timeText: { fontSize: 12, color: 'rgba(255,255,255,0.7)', fontWeight: '500', minWidth: 36, textAlign: 'center' },
  infoSection: { padding: Spacing.md },
  animeTitle: { fontSize: 14, color: Colors.brand.cyan, fontWeight: '600', marginBottom: 4 },
  episodeTitle: { fontSize: 20, fontWeight: '700', color: Colors.text.primary, marginBottom: Spacing.md },
  actionRow: { flexDirection: 'row', gap: 32, paddingVertical: Spacing.md, borderBottomWidth: 1, borderBottomColor: Colors.border },
  actionButton: { alignItems: 'center', gap: 4 },
  actionLabel: { fontSize: 12, color: Colors.text.secondary },
  demoNotice: { marginTop: Spacing.lg, borderRadius: Radius.md, overflow: 'hidden' },
  demoGradient: { flexDirection: 'row', alignItems: 'center', gap: 8, padding: 14, borderRadius: Radius.md },
  demoText: { flex: 1, fontSize: 13, color: Colors.text.secondary, lineHeight: 18 },
});
