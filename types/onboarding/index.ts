export interface OnboardingStep {
  step: number;
  description: string;
}

export interface BasicDetailsFormData {
  fname: string;
  lname: string;
  phone: string;
  email: string;
  dob: string;
  gender: {
    value: number | string; // Support both for compatibility during transition
    visibleOnProfile: boolean;
  };
  // sexuality: {
  //   value: string;
  //   visibleOnProfile: boolean;
  // };
  pronouns: {
    value: string;
    visibleOnProfile: boolean;
  };
  interestedIn: (number | string)[]; // Support both for compatibility during transition
}

export interface LifestyleFormData {
  homeTown: string;
  currentCity: string;
  jobDetails: string;
  college: string;
  highestEducationLevel: {
    value: string;
    visibleOnProfile: boolean;
  };
  religiousBeliefs: {
    value: string;
    visibleOnProfile: boolean;
  };
  drinkOrSmoke: {
    value: string;
    visibleOnProfile: boolean;
  };
  height: {
    value: string;
    visibleOnProfile: boolean;
  };
}

export interface TakeFormData {
  question: string;
  answer: string;
  tagId: number;
}

export interface TakesFormData {
  takes: TakeFormData[];
}

export interface PhotosFormData {
  photos: string[];
  mainPhotoIndex: number;
}

// Photo upload URL types
export interface PhotoUploadUrl {
  photoIndex: number;
  uploadUrl: string;
  s3Key: string;
  contentType: string;
}

export interface PhotoUploadUrlResponse {
  code: number;
  msg: string;
  model: {
    uploadUrls: PhotoUploadUrl[];
  };
}

export interface PhotoSubmissionData {
  urls: string[];
}

export interface OnboardingResponse {
  code: number;
  msg: string;
  model: OnboardingStep;
}

// New API structure for takes
export interface Tag {
  id: number;
  name: string;
}

export interface Question {
  id: number;
  val: string;
}

export interface TagAndQuestion {
  tag: Tag;
  questions: Question[];
}

export interface LifestyleResponse {
  code: number;
  msg: string;
  model: {
    step: number;
    description: string;
    tagAndQuestion: TagAndQuestion[];
  };
}

export interface TopicTake {
  questionId: number;
  take: string;
}

export interface AllTake {
  tagId: number;
  topicTakes: TopicTake[];
}

export interface NewTakesFormData {
  allTakes: AllTake[];
}

export interface PrivacyToggle {
  value: string;
  visibleOnProfile: boolean;
}

// Dropdown/Picker options
export interface PickerOption {
  label: string;
  value: string;
}
export interface IntPickerOption {
  label: string;
  value: number;
}

export const GENDER_OPTIONS: IntPickerOption[] = [
  { label: "Male", value: 1 },
  { label: "Female", value: 2 },
  { label: "Non-binary", value: 3 },
  { label: "Not Listed", value: 4 },
];

export const SEXUALITY_OPTIONS: PickerOption[] = [
  { label: "Straight", value: "Straight" },
  { label: "Gay", value: "Gay" },
  { label: "Lesbian", value: "Lesbian" },
  { label: "Allosexual", value: "Allosexual" },
  { label: "Androsexual", value: "Androsexual" },
  { label: "Asexual", value: "Asexual" },
  { label: "Autosexual", value: "Autosexual" },
  { label: "Bisexual", value: "Bisexual" },
  { label: "Bicurious", value: "Bicurious" },
  { label: "Demisexual", value: "Demisexual" },
  { label: "Graysexual", value: "Graysexual" },
  { label: "Gynesexual", value: "Gynesexual" },
  { label: "Monosexual", value: "Monosexual" },
  { label: "Omnisexual", value: "Omnisexual" },
  { label: "Pansexual", value: "Pansexual" },
  { label: "Polysexual", value: "Polysexual" },
  { label: "Skoliosexual", value: "Skoliosexual" },
  { label: "Spectrasexual", value: "Spectrasexual" },
  { label: "Queer", value: "Queer" },
  { label: "Not Listed", value: "Not Listed" },
];

export const PRONOUNS_OPTIONS: PickerOption[] = [
  { label: "He", value: "He" },
  { label: "Him", value: "Him" },
  { label: "She", value: "She" },
  { label: "Her", value: "Her" },
  { label: "Hers", value: "Hers" },
  { label: "They", value: "They" },
  { label: "Them", value: "Them" },
  { label: "Theirs", value: "Theirs" },
  { label: "Not Listed", value: "Not Listed" },
];

export const INTERESTED_IN_OPTIONS: IntPickerOption[] = [
  { label: "Men", value: 1 },
  { label: "Women", value: 2 },
  { label: "Non-binary", value: 3 },
];

export const EDUCATION_LEVELS: PickerOption[] = [
  { label: "High School", value: "High School" },
  { label: "Some College", value: "Some College" },
  { label: "Bachelor's", value: "Bachelor's" },
  { label: "Master's", value: "Master's" },
  { label: "PhD", value: "PhD" },
  { label: "Trade School", value: "Trade School" },
  { label: "Other", value: "Other" },
];

export const RELIGIOUS_BELIEFS: PickerOption[] = [
  { label: "Agnostic", value: "Agnostic" },
  { label: "Atheist", value: "Atheist" },
  { label: "Buddhist", value: "Buddhist" },
  { label: "Christian", value: "Christian" },
  { label: "Hindu", value: "Hindu" },
  { label: "Jewish", value: "Jewish" },
  { label: "Muslim", value: "Muslim" },
  {
    label: "Spiritual but not religious",
    value: "Spiritual but not religious",
  },
  { label: "Other", value: "Other" },
];

export const DRINK_SMOKE_OPTIONS: PickerOption[] = [
  { label: "Never", value: "Never" },
  {
    label: "Occasionally drinks, doesn't smoke",
    value: "Occasionally drinks, doesn't smoke",
  },
  {
    label: "Regularly drinks, doesn't smoke",
    value: "Regularly drinks, doesn't smoke",
  },
  {
    label: "Doesn't drink, occasionally smokes",
    value: "Doesn't drink, occasionally smokes",
  },
  {
    label: "Doesn't drink, regularly smokes",
    value: "Doesn't drink, regularly smokes",
  },
  { label: "Both occasionally", value: "Both occasionally" },
  { label: "Both regularly", value: "Both regularly" },
];

export const HEIGHT_OPTIONS: PickerOption[] = [
  { label: "4'10\"", value: "4'10\"" },
  { label: "4'11\"", value: "4'11\"" },
  { label: "5'0\"", value: "5'0\"" },
  { label: "5'1\"", value: "5'1\"" },
  { label: "5'2\"", value: "5'2\"" },
  { label: "5'3\"", value: "5'3\"" },
  { label: "5'4\"", value: "5'4\"" },
  { label: "5'5\"", value: "5'5\"" },
  { label: "5'6\"", value: "5'6\"" },
  { label: "5'7\"", value: "5'7\"" },
  { label: "5'8\"", value: "5'8\"" },
  { label: "5'9\"", value: "5'9\"" },
  { label: "5'10\"", value: "5'10\"" },
  { label: "5'11\"", value: "5'11\"" },
  { label: "6'0\"", value: "6'0\"" },
  { label: "6'1\"", value: "6'1\"" },
  { label: "6'2\"", value: "6'2\"" },
  { label: "6'3\"", value: "6'3\"" },
  { label: "6'4\"", value: "6'4\"" },
  { label: "6'5\"", value: "6'5\"" },
  { label: "6'6\"", value: "6'6\"" },
];
