/**
 * Xpedition Intelligence Layer v1 — Document Ingestion, Chunking & Grounded Retrieval
 *
 * Provides a lightweight, deterministic document model for grounded learning.
 *
 * Core Principles:
 * 1. Zero vector database overhead: deterministic lexical relevance scoring for small study corpora.
 * 2. Real source preservation: document title, section heading, page number, and chunk index.
 * 3. Security first: document text is treated as UNTRUSTED DATA in explicit boundary tags.
 * 4. Token & memory limits: strict size limits (max 50k chars, max 50 chunks).
 * 5. Honest fallback: explicitly refuses when source lacks information instead of hallucinating.
 */

export type DocumentSourceType = 'pdf' | 'notes' | 'text' | 'syllabus' | 'textbook';

export interface DocumentMetadata {
  fileName?: string;
  fileType?: string;
  fileSizeBytes?: number;
  pageCount?: number;
  totalChars: number;
  author?: string;
  topic?: string;
  createdAt: number;
}

export interface DocumentChunk {
  documentId: string;
  documentTitle: string;
  chunkId: string;
  chunkIndex: number;
  pageNumber?: number;
  sectionTitle?: string;
  text: string;
  charCount: number;
}

export interface LearningDocument {
  id: string;
  title: string;
  sourceType: DocumentSourceType;
  metadata: DocumentMetadata;
  chunks: DocumentChunk[];
  createdAt: number;
}

export interface ChunkRetrievalResult {
  documentId: string;
  documentTitle: string;
  chunkId: string;
  chunkIndex: number;
  pageNumber?: number;
  sectionTitle?: string;
  text: string;
  relevanceScore: number;
}

export interface DocumentSourceReference {
  documentTitle: string;
  pageNumber?: number;
  sectionTitle?: string;
  snippet?: string;
}

export interface DocumentGroundedQaContent {
  answer: string;
  explanation: string;
  keyPoints: string[];
  sourceReferences: DocumentSourceReference[];
  checkQuestion: string;
  nextLearningStep: string;
  grounded: boolean;
  sourceLacksInformation?: boolean;
}

const STOP_WORDS = new Set([
  'a', 'an', 'and', 'are', 'as', 'at', 'be', 'by', 'for', 'from', 'has', 'he',
  'in', 'is', 'it', 'its', 'of', 'on', 'that', 'the', 'to', 'was', 'were', 'will',
  'with', 'what', 'where', 'which', 'who', 'why', 'how', 'can', 'could', 'should',
  'does', 'explain', 'tell', 'me', 'about', 'from', 'my', 'notes', 'pdf', 'book'
]);

/**
 * Splits text deterministically into structured chunks with section titles and page estimates.
 */
export function chunkDocumentText(
  text: string,
  documentId: string,
  documentTitle: string,
  options?: {
    maxChunkChars?: number;
    minChunkChars?: number;
    maxChunks?: number;
  }
): DocumentChunk[] {
  const maxChars = options?.maxChunkChars || 600;
  const minChars = options?.minChunkChars || 150;
  const maxChunks = options?.maxChunks || 50;

  if (!text || !text.trim()) {
    return [];
  }

  // Check for form-feed page separators (\f) or paragraph breaks
  const rawParagraphs = text
    .split(/\n\s*\n|\f/)
    .map((p) => p.trim())
    .filter((p) => p.length > 0);

  const chunks: DocumentChunk[] = [];
  let currentSectionTitle = documentTitle;
  let estimatedPage = 1;
  let charCounter = 0;

  let currentChunkText = '';

  for (const para of rawParagraphs) {
    charCounter += para.length;
    estimatedPage = Math.max(1, Math.ceil(charCounter / 1800));

    // Detect section header
    const headerMatch = para.match(/^(?:#+\s*|Chapter\s+\d+:?\s*|Unit\s+\d+:?\s*|Section\s+\d+:?\s*)([^\n]+)/i);
    if (headerMatch && headerMatch[1]) {
      currentSectionTitle = headerMatch[1].trim().slice(0, 80);
    }

    if (currentChunkText.length + para.length <= maxChars) {
      currentChunkText += (currentChunkText ? '\n\n' : '') + para;
    } else {
      if (currentChunkText.length >= minChars) {
        chunks.push({
          documentId,
          documentTitle,
          chunkId: `${documentId}_chunk_${chunks.length + 1}`,
          chunkIndex: chunks.length + 1,
          pageNumber: estimatedPage,
          sectionTitle: currentSectionTitle,
          text: currentChunkText.trim(),
          charCount: currentChunkText.length,
        });
        if (chunks.length >= maxChunks) break;
      }
      currentChunkText = para;
    }
  }

  if (currentChunkText.trim() && chunks.length < maxChunks) {
    chunks.push({
      documentId,
      documentTitle,
      chunkId: `${documentId}_chunk_${chunks.length + 1}`,
      chunkIndex: chunks.length + 1,
      pageNumber: estimatedPage,
      sectionTitle: currentSectionTitle,
      text: currentChunkText.trim(),
      charCount: currentChunkText.length,
    });
  }

  return chunks;
}

/**
 * Creates a normalized LearningDocument from raw string content.
 */
export function createLearningDocument(
  id: string,
  title: string,
  rawText: string,
  sourceType: DocumentSourceType = 'text',
  metadata?: Partial<DocumentMetadata>
): LearningDocument {
  const sanitizedTitle = (title || 'Study Material').trim().slice(0, 100);
  const normalizedText = (rawText || '').trim().slice(0, 50000); // Safety limit: max 50k chars

  const chunks = chunkDocumentText(normalizedText, id, sanitizedTitle);

  return {
    id,
    title: sanitizedTitle,
    sourceType,
    metadata: {
      fileName: metadata?.fileName || `${sanitizedTitle.toLowerCase().replace(/[^a-z0-9]/g, '_')}.${sourceType}`,
      fileType: metadata?.fileType || sourceType,
      fileSizeBytes: metadata?.fileSizeBytes || normalizedText.length,
      pageCount: metadata?.pageCount || Math.max(1, Math.ceil(normalizedText.length / 1800)),
      totalChars: normalizedText.length,
      author: metadata?.author,
      topic: metadata?.topic,
      createdAt: metadata?.createdAt || Date.now(),
    },
    chunks,
    createdAt: Date.now(),
  };
}

/**
 * Deterministic lexical keyword retrieval for small document collections.
 */
export function retrieveRelevantChunks(
  query: string,
  documents: LearningDocument | LearningDocument[],
  options?: {
    topK?: number;
    minScoreThreshold?: number;
  }
): ChunkRetrievalResult[] {
  const topK = options?.topK || 3;
  const minThreshold = options?.minScoreThreshold || 1;

  const docList = Array.isArray(documents) ? documents : [documents];
  const allChunks: DocumentChunk[] = docList.flatMap((d) => d.chunks || []);

  if (!query || !query.trim() || allChunks.length === 0) {
    return [];
  }

  // Tokenize and clean query
  const queryTokens = query
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter((token) => token.length > 2 && !STOP_WORDS.has(token));

  if (queryTokens.length === 0) {
    // If query has only stop words, fallback to non-stop words > 1 char
    const fallbackTokens = query
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, ' ')
      .split(/\s+/)
      .filter((t) => t.length > 1);
    queryTokens.push(...fallbackTokens);
  }

  const scoredResults: ChunkRetrievalResult[] = [];

  for (const chunk of allChunks) {
    const chunkLower = chunk.text.toLowerCase();
    const sectionLower = (chunk.sectionTitle || '').toLowerCase();
    let score = 0;

    // Exact phrase match bonus
    const cleanQuery = query.toLowerCase().trim();
    if (chunkLower.includes(cleanQuery)) {
      score += 15;
    }

    // Token frequency & section title matches
    for (const token of queryTokens) {
      if (sectionLower.includes(token)) {
        score += 8; // Heavy boost for section title alignment
      }
      const tokenMatches = (chunkLower.match(new RegExp(`\\b${token}\\b`, 'g')) || []).length;
      if (tokenMatches > 0) {
        score += tokenMatches * 3;
      } else if (chunkLower.includes(token)) {
        score += 1;
      }
    }

    if (score >= minThreshold) {
      scoredResults.push({
        documentId: chunk.documentId,
        documentTitle: chunk.documentTitle,
        chunkId: chunk.chunkId,
        chunkIndex: chunk.chunkIndex,
        pageNumber: chunk.pageNumber,
        sectionTitle: chunk.sectionTitle,
        text: chunk.text,
        relevanceScore: score,
      });
    }
  }

  // Sort by score descending and take topK
  scoredResults.sort((a, b) => b.relevanceScore - a.relevanceScore);
  return scoredResults.slice(0, topK);
}

/**
 * Formats retrieved chunks into safe, delimited context blocks with anti-prompt-injection safeguards.
 */
export function formatGroundedSourceContext(chunks: ChunkRetrievalResult[]): string {
  if (chunks.length === 0) {
    return 'NO RELEVANT SOURCE MATERIAL FOUND IN UPLOADED DOCUMENTS.';
  }

  return chunks
    .map((chunk, index) => {
      const pageInfo = chunk.pageNumber ? ` | Page ${chunk.pageNumber}` : '';
      const sectionInfo = chunk.sectionTitle ? ` | Section: "${chunk.sectionTitle}"` : '';

      return `[SOURCE EXCERPT ${index + 1}]
Document: "${chunk.documentTitle}"${sectionInfo}${pageInfo}
Reference ID: ${chunk.chunkId}
Content:
"""
${chunk.text.replace(/"""/g, "'''")}
"""`;
    })
    .join('\n\n');
}

/**
 * Builds clean learner-facing source citations from retrieved chunks.
 */
export function buildSourceReferences(chunks: ChunkRetrievalResult[]): DocumentSourceReference[] {
  return chunks.map((c) => ({
    documentTitle: c.documentTitle,
    pageNumber: c.pageNumber,
    sectionTitle: c.sectionTitle,
    snippet: c.text.slice(0, 160) + (c.text.length > 160 ? '...' : ''),
  }));
}
