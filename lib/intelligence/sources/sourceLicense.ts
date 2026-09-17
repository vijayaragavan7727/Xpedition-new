/**
 * Xpedition Source Intelligence Engine v1 — License Manager & Policy
 *
 * Enforces: "Never assume publicly visible = free to copy."
 * Controls what content may be transformed into simulations vs what must be cited as reference only.
 */

import { SourceLicenseType, SourceLicenseDetails } from './sourceTypes';

export class SourceLicensePolicy {
  private static LICENSE_METADATA: Record<SourceLicenseType, SourceLicenseDetails> = {
    CC0: {
      license: 'CC0',
      commercialUseAllowed: true,
      derivativeWorksAllowed: true,
      attributionRequired: false,
      shareAlikeRequired: false,
      usageGuideline: 'Public domain dedication. Free for all transformative educational uses.',
    },
    PublicDomain: {
      license: 'PublicDomain',
      commercialUseAllowed: true,
      derivativeWorksAllowed: true,
      attributionRequired: false,
      shareAlikeRequired: false,
      usageGuideline: 'Government/scientific public domain work (e.g. NASA, NIST). Transformative use allowed.',
    },
    'CC-BY': {
      license: 'CC-BY',
      commercialUseAllowed: true,
      derivativeWorksAllowed: true,
      attributionRequired: true,
      shareAlikeRequired: false,
      usageGuideline: 'Open educational resource (e.g. OpenStax). Transformation allowed with attribution.',
    },
    'CC-BY-SA': {
      license: 'CC-BY-SA',
      commercialUseAllowed: true,
      derivativeWorksAllowed: true,
      attributionRequired: true,
      shareAlikeRequired: true,
      usageGuideline: 'ShareAlike copyleft. Derivative works must maintain identical license terms.',
    },
    'CC-BY-NC': {
      license: 'CC-BY-NC',
      commercialUseAllowed: false,
      derivativeWorksAllowed: true,
      attributionRequired: true,
      shareAlikeRequired: false,
      usageGuideline: 'Non-commercial educational transformation allowed with attribution.',
    },
    'CC-BY-NC-SA': {
      license: 'CC-BY-NC-SA',
      commercialUseAllowed: false,
      derivativeWorksAllowed: true,
      attributionRequired: true,
      shareAlikeRequired: true,
      usageGuideline: 'Non-commercial educational transformation allowed (e.g. MIT OCW, Khan Academy).',
    },
    MIT: {
      license: 'MIT',
      commercialUseAllowed: true,
      derivativeWorksAllowed: true,
      attributionRequired: true,
      shareAlikeRequired: false,
      usageGuideline: 'Permissive software/docs license. Free reuse with copyright notice.',
    },
    FairUseReference: {
      license: 'FairUseReference',
      commercialUseAllowed: false,
      derivativeWorksAllowed: false,
      attributionRequired: true,
      shareAlikeRequired: false,
      usageGuideline: 'Reference and factual quotation only under fair use. Do not copy wholesale.',
    },
    RestrictedAllRightsReserved: {
      license: 'RestrictedAllRightsReserved',
      commercialUseAllowed: false,
      derivativeWorksAllowed: false,
      attributionRequired: true,
      shareAlikeRequired: false,
      usageGuideline: 'Restricted copyright. Cite link and title only; never ingest or reproduce body text.',
    },
    Unknown: {
      license: 'Unknown',
      commercialUseAllowed: false,
      derivativeWorksAllowed: false,
      attributionRequired: true,
      shareAlikeRequired: false,
      usageGuideline: 'Unspecified license. Treated as restricted copyright until verified.',
    },
  };

  /**
   * Returns authoritative permission details for any license type.
   */
  static getLicenseDetails(license: SourceLicenseType | string): SourceLicenseDetails {
    if (license === 'AllRightsReserved') {
      return this.LICENSE_METADATA.RestrictedAllRightsReserved;
    }
    return this.LICENSE_METADATA[license as SourceLicenseType] || this.LICENSE_METADATA.Unknown;
  }

  /**
   * Evaluates permissions object for educational transformation and attribution compliance.
   */
  static evaluatePermissions(license: SourceLicenseType | string): {
    canTransformForSimulation: boolean;
    attributionRequired: boolean;
    commercialUseAllowed: boolean;
    shareAlikeRequired: boolean;
  } {
    const details = this.getLicenseDetails(license);
    return {
      canTransformForSimulation: details.derivativeWorksAllowed,
      attributionRequired: details.attributionRequired,
      commercialUseAllowed: details.commercialUseAllowed,
      shareAlikeRequired: details.shareAlikeRequired,
    };
  }

  /**
   * Verifies if content under this license can be transformed into interactive educational simulations.
   */
  static canTransformIntoSimulation(license: SourceLicenseType | string): boolean {
    const details = this.getLicenseDetails(license);
    return details.derivativeWorksAllowed;
  }

  /**
   * Formats a clean academic and legal attribution string.
   */
  static formatAttribution(
    sourceTitle: string,
    publisher: string,
    arg3: string,
    arg4: string,
    author?: string
  ): string {
    // Detect whether arg3 is license or url
    const isArg3Url = arg3.startsWith('http');
    const url = isArg3Url ? arg3 : arg4;
    const license = isArg3Url ? arg4 : arg3;

    const authorPart = author ? `${author}, ` : '';
    const licenseText = license === 'PublicDomain' ? 'Public Domain' : license;
    return `"${sourceTitle}" by ${authorPart}${publisher}, licensed under ${licenseText}. Available at: ${url}`;
  }
}
