import { apiGet } from "../api";

export interface SystemPageSummary {
  slug: string;
  title: string;
  systemKey: string;
}

export interface SystemPage {
  id: number;
  systemKey: string;
  slug: string;
  title: string;
  content: string;
  createdAt: string;
  updatedAt: string;
}

export interface PublicSiteContent {
  loginNoticeMarkdown: string;
  userAgreementPage: SystemPageSummary | null;
  privacyPolicyPage: SystemPageSummary | null;
}

let publicSiteContentCache: Promise<PublicSiteContent> | null = null;

export async function fetchPublicSiteContent(): Promise<PublicSiteContent> {
  return apiGet<PublicSiteContent>("/api/site-content");
}

export function loadPublicSiteContentCached(force = false): Promise<PublicSiteContent> {
  if (force || !publicSiteContentCache) {
    publicSiteContentCache = fetchPublicSiteContent();
  }
  return publicSiteContentCache;
}

export function invalidatePublicSiteContentCache() {
  publicSiteContentCache = null;
}

export async function fetchSystemPage(slug: string): Promise<SystemPage> {
  const result = await apiGet<{ page: SystemPage }>(`/api/system-pages/${encodeURIComponent(slug)}`);
  return result.page;
}
