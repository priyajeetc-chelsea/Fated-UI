import { apiService } from '@/services/api';
import { useFocusEffect, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
    AppState,
    AppStateStatus,
    Image,
    RefreshControl,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

interface Match {
  id: string;
  name: string;
  photo: string;
  lastMessage: string;
  timestamp: string;
  unreadCount: number;
  isUnread: boolean;
}

export default function MatchesScreen() {
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const pollingIntervalRef = useRef<any>(null);
  const appStateRef = useRef<AppStateStatus>(AppState.currentState);
  const isScreenFocusedRef = useRef(true);

  const fetchMatches = useCallback(async () => {
    setError(null);
    try {
      const res = await apiService.fetchConfirmedMatches();
      
      const confirmedMatches = res.model?.matches || [];
      
      const confirmed = confirmedMatches.map((m: any) => {
        let displayMessage = m.lastMessage ? m.lastMessage.content : 'Say hello!';
        
        return {
          id: m.userId?.toString() ?? '',
          name: m.name ?? '',
          photo: m.photoUrl ?? '',
          lastMessage: displayMessage,
          timestamp: '',
          unreadCount: m.unreadCount ?? 0,
          isUnread: m.isUnread ?? false,
        };
      });
      setMatches(confirmed);
    } catch {
      setError('Failed to load matches.');
    }
  }, []);

  const hasMatchesChanged = useCallback((oldMatches: Match[], newMatches: Match[]) => {
    if (oldMatches.length !== newMatches.length) return true;
    
    return oldMatches.some((oldMatch, index) => {
      const newMatch = newMatches[index];
      return oldMatch.id !== newMatch.id ||
             oldMatch.lastMessage !== newMatch.lastMessage ||
             oldMatch.unreadCount !== newMatch.unreadCount ||
             oldMatch.isUnread !== newMatch.isUnread ||
             oldMatch.photo !== newMatch.photo;
    });
  }, []);

  const silentFetchMatches = useCallback(async () => {
    try {
      const res = await apiService.fetchConfirmedMatches();
      const confirmed = (res.model?.matches || []).map((m: any) => ({
        id: m.userId?.toString() ?? '',
        name: m.name ?? '',
        photo: m.photoUrl ?? '',
        lastMessage: m.lastMessage ? m.lastMessage.content : 'Say hello!',
        timestamp: '',
        unreadCount: m.unreadCount ?? 0,
        isUnread: m.isUnread ?? false,
      }));
      
      setMatches(prev => hasMatchesChanged(prev, confirmed) ? confirmed : prev);
    } catch (error) {
      console.error('Silent polling failed:', error);
    }
  }, [hasMatchesChanged]);

  const totalUnreadCount = matches.reduce((total, match) => total + match.unreadCount, 0);

  useEffect(() => {
    const loadInitialData = async () => {
      setLoading(true);
      await fetchMatches();
      setLoading(false);
    };
    loadInitialData();
  }, [fetchMatches]);

  useFocusEffect(
    useCallback(() => {
      isScreenFocusedRef.current = true;
      fetchMatches();
      
      return () => {
        isScreenFocusedRef.current = false;
      };
    }, [fetchMatches])
  );

  useEffect(() => {
    return () => {
      isScreenFocusedRef.current = false;
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
        pollingIntervalRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    const startPolling = () => {
      pollingIntervalRef.current = setInterval(() => {
        if (AppState.currentState === 'active' && isScreenFocusedRef.current) {
          silentFetchMatches();
        }
      }, 5000);
    };

    const timeoutId = setTimeout(startPolling, 3000);

    return () => {
      clearTimeout(timeoutId);
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
        pollingIntervalRef.current = null;
      }
    };
  }, [silentFetchMatches]);

  useEffect(() => {
    const handleAppStateChange = (nextAppState: AppStateStatus) => {
      if (appStateRef.current.match(/inactive|background/) && nextAppState === 'active') {
        if (isScreenFocusedRef.current) {
          silentFetchMatches();
        }
      }
      appStateRef.current = nextAppState;
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);
    return () => subscription?.remove();
  }, [silentFetchMatches]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchMatches();
    setRefreshing(false);
  }, [fetchMatches]);

  const renderMatchItem = (match: Match) => {
    const displayPhoto = match.photo && match.photo.trim() !== ''
      ? match.photo
      : `https://picsum.photos/200/200?random=${match.id}`;

    return (
      <TouchableOpacity 
        key={match.id} 
        style={styles.whatsappChatItem}
        onPress={() => {
          router.push({
            pathname: '/chat/[userId]',
            params: {
              userId: match.id,
              userName: match.name,
              userPhoto: displayPhoto,
              isFinalMatch: 'true',
              isPotentialMatch: 'false',
            },
          });
        }}
      >
        <View style={styles.chatPhotoContainer}>
          <Image source={{ uri: displayPhoto }} style={styles.chatPhoto} />
        </View>
        <View style={styles.chatContent}>
          <View style={styles.chatHeader}>
            <Text style={styles.chatName}>{match.name}</Text>
            <Text style={styles.chatTime}>{match.timestamp}</Text>
          </View>
          <View style={styles.chatMessageContainer}>
            <Text style={styles.chatMessage} numberOfLines={1}>
              {match.lastMessage}
            </Text>
            {match.isUnread && match.unreadCount > 0 && (
              <View style={styles.chatBadge}>
                <Text style={styles.chatBadgeText}>{match.unreadCount}</Text>
              </View>
            )}
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <Text style={styles.title}>Matches</Text>
          {totalUnreadCount > 0 && (
            <View style={styles.headerBadge}>
              <Text style={styles.headerBadgeText}>{totalUnreadCount}</Text>
            </View>
          )}
        </View>
      </View>

      {loading ? (
        <View style={styles.centerContainer}>
          <Text>Loading...</Text>
        </View>
      ) : error ? (
        <View style={styles.centerContainer}>
          <Text style={{ color: 'red' }}>{error}</Text>
        </View>
      ) : (
        <ScrollView 
          style={styles.content}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={['#004242']}
              tintColor="#004242"
            />
          }
        >
          <View style={styles.matchesList}>
            {matches.length === 0 ? (
              <Text style={styles.emptyText}>No matches found.</Text>
            ) : (
              matches.map(renderMatchItem)
            )}
          </View>
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontFamily:'Playfair Display Bold',
    color: '#004242',
  },
  headerBadge: {
    backgroundColor: '#ff4444',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
    marginLeft: 10,
  },
  headerBadgeText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  centerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    flex: 1,
  },
  matchesList: {
    paddingVertical: 10,
  },
  emptyText: {
    textAlign: 'center',
    marginTop: 20,
    color: '#666',
  },
  whatsappChatItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#ffffff',
    borderBottomWidth: 0.5,
    borderBottomColor: '#E5E5E5',
  },
  chatPhotoContainer: {
    marginRight: 12,
  },
  chatPhoto: {
    width: 56,
    height: 56,
    borderRadius: 28,
  },
  chatContent: {
    flex: 1,
    justifyContent: 'center',
  },
  chatHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  chatName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000000',
  },
  chatTime: {
    fontSize: 12,
    color: '#999999',
  },
  chatMessageContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  chatMessage: {
    fontSize: 14,
    color: '#666666',
    flex: 1,
    marginRight: 8,
  },
  chatBadge: {
    backgroundColor: '#004242',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
  },
  chatBadgeText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '600',
  },
});
