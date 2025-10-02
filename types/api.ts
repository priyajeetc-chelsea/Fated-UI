// API Request Types
export interface MatchRequest {
  userId: number;
  tagIds: number[];
  gender: string;
  intentions: string[];
  age_min: number;
  age_max: number;
  limit: number;
}

export interface SwipeRequest {
  takeId: number;
  swipeRight: boolean;
  comment?: string;
}

// API Response Types
export interface Tag {
  id: number;
  name: string;
  isSelected: boolean;
}

export interface TrendingTag {
  id: number;
  name: string;
}

// Raw API Opinion (from API response)
export interface RawApiOpinion {
  takeId: number;
  question: string;
  answer: string;
  tag: string; // Changed: tag is now a simple string, not an object
}

export interface ApiMatch {
  userId: number;
  firstName: string;
  opinions: RawApiOpinion[];
}


// New Potential Match Types
export interface PotentialMatchLike {
  userId: number;
  firstName: string;
  comment: string;
  likedOpinion: {
    id: number;
    question: string;
    answer: string;
  };
}

export interface PotentialMatchMutual {
  userId: number;
  firstName: string;
  comment: string;
  likedOpinion: {
    id: number;
    question: string;
    answer: string;
  };
  photoUrl: string;
}

export interface ApiPotentialMatches {
  likesYou: PotentialMatchLike[];
  mutualLike: PotentialMatchMutual[];
}

export interface ApiConfirmedMatch {
  userId: string;
  name: string;
  photoUrl: string;
  chatThreadId: string;
  lastActive: string;
}

export interface ApiAllMatchesResponse {
  code: number;
  msg: string;
  model: {
    confirmedMatches: {
      matches: ApiConfirmedMatch[];
    };
    potentialMatches: ApiPotentialMatches;
  };
}

// Legacy interface for backward compatibility
export interface MatchResponse {
  tags: {
    all: Tag[];
  };
  trendingTags: TrendingTag[];
  matches: {
    userId: number;
    firstName: string;
    age: number;
    gender: string;
    opinions: {
      takeId: number;
      question: string;
      answer: string;
      tag: {
        tagId: number;
        tagValue: string;
      };
    }[];
  }[];
  hasMore: boolean;
}

// Converted User type for the app
export interface ApiUser {
  id: string;
  name: string;
  age: number;
  gender: string;
  photo: string; // We'll generate this
  opinions: ApiOpinion[];
}

export interface ApiOpinion {
  id: string;
  question: string;
  text: string;
  theme: string;
  liked?: boolean;
}
