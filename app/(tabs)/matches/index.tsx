// import OpinionModal from '@/components/opinion-modal';
import { PotentialMatchModal } from '@/components/potential-match-modal';
import { apiService } from '@/services/api';
import { PotentialMatchLike, PotentialMatchMutual } from '@/types/api';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  Image,
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
}

type SelectedPotentialMatch = {
  id: string;
  name: string;
  photo?: string;
  likedOpinion: {
    id: string;
    content: string;
    comment?: string;
  };
};


type PotentialMatchDisplay =
  | ({ type: 'likesYou'; data: PotentialMatchLike })
  | ({ type: 'mutualLike'; data: PotentialMatchMutual });

export default function MatchesScreen() {
  const [activeTab, setActiveTab] = useState<'matches' | 'potential'>('matches');
  const [selectedPotentialMatch, setSelectedPotentialMatch] = useState<SelectedPotentialMatch | null>(null);
  const [matches, setMatches] = useState<Match[]>([]);
  const [potentialMatches, setPotentialMatches] = useState<PotentialMatchDisplay[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  // Removed unused showOpinionModal state
  // Removed unused modalOpinion and modalUserName
  const router = useRouter();

  useEffect(() => {
    const fetchMatches = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await apiService.fetchAllMatches();
        // Map confirmedMatches
        const confirmed = (res.model?.confirmedMatches?.matches || []).map((m: any) => ({
          id: m.userId?.toString() ?? '',
          name: m.name ?? '',
          photo: m.photoUrl ?? '',
          lastMessage: '', // API does not provide lastMessage
          timestamp: m.lastActive ?? '',
        }));
        setMatches(confirmed);
        // likesYou (locked)
        const likesYou: PotentialMatchDisplay[] = (res.model?.potentialMatches?.likesYou || []).map((pm) => ({
          type: 'likesYou',
          data: pm,
        }));
        // mutualLike (show photo)
        const mutualLike: PotentialMatchDisplay[] = (res.model?.potentialMatches?.mutualLike || []).map((pm) => ({
          type: 'mutualLike',
          data: pm,
        }));
        setPotentialMatches([...likesYou, ...mutualLike]);
      } catch {
        setError('Failed to load matches.');
      } finally {
        setLoading(false);
      }
    };
    fetchMatches();
  }, []);

  const renderMatchItem = (match: Match) => (
    <TouchableOpacity key={match.id} style={styles.matchItem}>
      <Image source={{ uri: match.photo }} style={styles.matchPhoto} />
      <View style={styles.matchInfo}>
        <Text style={styles.matchName}>{match.name}</Text>
        <Text style={styles.lastMessage}>{match.lastMessage}</Text>
      </View>
      <Text style={styles.timestamp}>{match.timestamp}</Text>
    </TouchableOpacity>
  );

  const renderPotentialMatchItem = (pm: PotentialMatchDisplay) => {
    if (pm.type === 'likesYou') {
      return (
        <TouchableOpacity
          key={`likesYou-${pm.data.userId}`}
          style={styles.potentialMatchItem}
          onPress={() => setSelectedPotentialMatch({
            id: pm.data.userId.toString(),
            name: pm.data.firstName,
            likedOpinion: {
              id: pm.data.likedOpinion.id.toString(),
              content: pm.data.likedOpinion.answer,
              comment: pm.data.comment,
            },
          })}
        >
          <View style={styles.hiddenPhoto}>
            <Ionicons name="lock-closed" size={32} color="#9966CC" />
          </View>
          <View style={styles.potentialMatchInfo}>
            <Text style={styles.potentialMatchName}>{pm.data.firstName}</Text>
            <Text style={styles.likedOpinionPreview} numberOfLines={2}>
              Liked: &quot;{pm.data.likedOpinion.answer.substring(0, 60)}...&quot;
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#999" />
        </TouchableOpacity>
      );
    } else {
      return (
        <TouchableOpacity
          key={`mutualLike-${pm.data.userId}`}
          style={styles.potentialMatchItem}
          onPress={() => setSelectedPotentialMatch({
            id: pm.data.userId.toString(),
            name: pm.data.firstName,
            photo: pm.data.photoUrl,
            likedOpinion: {
              id: pm.data.likedOpinion.id.toString(),
              content: pm.data.likedOpinion.answer,
              comment: pm.data.comment,
            },
          })}
        >
          {pm.data.photoUrl && pm.data.photoUrl.trim() !== '' ? (
            <Image source={{ uri: pm.data.photoUrl }} style={styles.matchPhoto} />
          ) : (
            <Image 
              source={{ uri: `https://picsum.photos/200/200?random=${pm.data.userId}` }} 
              style={styles.matchPhoto} 
            />
          )}
          <View style={styles.potentialMatchInfo}>
            <Text style={styles.potentialMatchName}>{pm.data.firstName}</Text>
            <Text style={styles.likedOpinionPreview} numberOfLines={2}>
              Liked: &quot;{pm.data.likedOpinion.answer.substring(0, 60)}...&quot;
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#999" />
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
          <Text style={[styles.tabText, activeTab === 'matches' && styles.activeTabText]}>
            Matches
          </Text>
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
            {potentialMatches.length > 0 && (
              <View style={styles.notificationBadge}>
                <Text style={styles.badgeText}>{potentialMatches.length}</Text>
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
        <ScrollView style={styles.content}>
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
        onClose={() => setSelectedPotentialMatch(null)}
        onLikeOpinion={async (matchUserId) => {
          // Find the match in either likesYou or mutualLike
          const matchDisplay = potentialMatches.find(pm => {
            if (pm.type === 'likesYou' || pm.type === 'mutualLike') {
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
              },
            });
          }
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
    fontWeight: 'bold',
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
    backgroundColor: '#f0f0f0',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 15,
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