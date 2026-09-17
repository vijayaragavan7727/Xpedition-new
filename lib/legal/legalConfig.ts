/**
 * Xpedition Legal & Trust Configuration
 *
 * Centralized, authoritative metadata for legal policies, terms,
 * AI transparency disclosures, and support contact details.
 */

export interface LegalConfig {
  productName: string;
  legalEntityPlaceholder: string;
  supportEmail: string;
  policyVersion: string;
  effectiveDate: string;
  lastUpdated: string;
  trustRoutes: {
    privacy: string;
    terms: string;
    aiTransparency: string;
    disclaimer: string;
    sources: string;
    trustCenter: string;
  };
}

export const LEGAL_CONFIG: LegalConfig = {
  productName: 'Xpedition',
  legalEntityPlaceholder: 'Xpedition Learning Systems',
  supportEmail: 'support@xpeditionedu.com',
  policyVersion: '1.0.0',
  effectiveDate: 'September 2026',
  lastUpdated: 'September 17, 2026',
  trustRoutes: {
    privacy: '/privacy',
    terms: '/terms',
    aiTransparency: '/ai-transparency',
    disclaimer: '/disclaimer',
    sources: '/sources',
    trustCenter: '/trust',
  },
};
