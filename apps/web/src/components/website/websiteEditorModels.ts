export type PublicRoute = { label: string; url: string };

export const PUBLIC_ROUTES: PublicRoute[] = [
  { label: 'Home', url: '/' },
  { label: 'About the firm', url: '/about' },
  { label: 'Areas of practice', url: '/practice-areas' },
  { label: 'Our team', url: '/team' },
  { label: 'Insights', url: '/insights' },
  { label: 'Contact', url: '/contact' },
];

export const SOCIAL_PLATFORMS = ['LinkedIn', 'X', 'Facebook', 'YouTube', 'Instagram', 'Other'] as const;
export type SocialPlatform = typeof SOCIAL_PLATFORMS[number];

export type NavigationItem = { label: string; url: string };
export type SocialLink = { label: string; url: string; platform: SocialPlatform };
export type SeoSettings = {
  title: string;
  description: string;
  canonical: string;
  noindex: boolean;
  imageId: string;
};
export type FooterSettings = { statement: string };

export type WebsiteSettingsEditor = {
  firmName: string;
  tagline: string;
  phone: string;
  email: string;
  address: string;
  navigation: NavigationItem[];
  socials: SocialLink[];
  defaultSeo: SeoSettings;
  footer: FooterSettings;
};

export type FormFieldKey = 'name' | 'email' | 'phone' | 'practiceAreaSlug' | 'message' | 'consent' | 'website';
export type FormFieldConfig = {
  key: FormFieldKey;
  label: string;
  helpText: string;
  placeholder: string;
  visible: boolean;
  required: boolean;
  order: number;
};

export const FORM_FIELD_LABELS: Record<FormFieldKey, string> = {
  name: 'Full name',
  email: 'Email address',
  phone: 'Phone number',
  practiceAreaSlug: 'Area of interest',
  message: 'How can we help?',
  consent: 'Consent confirmation',
  website: 'Spam protection',
};

export const REQUIRED_FORM_FIELDS = new Set<FormFieldKey>(['name', 'phone', 'message', 'consent']);

export const DEFAULT_FORM_FIELDS: FormFieldConfig[] = [
  { key: 'name', label: 'Full name', helpText: '', placeholder: 'Your full name', visible: true, required: true, order: 0 },
  { key: 'phone', label: 'Phone number', helpText: '', placeholder: '0712 345 678', visible: true, required: true, order: 1 },
  { key: 'email', label: 'Email address', helpText: '', placeholder: 'you@example.com', visible: true, required: false, order: 2 },
  { key: 'practiceAreaSlug', label: 'Area of interest', helpText: '', placeholder: 'Choose a practice area', visible: true, required: false, order: 3 },
  { key: 'message', label: 'How can we help?', helpText: '', placeholder: 'Briefly tell us how we can help.', visible: true, required: true, order: 4 },
  { key: 'consent', label: 'Consent confirmation', helpText: '', placeholder: '', visible: true, required: true, order: 5 },
  { key: 'website', label: 'Spam protection', helpText: '', placeholder: '', visible: false, required: false, order: 99 },
];

export type SectionType =
  | 'HERO' | 'RICH_TEXT' | 'QUOTE' | 'IMAGE_TEXT' | 'PRACTICE_GRID' | 'PROFESSIONAL_GRID'
  | 'INSIGHTS_GRID' | 'METRICS' | 'FAQ' | 'CTA' | 'SPACER' | 'HERO_JUSTICE'
  | 'FIRM_INTRODUCTION' | 'PARTNER_LEADERSHIP' | 'MEDIA_FEATURE' | 'TEAM_FEATURE'
  | 'TESTIMONIALS' | 'CONSULTATION';

export type SectionEditorDefinition = {
  type: SectionType;
  label: string;
  description: string;
  defaultTheme: 'light' | 'ivory' | 'dark' | 'gold';
  defaultVariant: string;
};

export const SECTION_DEFINITIONS: SectionEditorDefinition[] = [
  { type: 'HERO_JUSTICE', label: 'Justice hero', description: 'The main opening statement for the firm.', defaultTheme: 'dark', defaultVariant: 'home' },
  { type: 'HERO', label: 'Standard hero', description: 'A focused heading for an interior page.', defaultTheme: 'ivory', defaultVariant: 'default' },
  { type: 'FIRM_INTRODUCTION', label: 'Firm introduction', description: 'Introduce the firm and its practical approach.', defaultTheme: 'light', defaultVariant: 'default' },
  { type: 'PARTNER_LEADERSHIP', label: 'Partner leadership', description: 'Showcase selected partners and leadership.', defaultTheme: 'dark', defaultVariant: 'default' },
  { type: 'PRACTICE_GRID', label: 'Practice areas', description: 'Show the legal services offered by the firm.', defaultTheme: 'light', defaultVariant: 'default' },
  { type: 'PROFESSIONAL_GRID', label: 'Professional team grid', description: 'Display selected professionals.', defaultTheme: 'light', defaultVariant: 'default' },
  { type: 'INSIGHTS_GRID', label: 'Insights grid', description: 'Display selected articles and videos.', defaultTheme: 'light', defaultVariant: 'default' },
  { type: 'MEDIA_FEATURE', label: 'Featured insight or video', description: 'Highlight one insight with supporting items.', defaultTheme: 'dark', defaultVariant: 'default' },
  { type: 'TEAM_FEATURE', label: 'Team feature', description: 'Introduce the wider team.', defaultTheme: 'light', defaultVariant: 'default' },
  { type: 'TESTIMONIALS', label: 'Testimonials', description: 'Show approved client feedback.', defaultTheme: 'light', defaultVariant: 'default' },
  { type: 'CONSULTATION', label: 'Consultation section', description: 'Invite visitors to start a conversation.', defaultTheme: 'light', defaultVariant: 'default' },
  { type: 'RICH_TEXT', label: 'Text section', description: 'Add a clear heading and paragraphs.', defaultTheme: 'light', defaultVariant: 'default' },
  { type: 'IMAGE_TEXT', label: 'Image and text', description: 'Pair an approved image with explanatory copy.', defaultTheme: 'light', defaultVariant: 'split-left' },
  { type: 'QUOTE', label: 'Quote', description: 'Share a short statement or principle.', defaultTheme: 'ivory', defaultVariant: 'default' },
  { type: 'FAQ', label: 'Frequently asked questions', description: 'Answer common client questions.', defaultTheme: 'light', defaultVariant: 'default' },
  { type: 'CTA', label: 'Call to action', description: 'Give visitors a clear next step.', defaultTheme: 'gold', defaultVariant: 'default' },
  { type: 'METRICS', label: 'Trust metrics', description: 'Show managed firm metrics.', defaultTheme: 'dark', defaultVariant: 'default' },
  { type: 'SPACER', label: 'Spacing', description: 'Add controlled breathing room between sections.', defaultTheme: 'light', defaultVariant: 'default' },
];

const routeLabel = (url: string) => PUBLIC_ROUTES.find(route => route.url === url)?.label || 'External or custom link';
const inferPlatform = (label: string): SocialPlatform => {
  const normalized = label.toLowerCase();
  return SOCIAL_PLATFORMS.find(platform => normalized.includes(platform.toLowerCase())) || 'Other';
};

export function normalizeSettings(raw: any): WebsiteSettingsEditor {
  const defaultSeo = raw?.defaultSeo || {};
  return {
    firmName: raw?.firmName || '',
    tagline: raw?.tagline || '',
    phone: raw?.phone || '',
    email: raw?.email || '',
    address: raw?.address || '',
    navigation: Array.isArray(raw?.navigation) ? raw.navigation.map((item: any) => ({ label: item.label || routeLabel(item.url || '/'), url: item.url || '/' })) : [],
    socials: Array.isArray(raw?.socials) ? raw.socials.map((item: any) => ({ label: item.label || 'Other', url: item.url || '', platform: item.platform || inferPlatform(item.label || '') })) : [],
    defaultSeo: {
      title: defaultSeo.title || '',
      description: defaultSeo.description || '',
      canonical: defaultSeo.canonical || '',
      noindex: Boolean(defaultSeo.noindex),
      imageId: defaultSeo.imageId || '',
    },
    footer: { statement: raw?.footer?.statement || '' },
  };
}

export function serializeSettings(value: WebsiteSettingsEditor) {
  return {
    firmName: value.firmName.trim(),
    tagline: value.tagline.trim(),
    phone: value.phone.trim(),
    email: value.email.trim(),
    address: value.address.trim(),
    navigation: value.navigation.map(item => ({ label: item.label.trim(), url: item.url.trim() })),
    socials: value.socials.map(item => ({ label: item.platform === 'Other' ? item.label.trim() : item.platform, url: item.url.trim() })),
    footer: { statement: value.footer.statement.trim() },
    defaultSeo: {
      title: value.defaultSeo.title.trim(),
      description: value.defaultSeo.description.trim(),
      canonical: value.defaultSeo.canonical.trim(),
      noindex: Boolean(value.defaultSeo.noindex),
      ...(value.defaultSeo.imageId ? { imageId: value.defaultSeo.imageId } : {}),
    },
  };
}

function normalizeField(raw: any, index: number): FormFieldConfig | null {
  const key = raw?.key || raw;
  if (!Object.prototype.hasOwnProperty.call(FORM_FIELD_LABELS, key)) return null;
  const required = REQUIRED_FORM_FIELDS.has(key);
  return {
    key,
    label: raw?.label || FORM_FIELD_LABELS[key as FormFieldKey],
    helpText: raw?.helpText || '',
    placeholder: raw?.placeholder || DEFAULT_FORM_FIELDS.find(field => field.key === key)?.placeholder || '',
    visible: REQUIRED_FORM_FIELDS.has(key) ? true : key === 'website' ? false : raw?.visible !== false,
    required: required || Boolean(raw?.required),
    order: Number.isFinite(Number(raw?.order)) ? Number(raw.order) : index,
  };
}

export function normalizeForm(raw: any) {
  const legacy = raw?.schema?.fields;
  const configured = Array.isArray(legacy) ? legacy.map(normalizeField).filter(Boolean) as FormFieldConfig[] : [];
  const fields = [...DEFAULT_FORM_FIELDS.map(field => ({ ...field }))];
  for (const field of configured) {
    const index = fields.findIndex(existing => existing.key === field.key);
    if (index >= 0) fields[index] = field;
    else fields.push(field);
  }
  return {
    id: raw?.id,
    key: raw?.key || '',
    name: raw?.name || '',
    consentText: raw?.consentText || '',
    active: raw?.active !== false,
    version: Number(raw?.version || 1),
    fields: fields.filter(field => field.key !== 'website' || !field.visible).sort((a, b) => a.order - b.order),
    routingDestination: 'website-leads',
  };
}

export function serializeForm(value: ReturnType<typeof normalizeForm>) {
  const fields = value.fields.map((field, index) => ({
    key: field.key,
    label: field.label.trim(),
    helpText: field.helpText.trim(),
    placeholder: field.placeholder.trim(),
    visible: field.key === 'website' ? false : field.visible,
    required: REQUIRED_FORM_FIELDS.has(field.key) || field.required,
    order: index,
  }));
  return {
    ...(value.id ? { id: value.id } : {}),
    key: value.key.trim(),
    name: value.name.trim(),
    consentText: value.consentText.trim(),
    active: value.active,
    version: value.version,
    schema: { fields },
    routing: { destination: 'website-leads' },
  };
}

export function sectionDefinition(type: string) {
  return SECTION_DEFINITIONS.find(definition => definition.type === type) || SECTION_DEFINITIONS.find(definition => definition.type === 'RICH_TEXT')!;
}

export function sectionLabel(type: string) {
  return sectionDefinition(type).label;
}

export function newSection(type: SectionType = 'RICH_TEXT') {
  const definition = sectionDefinition(type);
  const content: Record<string, any> = {};
  if (type === 'HERO' || type === 'HERO_JUSTICE') Object.assign(content, { eyebrow: '', title: '', description: '', ctaLabel: 'Contact Us', ctaUrl: '/contact' });
  if (type === 'RICH_TEXT') Object.assign(content, { eyebrow: '', title: '', paragraphs: [''] });
  if (type === 'QUOTE') Object.assign(content, { quote: '', attribution: '' });
  if (type === 'FAQ') Object.assign(content, { eyebrow: 'Questions', title: 'Frequently asked questions', items: [{ q: '', a: '' }] });
  if (type === 'CTA') Object.assign(content, { eyebrow: "Let's talk", title: "Let's start a conversation.", description: '', ctaLabel: 'Contact Us', ctaUrl: '/contact', form: true });
  if (type === 'SPACER') Object.assign(content, { size: 4 });
  return { blockType: type, variant: definition.defaultVariant, theme: definition.defaultTheme, visible: true, content, settings: {} };
}
