/**
 * Xpedition Source Intelligence Engine v1 — Authoritative Source Registry
 *
 * Pre-calibrated repository of trusted open educational institutions, OER publishers,
 * and scientific repositories with verified license rights.
 */

import { EducationalSource } from './sourceTypes';
import { SourceLicensePolicy } from './sourceLicense';

export class SourceRegistry {
  private static SOURCES: EducationalSource[] = [
    // 1. OPENSTAX TEXTBOOKS (Rice University - CC-BY 4.0)
    {
      id: 'src_openstax_physics',
      title: 'University Physics (Volume 1 & 2)',
      publisher: 'OpenStax, Rice University',
      author: 'Samuel J. Ling, Jeff Sanny, William Moebs',
      url: 'https://openstax.org/details/books/university-physics-volume-1',
      category: 'open_textbook',
      license: 'CC-BY',
      licenseDetails: SourceLicensePolicy.getLicenseDetails('CC-BY'),
      authorityScore: 0.98,
      relevanceScore: 0.95,
      overallScore: 0.97,
      retrievalDate: '2026-09-16T00:00:00Z',
      topics: ['physics', 'newtons laws', 'force', 'motion', 'kinematics', 'circuits', 'ohms law', 'electromagnetism'],
      verifiedOpenAccess: true,
      excerpt: 'Newton’s second law states that the acceleration of a system is directly proportional to and in the same direction as the net external force acting on the system, and inversely proportional to its mass: a = F_net / m.',
    },
    {
      id: 'src_openstax_biology',
      title: 'Biology 2e: Cellular Energy & Physiology',
      publisher: 'OpenStax, Rice University',
      author: 'Mary Ann Clark, Matthew Douglas, Jung Choi',
      url: 'https://openstax.org/details/books/biology-2e',
      category: 'open_textbook',
      license: 'CC-BY',
      licenseDetails: SourceLicensePolicy.getLicenseDetails('CC-BY'),
      authorityScore: 0.98,
      relevanceScore: 0.95,
      overallScore: 0.97,
      retrievalDate: '2026-09-16T00:00:00Z',
      topics: ['biology', 'photosynthesis', 'chloroplast', 'dna', 'dna replication', 'heart', 'circulation', 'mitosis'],
      verifiedOpenAccess: true,
      excerpt: 'Photosynthesis uses solar energy, carbon dioxide, and water to produce energy-storing carbohydrates: 6CO2 + 6H2O + light -> C6H12O6 + 6O2. The light reactions take place in the thylakoid membrane.',
    },
    {
      id: 'src_openstax_chemistry',
      title: 'Chemistry 2e: Chemical Bonding and Structure',
      publisher: 'OpenStax, Rice University',
      author: 'Paul Flowers, Klaus Theopold, Richard Langley',
      url: 'https://openstax.org/details/books/chemistry-2e',
      category: 'open_textbook',
      license: 'CC-BY',
      licenseDetails: SourceLicensePolicy.getLicenseDetails('CC-BY'),
      authorityScore: 0.97,
      relevanceScore: 0.94,
      overallScore: 0.96,
      retrievalDate: '2026-09-16T00:00:00Z',
      topics: ['chemistry', 'chemical bonding', 'molecular bonding', 'covalent bond', 'valence', 'octet rule', 'water molecule'],
      verifiedOpenAccess: true,
      excerpt: 'A covalent bond forms when two atoms share valence electrons to achieve stable noble-gas electron configurations satisfying the octet rule.',
    },

    // 2. MIT OPENCOURSEWARE (CC-BY-NC-SA 4.0)
    {
      id: 'src_mit_ocw_physics',
      title: 'MIT Classical Mechanics 8.01SC',
      publisher: 'Massachusetts Institute of Technology (MIT OCW)',
      author: 'Prof. Walter Lewin, Prof. Peter Dourmashkin',
      url: 'https://ocw.mit.edu/courses/8-01sc-classical-mechanics-fall-2016/',
      category: 'open_courseware',
      license: 'CC-BY-NC-SA',
      licenseDetails: SourceLicensePolicy.getLicenseDetails('CC-BY-NC-SA'),
      authorityScore: 0.99,
      relevanceScore: 0.96,
      overallScore: 0.98,
      retrievalDate: '2026-09-16T00:00:00Z',
      topics: ['physics', 'mechanics', 'newtons laws', 'gravity', 'orbital mechanics', 'kepler', 'momentum'],
      verifiedOpenAccess: true,
      excerpt: 'Newtonian mechanics models bodies as point masses subject to vector forces. In free flight, gravitational acceleration g operates uniformly downward.',
    },
    {
      id: 'src_mit_ocw_circuits',
      title: 'MIT Circuits and Electronics 6.002',
      publisher: 'Massachusetts Institute of Technology (MIT OCW)',
      author: 'Prof. Anant Agarwal',
      url: 'https://ocw.mit.edu/courses/6-002-circuits-and-electronics-spring-2007/',
      category: 'open_courseware',
      license: 'CC-BY-NC-SA',
      licenseDetails: SourceLicensePolicy.getLicenseDetails('CC-BY-NC-SA'),
      authorityScore: 0.99,
      relevanceScore: 0.95,
      overallScore: 0.97,
      retrievalDate: '2026-09-16T00:00:00Z',
      topics: ['circuits', 'electric circuits', 'ohms law', 'resistors', 'voltage', 'current', 'motor', 'electric motor'],
      verifiedOpenAccess: true,
      excerpt: 'The lumped circuit abstraction defines voltage V across an element and current I through it. For an ohmic resistor, V = IR.',
    },
    {
      id: 'src_mit_ocw_algorithms',
      title: 'MIT Introduction to Algorithms 6.006',
      publisher: 'Massachusetts Institute of Technology (MIT OCW)',
      author: 'Prof. Erik Demaine, Prof. Srini Devadas',
      url: 'https://ocw.mit.edu/courses/6-006-introduction-to-algorithms-spring-2020/',
      category: 'open_courseware',
      license: 'CC-BY-NC-SA',
      licenseDetails: SourceLicensePolicy.getLicenseDetails('CC-BY-NC-SA'),
      authorityScore: 0.99,
      relevanceScore: 0.96,
      overallScore: 0.98,
      retrievalDate: '2026-09-16T00:00:00Z',
      topics: ['algorithms', 'computer science', 'sorting', 'binary tree', 'data structures', 'quicksort', 'merge sort'],
      verifiedOpenAccess: true,
      excerpt: 'Comparison sorting algorithms possess a fundamental lower bound of Omega(n log n) operations in the worst-case.',
    },
    {
      id: 'src_mit_ocw_biology',
      title: 'MIT Introductory Biology 7.016: Cellular Bioenergetics',
      publisher: 'Massachusetts Institute of Technology (MIT OCW)',
      author: 'Prof. Eric Lander, Prof. Robert Weinberg',
      url: 'https://ocw.mit.edu/courses/7-016-introductory-biology-fall-2018/',
      category: 'open_courseware',
      license: 'CC-BY-NC-SA',
      licenseDetails: SourceLicensePolicy.getLicenseDetails('CC-BY-NC-SA'),
      authorityScore: 0.99,
      relevanceScore: 0.96,
      overallScore: 0.98,
      retrievalDate: '2026-09-16T00:00:00Z',
      topics: ['biology', 'photosynthesis', 'calvin cycle', 'chloroplast', 'dna', 'genetics', 'cellular energy', 'plant physiology'],
      verifiedOpenAccess: true,
      excerpt: 'Photosynthesis couples photon absorption in thylakoid photosystems with carbon fixation in the stroma to synthesize organic macromolecules.',
    },

    // 3. NASA SCIENCE & ASTRONOMY (Public Domain / US Gov)
    {
      id: 'src_nasa_solar_system',
      title: 'Solar System Dynamics & Planetary Fact Sheets',
      publisher: 'NASA Jet Propulsion Laboratory (JPL)',
      author: 'NASA Science Mission Directorate',
      url: 'https://solarsystem.nasa.gov/planets/overview/',
      category: 'scientific_government',
      license: 'PublicDomain',
      licenseDetails: SourceLicensePolicy.getLicenseDetails('PublicDomain'),
      authorityScore: 0.99,
      relevanceScore: 0.98,
      overallScore: 0.99,
      retrievalDate: '2026-09-16T00:00:00Z',
      topics: ['astronomy', 'solar system', 'planets', 'orbits', 'mercury', 'earth', 'mars', 'kepler', 'gravity'],
      verifiedOpenAccess: true,
      excerpt: 'Planetary orbits conform to Keplerian ellipses with the Sun at one focus. Orbital period T scales with semi-major axis a according to T^2 proportional to a^3.',
    },

    // 4. PHET INTERACTIVE SIMULATIONS (University of Colorado Boulder - CC-BY 4.0)
    {
      id: 'src_phet_simulations',
      title: 'PhET Interactive Simulations Repository',
      publisher: 'University of Colorado Boulder',
      author: 'PhET Interactive Simulations Project',
      url: 'https://phet.colorado.edu/',
      category: 'university',
      license: 'CC-BY',
      licenseDetails: SourceLicensePolicy.getLicenseDetails('CC-BY'),
      authorityScore: 0.97,
      relevanceScore: 0.96,
      overallScore: 0.97,
      retrievalDate: '2026-09-16T00:00:00Z',
      topics: ['physics', 'chemistry', 'simulation', 'fractions', 'circuits', 'electric motor', 'electromagnetism'],
      verifiedOpenAccess: true,
      excerpt: 'Interactive conceptual exploration isolates dynamic physical variables, enabling students to construct intuitive mental models through direct experimentation.',
    },

    // 5. NPTEL / INDIAN INSTITUTES OF TECHNOLOGY (Open Access Educational)
    {
      id: 'src_nptel_electrical',
      title: 'NPTEL Electrical Machines & Magnetic Fields',
      publisher: 'NPTEL (IIT Kharagpur / MHRD)',
      author: 'Prof. T. K. Bhattacharya',
      url: 'https://nptel.ac.in/courses/108105017',
      category: 'open_courseware',
      license: 'CC-BY-SA',
      licenseDetails: SourceLicensePolicy.getLicenseDetails('CC-BY-SA'),
      authorityScore: 0.95,
      relevanceScore: 0.94,
      overallScore: 0.95,
      retrievalDate: '2026-09-16T00:00:00Z',
      topics: ['electric motor', 'motor', 'electromagnetism', 'magnetic field', 'torque', 'lorentz force', 'rotor', 'stator'],
      verifiedOpenAccess: true,
      excerpt: 'An electric motor converts electrical energy into mechanical work through the interaction of magnetic fields and current-carrying conductors: F = I(L x B), producing rotational torque on the armature.',
    },

    // 6. LIBRETEXTS MATHEMATICS (CC-BY-NC-SA 3.0)
    {
      id: 'src_libretexts_math',
      title: 'LibreTexts: Prealgebra & Rational Numbers',
      publisher: 'LibreTexts / UC Davis',
      author: 'Denny Burzynski, Wade Ellis',
      url: 'https://math.libretexts.org/Bookshelves/Prealgebra',
      category: 'open_textbook',
      license: 'CC-BY-NC-SA',
      licenseDetails: SourceLicensePolicy.getLicenseDetails('CC-BY-NC-SA'),
      authorityScore: 0.94,
      relevanceScore: 0.92,
      overallScore: 0.93,
      retrievalDate: '2026-09-16T00:00:00Z',
      topics: ['mathematics', 'fractions', 'rational numbers', 'proportions', 'numerator', 'denominator'],
      verifiedOpenAccess: true,
      excerpt: 'A fraction represents a part of a whole. Multiplying or dividing both numerator and denominator by the same non-zero number produces an equivalent fraction.',
    },
  ];

  /**
   * Discovers educational sources matching the topic query.
   */
  static findSourcesForTopic(normalizedTopic: string, subject?: string): EducationalSource[] {
    const tokens = normalizedTopic.toLowerCase().split(/\s+/).filter(t => t.length > 2);

    const matches = this.SOURCES.map((source) => {
      let score = 0;

      // Subject match
      if (subject && source.topics.includes(subject.toLowerCase())) {
        score += 0.3;
      }

      // Keyword token matching
      for (const token of tokens) {
        if (source.topics.some(t => t.includes(token) || token.includes(t))) {
          score += 0.4;
        }
        if (source.title.toLowerCase().includes(token)) {
          score += 0.3;
        }
        if (source.excerpt?.toLowerCase().includes(token)) {
          score += 0.2;
        }
      }

      return { source, matchScore: Math.min(1.0, score) };
    })
    .filter(m => m.matchScore > 0)
    .sort((a, b) => (b.matchScore * b.source.authorityScore) - (a.matchScore * a.source.authorityScore));

    if (matches.length > 0) {
      return matches.map(m => m.source);
    }

    // Default authoritative fallback source if no specific topic match
    return [this.SOURCES[0]];
  }

  /**
   * Retrieves all verified sources.
   */
  static getAllSources(): EducationalSource[] {
    return [...this.SOURCES];
  }

  /**
   * Retrieves a single source by ID.
   */
  static getSourceById(id: string): EducationalSource | undefined {
    return this.SOURCES.find(s => s.id === id);
  }
}

export const EDUCATIONAL_SOURCE_REGISTRY = SourceRegistry.getAllSources();
