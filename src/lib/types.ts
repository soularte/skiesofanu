export interface LinkItem {
  label: string;
  url: string;
}

export interface SocialLink extends LinkItem {
  icon: string;
}

export interface LinksData {
  socials: SocialLink[];
  litportals: {
    ksenia: LinkItem[];
    vasily: LinkItem[];
  };
  contact: {
    vk: string;
    telegram: string;
  };
}

export interface AuthorProfile {
  name: string;
  photo: string;
  bioUrl?: string;
  bioLabel?: string;
}

export interface AuthorsData {
  bio: string[];
  ksenia: AuthorProfile;
  vasily: AuthorProfile;
  influences?: string[];
}

export interface SiteData {
  siteName: string;
  siteTagline?: string;
  defaultDescription: string;
  metricsId?: string;
  blogSubtitle?: string;
  aboutSubtitle?: string;
  booksSubtitle?: string;
  seoAbout?: string;
  seoBlog?: string;
  seoBooks?: string;
  privacyText: string;
}

export interface NewsData {
  visible: boolean;
  text?: string;
  links?: LinkItem[];
  progress?: ProgressData;
}

export interface TelegramPost {
  label: string;
  postId: string;
}

export interface TelegramData {
  posts: {
    digest?: TelegramPost;
    current?: TelegramPost;
    intro?: TelegramPost;
  };
}

export interface ProgressItem {
  title: string;
  current: number;
  total: number;
  visible: boolean;
}

export interface ProgressData {
  visible: boolean;
  items: ProgressItem[];
}
