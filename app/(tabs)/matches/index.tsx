import { PotentialMatchModal } from '@/components/potential-match-modal';
import { apiService } from '@/services/api';
import { PotentialMatchLike, PotentialMatchMutual } from '@/types/api';
import { Ionicons } from '@expo/vector-icons';
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

type SelectedPotentialMatch = {
  id: string;
  name: string;
  photo?: string;
  type: 'likesYou' | 'mutualLike';
  likedOpinion: {
    id: string;
    content: string;
    comment?: string;
  };
  waitingForMatchResponse?: boolean;
};


type PotentialMatchDisplay =
  | ({ type: 'likesYou'; data: PotentialMatchLike & { unreadCount: number; isUnread: boolean; lastMessage?: { id: number; content: string } } })
  | ({ type: 'mutualLike'; data: PotentialMatchMutual & { unreadCount: number; isUnread: boolean; lastMessage?: { id: number; content: string } } });

export default function MatchesScreen() {
  const [activeTab, setActiveTab] = useState<'matches' | 'potential'>('matches');
  const [selectedPotentialMatch, setSelectedPotentialMatch] = useState<SelectedPotentialMatch | null>(null);
  const [matches, setMatches] = useState<Match[]>([]);
  const [potentialMatches, setPotentialMatches] = useState<PotentialMatchDisplay[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  // Refs for polling management
  const pollingIntervalRef = useRef<any>(null);
  const appStateRef = useRef<AppStateStatus>(AppState.currentState);
  const isScreenFocusedRef = useRef(true);

  const fetchMatches = useCallback(async () => {
    setError(null);
    try {
      const res = await apiService.fetchAllMatches();
      
      // Temporary debugging to understand the issue
      const confirmedMatches = res.model?.confirmedMatches?.matches || [];
      const potentialMatches = res.model?.potentialMatches?.mutualLike || [];
      
      if (confirmedMatches.length > 0 && potentialMatches.length > 0) {
        const firstConfirmed = confirmedMatches[0];
        const firstPotential = potentialMatches[0] as any;
        
        if (firstConfirmed.lastMessage?.content === firstPotential.lastMessage?.content) {
          console.warn('⚠️ DUPLICATE MESSAGE DETECTED:', {
            confirmed: `${firstConfirmed.name} (${firstConfirmed.userId}): "${firstConfirmed.lastMessage?.content}"`,
            potential: `${firstPotential.firstName} (${firstPotential.userId}): "${firstPotential.lastMessage?.content}"`,
            messageIds: {
              confirmed: firstConfirmed.lastMessage?.id,
              potential: firstPotential.lastMessage?.id
            }
          });
        }
      }
      
      // Map confirmedMatches with duplicate message detection
      const confirmed = (res.model?.confirmedMatches?.matches || []).map((m: any) => {
        let displayMessage = m.lastMessage ? m.lastMessage.content : 'Say hello!';
        
        return {
          id: m.userId?.toString() ?? '',
          name: m.name ?? '',
          photo: m.photoUrl ?? '',
          lastMessage: displayMessage,
          timestamp: '', // timestamp not provided in new API
          unreadCount: m.unreadCount ?? 0,
          isUnread: m.isUnread ?? false,
          originalMessageId: m.lastMessage?.id, // Keep track of original message ID
        };
      });
      setMatches(confirmed);
      // likesYou (locked) - add unread count logic
      const likesYou: PotentialMatchDisplay[] = (res.model?.potentialMatches?.likesYou || []).map((pm) => ({
        type: 'likesYou',
        data: {
          ...pm,
          // Use actual API values for unread count, isUnread, and lastMessage
          unreadCount: (pm as any).unreadCount ?? 0,
          isUnread: (pm as any).isUnread ?? false,
          lastMessage: (pm as any).lastMessage ?? null,
        },
      }));
      // mutualLike (show photo) - add unread count logic with duplicate detection
      const mutualLike: PotentialMatchDisplay[] = (res.model?.potentialMatches?.mutualLike || []).map((pm) => ({
        type: 'mutualLike',
        data: {
          ...pm,
          // Use actual API values for unread count, isUnread, and lastMessage
          unreadCount: (pm as any).unreadCount ?? 0,
          isUnread: (pm as any).isUnread ?? false,
          lastMessage: (pm as any).lastMessage ?? null,
          originalMessageId: (pm as any).lastMessage?.id, // Keep track of original message ID
        },
      }));
      setPotentialMatches([...likesYou, ...mutualLike]);
    } catch {
      setError('Failed to load matches.');
    }
  }, []);

  // Silent fetch for polling (doesn't show errors)
  const silentFetchMatches = useCallback(async () => {
    try {
      const res = await apiService.fetchAllMatches();
      const confirmed = (res.model?.confirmedMatches?.matches || []).map((m: any) => ({
        id: m.userId?.toString() ?? '',
        name: m.name ?? '',
        photo: m.photoUrl ?? '',
        lastMessage: m.lastMessage ? m.lastMessage.content : 'Say hello!',
        timestamp: '',
        unreadCount: m.unreadCount ?? 0,
        isUnread: m.isUnread ?? false,
      }));
      setMatches(confirmed);
      
      const likesYou: PotentialMatchDisplay[] = (res.model?.potentialMatches?.likesYou || []).map((pm) => ({
        type: 'likesYou',
        data: {
          ...pm,
          // Use actual API values for unread count, isUnread, and lastMessage
          unreadCount: (pm as any).unreadCount ?? 0,
          isUnread: (pm as any).isUnread ?? false,
          lastMessage: (pm as any).lastMessage ?? null,
        },
      }));
      const mutualLike: PotentialMatchDisplay[] = (res.model?.potentialMatches?.mutualLike || []).map((pm) => ({
        type: 'mutualLike',
        data: {
          ...pm,
          // Use actual API values for unread count, isUnread, and lastMessage
          unreadCount: (pm as any).unreadCount ?? 0,
          isUnread: (pm as any).isUnread ?? false,
          lastMessage: (pm as any).lastMessage ?? null,
        },
      }));
      setPotentialMatches([...likesYou, ...mutualLike]);
    } catch (error) {
      // Silent fail for polling
      console.error('Silent polling failed:', error);
    }
  }, []);

  // Calculate total unread count for confirmed matches
  const totalUnreadCount = matches.reduce((total, match) => total + match.unreadCount, 0);
  
  // Calculate total unread count for potential matches
  const potentialUnreadCount = potentialMatches.reduce((total, pm) => {
    // If chat has started (lastMessage exists), use actual unreadCount
    if (pm.data.lastMessage) {
      return total + pm.data.unreadCount;
    }
    // If chat has not started, count as 1 (liked opinion indicator)
    return total + 1;
  }, 0);

  // Initial load
  useEffect(() => {
    const loadInitialData = async () => {
      setLoading(true);
      await fetchMatches();
      setLoading(false);
    };
    loadInitialData();
  }, [fetchMatches]);

  // Reload when screen comes into focus (e.g., when coming back from user profile)
  useFocusEffect(
    useCallback(() => {
      isScreenFocusedRef.current = true;
      fetchMatches();
      
      return () => {
        isScreenFocusedRef.current = false;
      };
    }, [fetchMatches])
  );

  // Set screen as not focused when component unmounts
  useEffect(() => {
    return () => {
      isScreenFocusedRef.current = false;
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
        pollingIntervalRef.current = null;
      }
    };
  }, []);

  // Start polling for real-time updates
  useEffect(() => {
    const startPolling = () => {
      pollingIntervalRef.current = setInterval(() => {
        // Only poll when app is active and screen is focused
        if (AppState.currentState === 'active' && isScreenFocusedRef.current) {
          silentFetchMatches();
        }
      }, 5000); // Poll every 5 seconds
    };

    // Start polling after initial load
    const timeoutId = setTimeout(startPolling, 3000); // Start after 3 seconds

    return () => {
      clearTimeout(timeoutId);
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
        pollingIntervalRef.current = null;
      }
    };
  }, [silentFetchMatches]);

  // Handle app state changes
  useEffect(() => {
    const handleAppStateChange = (nextAppState: AppStateStatus) => {
      if (appStateRef.current.match(/inactive|background/) && nextAppState === 'active') {
        // App came to foreground - refresh matches if screen is focused
        if (isScreenFocusedRef.current) {
          silentFetchMatches();
        }
      }
      appStateRef.current = nextAppState;
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);
    return () => subscription?.remove();
  }, [silentFetchMatches]);

  // Handle pull-to-refresh
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchMatches();
    setRefreshing(false);
  }, [fetchMatches]);

  const renderMatchItem = (match: Match) => (
    <TouchableOpacity 
      key={match.id} 
      style={styles.whatsappChatItem}
      onPress={() => {
        router.push({
          pathname: '/chat/[userId]',
          params: {
            userId: match.id,
            userName: match.name,
            userPhoto: match.photo,
            matchUserId: match.id, // For profile navigation
            isFinalMatch: 'true',
            isPotentialMatch: 'false',
          },
        });
      }}
    >
      <View style={styles.chatPhotoContainer}>
        <Image source={{ uri:`https://picsum.photos/200/200?random=${match.id}` }} style={styles.chatPhoto} />
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

  const renderPotentialMatchItem = (pm: PotentialMatchDisplay) => {
    if (pm.type === 'likesYou') {
      return (
        <TouchableOpacity
          key={`likesYou-${pm.data.userId}`}
          style={styles.whatsappChatItem}
          onPress={() => {
            // For likesYou, we could either show modal or go to chat
            // Let's provide both options - tap for modal, long press for chat
            setSelectedPotentialMatch({
              id: pm.data.userId.toString(),
              name: pm.data.firstName,
              type: 'likesYou',
              likedOpinion: {
                id: pm.data.likedOpinion.id.toString(),
                content: pm.data.likedOpinion.answer,
                comment: pm.data.comment,
              },
              waitingForMatchResponse: pm.data.waitingForMatchResponse,
            });
          }}

        >
          <View style={styles.chatPhotoContainer}>
            <View style={styles.lockedChatPhoto}>
              <Ionicons name="lock-closed" size={26} color="#333" />
            </View>
          </View>
          <View style={styles.chatContent}>
            <View style={styles.chatHeader}>
              <View style={styles.nameWithBadge}>
                <Text style={styles.chatName}>{pm.data.firstName}</Text>
                {/* <View style={styles.lockedInlineBadge}>
                  <Text style={styles.lockedInlineText}>LOCKED</Text>
                </View> */}
              </View>
              {/* <Text style={styles.chatTime}>now</Text> */}
            </View>
            <View style={styles.chatMessageContainer}>
              <Text style={styles.chatMessage} numberOfLines={1}>
                {pm.data.lastMessage 
                  ? pm.data.lastMessage.content
                  : `"${pm.data.likedOpinion.answer.substring(0, 40)}..."`
                }
              </Text>
              {(pm.data.lastMessage ? pm.data.unreadCount > 0 : true) && (
                <View style={styles.chatBadge}>
                  <Text style={styles.chatBadgeText}>
                    {pm.data.lastMessage ? pm.data.unreadCount : 1}
                  </Text>
                </View>
              )}
            </View>
          </View>
        </TouchableOpacity>
      );
    } else {
      return (
        <TouchableOpacity
          key={`mutualLike-${pm.data.userId}`}
          style={styles.whatsappChatItem}
          onPress={() => {
            // Show profile modal for mutual likes (main tap action)
            setSelectedPotentialMatch({
              id: pm.data.userId.toString(),
              name: pm.data.firstName,
              photo: `https://picsum.photos/200/200?random=${pm.data.userId}` || pm.data.photoUrl,
              type: 'mutualLike',
              likedOpinion: {
                id: pm.data.likedOpinion.id.toString(),
                content: pm.data.likedOpinion.answer,
                comment: pm.data.comment,
              },
              waitingForMatchResponse: pm.data.waitingForMatchResponse,
            });
          }}
        >
          <View style={styles.chatPhotoContainer}>
            {pm.data.photoUrl && pm.data.photoUrl.trim() !== '' ? (
              <Image 
                source={{ uri:`https://picsum.photos/200/200?random=${pm.data.userId}` || pm.data.photoUrl }} 
                style={styles.chatPhoto}
                onError={() => {
                  console.log('Photo failed to load for user:', pm.data.userId);
                }}
              />
            ) : (
              <View style={styles.chatPlaceholderPhoto}>
                <Ionicons name="person" size={28} color="#999" />
              </View>
            )}
          </View>
          <View style={styles.chatContent}>
            <View style={styles.chatHeader}>
              <View style={styles.nameWithBadge}>
                <Text style={styles.chatName}>{pm.data.firstName}</Text>
                {/* <View style={styles.mutualInlineBadge}>
                  <Text style={styles.mutualInlineText}>mutual</Text>
                </View> */}
              </View>
              {/* <Text style={styles.chatTime}>now</Text> */}
            </View>
            <View style={styles.chatMessageContainer}>
              <Text style={styles.chatMessage} numberOfLines={1}>
                {pm.data.lastMessage 
                  ? pm.data.lastMessage.content 
                  : `"${pm.data.likedOpinion.answer.substring(0, 40)}..."`
                }
              </Text>
              {(pm.data.lastMessage ? pm.data.unreadCount > 0 : true) && (
                <View style={styles.chatBadge}>
                  <Text style={styles.chatBadgeText}>
                    {pm.data.lastMessage ? pm.data.unreadCount : 1}
                  </Text>
                </View>
              )}
            </View>
          </View>
        </TouchableOpacity>
      );
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      {/* Tab Selector */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'matches' && styles.activeTab]}
          onPress={() => setActiveTab('matches')}
        >
          <View style={styles.tabContent}>
            <Text style={[styles.tabText, activeTab === 'matches' && styles.activeTabText]}>
              Matches
            </Text>
            {totalUnreadCount > 0 && (
              <View style={styles.notificationBadge}>
                <Text style={styles.badgeText}>{totalUnreadCount}</Text>
              </View>
            )}
          </View>
        </TouchableOpacity>
        <View style={styles.separator} />
        <TouchableOpacity
          style={[styles.tab, activeTab === 'potential' && styles.activeTab]}
          onPress={() => setActiveTab('potential')}
        >
          <View style={styles.tabContent}>
            <Text style={[styles.tabText, activeTab === 'potential' && styles.activeTabText]}>
              Potential Matches
            </Text>
            {potentialUnreadCount > 0 && (
              <View style={styles.notificationBadge}>
                <Text style={styles.badgeText}>{potentialUnreadCount}</Text>
              </View>
            )}
          </View>
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <Text>Loading...</Text>
        </View>
      ) : error ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <Text style={{ color: 'red' }}>{error}</Text>
        </View>
      ) : (
        <ScrollView 
          style={styles.content}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={['#9966CC']} // Android
              tintColor="#9966CC" // iOS
            />
          }
        >
          {activeTab === 'matches' ? (
            <View style={styles.matchesList}>
              {matches.length === 0 ? (
                <Text style={{ textAlign: 'center', marginTop: 20 }}>No matches found.</Text>
              ) : (
                matches.map(renderMatchItem)
              )}
            </View>
          ) : (
            <View style={styles.potentialMatchesList}>
              {potentialMatches.length === 0 ? (
                <Text style={{ textAlign: 'center', marginTop: 20 }}>No potential matches found.</Text>
              ) : (
                potentialMatches.map(renderPotentialMatchItem)
              )}
            </View>
          )}
        </ScrollView>
      )}

      <PotentialMatchModal
        visible={selectedPotentialMatch !== null}
        potentialMatch={selectedPotentialMatch}
        onClose={() => {
          setSelectedPotentialMatch(null);
          // Reload matches when modal closes
          fetchMatches();
        }}
        onLikeOpinion={async (matchUserId) => {
          // For likesYou users - show their opinions first
          const matchDisplay = potentialMatches.find(pm => {
            if (pm.type === 'likesYou') {
              return pm.data.userId.toString() === matchUserId;
            }
            return false;
          });
          if (!matchDisplay) return;
          const matchData = matchDisplay.data;
          try {
            const opinionsResponse = await apiService.fetchUserOpinions(Number(matchUserId));
            const opinions = Array.isArray(opinionsResponse.model?.opinions)
              ? opinionsResponse.model.opinions.map((op: any) => ({
                  takeId: op.takeId ?? 0,
                  question: op.question ?? '',
                  answer: op.answer ?? '',
                  tag: op.tag ?? { id: 0, name: '' },
                }))
              : [];
            router.push({
              pathname: '/matches/potential-match-home',
              params: {
                userName: matchData.firstName,
                opinions: JSON.stringify(opinions),
                fromMatches: 'true', // Flag to know we came from matches
              },
            });
          } catch {
            // fallback to likedOpinion if API fails
            router.push({
              pathname: '/matches/potential-match-home',
              params: {
                userName: matchData.firstName,
                opinions: JSON.stringify([
                  {
                    question: matchData.likedOpinion.question,
                    answer: matchData.likedOpinion.answer,
                    tag: { id: 0, name: '' },
                  },
                ]),
                fromMatches: 'true',
              },
            });
          }
        }}
        onLikeProfile={async (matchUserId) => {
          // For mutualLike users - go directly to user profile page
          const matchDisplay = potentialMatches.find(pm => {
            if (pm.type === 'mutualLike') {
              return pm.data.userId.toString() === matchUserId;
            }
            return false;
          });
          if (!matchDisplay) return;
          
          router.push({
            pathname: '/matches/user-profile-page',
            params: { 
              userBId: matchUserId,
              fromMatches: 'true', // Flag to know we came from matches
            }
          });
        }}
      />
      {/* Removed unused OpinionModal */}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#fff',
  },
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  title: {
    fontSize: 28,
    fontWeight: '600',
    color: '#000',
  },
  tabContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    backgroundColor: '#fff',
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 10,
  },
  tabContent: {
    alignItems: 'center',
    position: 'relative',
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: '#000',
  },
  tabText: {
    fontSize: 15,
    color: '#999',
    fontWeight: '500',
  },
  activeTabText: {
    color: '#000',
    fontWeight: '600',
  },
  notificationBadge: {
    position: 'absolute',
    top: -14,
    right: -12,
    backgroundColor: '#ff4444',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
  },
  badgeText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  separator: {
    width: 3,
    backgroundColor: '#f0f0f0',
    marginHorizontal: 5,
  },
  content: {
    flex: 1,
  },
  matchesList: {
    paddingVertical: 10,
  },
  matchItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#f8f8f8',
  },
  matchPhoto: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 15,
  },
  matchInfo: {
    flex: 1,
  },
  matchName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
    marginBottom: 4,
  },
  lastMessage: {
    fontSize: 14,
    color: '#666',
  },
  timestamp: {
    fontSize: 12,
    color: '#999',
  },
  potentialMatchesList: {
    paddingVertical: 10,
  },
  potentialMatchItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#f8f8f8',
  },
  hiddenPhoto: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#9966CC',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 15,
  },
  lockedPhotoContainer: {
    position: 'relative',
    marginRight: 15,
  },
  lockedOverlay: {
    position: 'absolute',
    bottom: -8,
    left: 0,
    right: 0,
    backgroundColor: '#9966CC',
    borderRadius: 8,
    paddingHorizontal: 4,
    paddingVertical: 2,
    alignItems: 'center',
  },
  lockedText: {
    color: '#ffffff',
    fontSize: 8,
    fontWeight: '600',
  },
  lockHint: {
    fontSize: 12,
    color: '#9966CC',
    fontWeight: '500',
    marginTop: 2,
  },
  photoContainer: {
    position: 'relative',
    marginRight: 15,
  },
  placeholderPhoto: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#f0f0f0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  mutualBadge: {
    position: 'absolute',
    bottom: -8,
    left: 0,
    right: 0,
    backgroundColor: '#4CAF50',
    borderRadius: 8,
    paddingHorizontal: 4,
    paddingVertical: 2,
    alignItems: 'center',
  },
  mutualText: {
    color: '#ffffff',
    fontSize: 8,
    fontWeight: '600',
  },
  mutualHint: {
    fontSize: 12,
    color: '#4CAF50',
    fontWeight: '500',
    marginTop: 2,
  },
  // WhatsApp-style chat interface for mutual likes
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
  chatPlaceholderPhoto: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#f0f0f0',
    alignItems: 'center',
    justifyContent: 'center',
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
  nameWithBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  userImageContainer: {
    marginRight: 6,
  },
  userImageSmall: {
    width: 20,
    height: 20,
    borderRadius: 10,
  },
  userImagePlaceholder: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#f0f0f0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  chatName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000000',
    marginRight: 8,
  },
  mutualInlineBadge: {
    backgroundColor: '#9966CC',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  mutualInlineText: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: '600',
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
    backgroundColor: '#9966CC',
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
  // Locked chat photo styles
  lockedChatPhoto: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#f5f5f5f5',
    borderWidth: 1,
    borderColor: '#9966CC',
    alignItems: 'center',
    justifyContent: 'center',
  },
  lockedInlineBadge: {
    backgroundColor: '#666666',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  lockedInlineText: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: '600',
  },
  potentialMatchInfo: {
    flex: 1,
  },
  potentialMatchName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
    marginBottom: 4,
  },
  likedOpinionPreview: {
    fontSize: 14,
    color: '#666',
    fontStyle: 'italic',
  },

});