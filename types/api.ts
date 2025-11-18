// API Request Types
export interface MatchRequest {
  tagIds: number[];
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
  waitingForMatchResponse?: boolean;
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
  waitingForMatchResponse?: boolean;
}

export interface ApiPotentialMatches {
  likesYou: PotentialMatchLike[];
  mutualLike: PotentialMatchMutual[];
}

export interface LastMessage {
  id: number;
  content: string;
}

export interface ApiConfirmedMatch {
  matchId: number;
  userId: number;
  name: string;
  photoUrl: string;
  lastMessage: LastMessage | null;
  unreadCount: number;
  isUnread: boolean;
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
  userId?: number; // Current user's ID from the API response
  tags: {
    all: Tag[];
  };
  trendingTags?: TrendingTag[];
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
  }[] | null; // Can be null during onboarding
  hasMore: boolean;
  onboardingStep?: {
    step: number;
    description: string;
  };
}

// Converted User type for the app
export interface ApiUser {
  id: string;
  name: string;
  age: number;
  gender: string;
  photo: string; // We'll generate this
  opinions: ApiOpinion[];
  profileData?: {
    fname: string;
    lname: string;
    sexuality: string;
    pronouns: string;
    homeTown: string;
    currentCity: string;
    jobDetails: string;
    college: string;
    highestEducationLevel: string;
    religiousBeliefs: string;
    drinkOrSmoke: string;
    height: string;
    photoUrls: string[];
  };
}

export interface ApiOpinion {
  id: string;
  question: string;
  text: string;
  theme: string;
  liked?: boolean;
}

// Current User Profile Types
export interface CurrentUserOpinion {
  takeId: number;
  question: string;
  answer: string;
  tag: {
    id: number;
    name: string;
  };
}

export interface CurrentUserProfile {
  fname: string;
  lname: string;
  age: number;
  gender: string;
  showGender: boolean;
  sexuality: string;
  showSexuality: boolean;
  pronouns: string;
  showPronouns: boolean;
  homeTown: string;
  currentCity: string;
  jobDetails: string;
  colllege: string;
  highestEducationLevel: string;
  showEducationLevel: boolean;
  religiousBeliefs: string;
  showReligiousBeliefs: boolean;
  drinkOrSmoke: string;
  showDrinkOrSmoke: boolean;
  height: string;
  showHeight: boolean;
  opinions: CurrentUserOpinion[];
  photoUrls: string[];
}

export interface CurrentUserProfileResponse {
  code: number;
  msg: string;
  model: CurrentUserProfile;
}
