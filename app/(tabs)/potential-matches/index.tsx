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

export default function PotentialMatchesScreen() {
  const [selectedPotentialMatch, setSelectedPotentialMatch] = useState<SelectedPotentialMatch | null>(null);
  const [potentialMatches, setPotentialMatches] = useState<PotentialMatchDisplay[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const pollingIntervalRef = useRef<any>(null);
  const appStateRef = useRef<AppStateStatus>(AppState.currentState);
  const isScreenFocusedRef = useRef(true);

  const fetchPotentialMatches = useCallback(async () => {
    setError(null);
    try {
      const res = await apiService.fetchAllMatches();
      
      const likesYou: PotentialMatchDisplay[] = (res.model?.potentialMatches?.likesYou || []).map((pm) => ({
        type: 'likesYou',
        data: {
          ...pm,
          unreadCount: (pm as any).unreadCount ?? 0,
          isUnread: (pm as any).isUnread ?? false,
          lastMessage: (pm as any).lastMessage ?? null,
        },
      }));

      const mutualLike: PotentialMatchDisplay[] = (res.model?.potentialMatches?.mutualLike || []).map((pm) => ({
        type: 'mutualLike',
        data: {
          ...pm,
          unreadCount: (pm as any).unreadCount ?? 0,
          isUnread: (pm as any).isUnread ?? false,
          lastMessage: (pm as any).lastMessage ?? null,
          originalMessageId: (pm as any).lastMessage?.id,
        },
      }));

      setPotentialMatches([...likesYou, ...mutualLike]);
    } catch {
      setError('Failed to load potential matches.');
    }
  }, []);

  const hasPotentialMatchesChanged = useCallback((oldMatches: PotentialMatchDisplay[], newMatches: PotentialMatchDisplay[]) => {
    if (oldMatches.length !== newMatches.length) return true;
    
    return oldMatches.some((oldMatch, index) => {
      const newMatch = newMatches[index];
      if (oldMatch.type !== newMatch.type) return true;
      
      const oldData = oldMatch.data;
      const newData = newMatch.data;
      
      return oldData.userId !== newData.userId ||
             oldData.unreadCount !== newData.unreadCount ||
             oldData.isUnread !== newData.isUnread ||
             oldData.lastMessage?.id !== newData.lastMessage?.id ||
             oldData.lastMessage?.content !== newData.lastMessage?.content;
    });
  }, []);

  const silentFetchPotentialMatches = useCallback(async () => {
    try {
      const res = await apiService.fetchAllMatches();
      
      const likesYou: PotentialMatchDisplay[] = (res.model?.potentialMatches?.likesYou || []).map((pm) => ({
        type: 'likesYou',
        data: {
          ...pm,
          unreadCount: (pm as any).unreadCount ?? 0,
          isUnread: (pm as any).isUnread ?? false,
          lastMessage: (pm as any).lastMessage ?? null,
        },
      }));

      const mutualLike: PotentialMatchDisplay[] = (res.model?.potentialMatches?.mutualLike || []).map((pm) => ({
        type: 'mutualLike',
        data: {
          ...pm,
          unreadCount: (pm as any).unreadCount ?? 0,
          isUnread: (pm as any).isUnread ?? false,
          lastMessage: (pm as any).lastMessage ?? null,
        },
      }));
      
      const newPotentialMatches = [...likesYou, ...mutualLike];
      setPotentialMatches(prev => hasPotentialMatchesChanged(prev, newPotentialMatches) ? newPotentialMatches : prev);
    } catch (error) {
      console.error('Silent polling failed:', error);
    }
  }, [hasPotentialMatchesChanged]);

  const potentialUnreadCount = potentialMatches.reduce((total, pm) => {
    if (pm.data.lastMessage) {
      return total + pm.data.unreadCount;
    }
    return total + 1;
  }, 0);

  useEffect(() => {
    const loadInitialData = async () => {
      setLoading(true);
      await fetchPotentialMatches();
      setLoading(false);
    };
    loadInitialData();
  }, [fetchPotentialMatches]);

  useFocusEffect(
    useCallback(() => {
      isScreenFocusedRef.current = true;
      fetchPotentialMatches();
      
      return () => {
        isScreenFocusedRef.current = false;
      };
    }, [fetchPotentialMatches])
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
          silentFetchPotentialMatches();
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
  }, [silentFetchPotentialMatches]);

  useEffect(() => {
    const handleAppStateChange = (nextAppState: AppStateStatus) => {
      if (appStateRef.current.match(/inactive|background/) && nextAppState === 'active') {
        if (isScreenFocusedRef.current) {
          silentFetchPotentialMatches();
        }
      }
      appStateRef.current = nextAppState;
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);
    return () => subscription?.remove();
  }, [silentFetchPotentialMatches]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchPotentialMatches();
    setRefreshing(false);
  }, [fetchPotentialMatches]);

  const renderPotentialMatchItem = (pm: PotentialMatchDisplay) => {
    if (pm.type === 'likesYou') {
      return (
        <TouchableOpacity
          key={`likesYou-${pm.data.userId}`}
          style={styles.whatsappChatItem}
          onPress={() => {
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
              </View>
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
      const displayPhoto = '';

      return (
        <TouchableOpacity
          key={`mutualLike-${pm.data.userId}`}
          style={styles.whatsappChatItem}
          onPress={() => {
            setSelectedPotentialMatch({
              id: pm.data.userId.toString(),
              name: pm.data.firstName,
              photo: displayPhoto,
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
                source={{ uri: displayPhoto }} 
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
              </View>
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
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <Text style={styles.title}>Potential Matches</Text>
          {potentialUnreadCount > 0 && (
            <View style={styles.headerBadge}>
              <Text style={styles.headerBadgeText}>{potentialUnreadCount}</Text>
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
          <View style={styles.potentialMatchesList}>
            {potentialMatches.length === 0 ? (
              <Text style={styles.emptyText}>No potential matches found.</Text>
            ) : (
              potentialMatches.map(renderPotentialMatchItem)
            )}
          </View>
        </ScrollView>
      )}

      <PotentialMatchModal
        visible={selectedPotentialMatch !== null}
        potentialMatch={selectedPotentialMatch}
        onClose={() => {
          setSelectedPotentialMatch(null);
          fetchPotentialMatches();
        }}
        onLikeOpinion={async (matchUserId) => {
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
              pathname: '/potential-matches/potential-match-home',
              params: {
                userName: matchData.firstName,
                opinions: JSON.stringify(opinions),
                fromMatches: 'true',
              },
            });
          } catch {
            router.push({
              pathname: '/potential-matches/potential-match-home',
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
          const matchDisplay = potentialMatches.find(pm => {
            if (pm.type === 'mutualLike') {
              return pm.data.userId.toString() === matchUserId;
            }
            return false;
          });
          if (!matchDisplay) return;
          
          router.push({
            pathname: '/potential-matches/user-profile-page',
            params: { 
              userBId: matchUserId,
              fromMatches: 'true',
            }
          });
        }}
      />
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
  potentialMatchesList: {
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
  chatName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000000',
    marginRight: 8,
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
  lockedChatPhoto: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#f5f5f5f5',
    borderWidth: 1,
    borderColor: '#004242',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
