const logger = require('./logger');

class TextProcessor {
  constructor() {
    this.supportedLanguages = [
      'en', 'es', 'fr', 'de', 'it', 'pt', 'ru', 'zh', 'ja', 'ko', 'ar', 'hi'
    ];
    this.sentimentLabels = ['positive', 'negative', 'neutral'];
  }

  // Text preprocessing
  preprocessText(text) {
    try {
      // Remove extra whitespace and normalize
      let processed = text.trim().replace(/\s+/g, ' ');
      
      // Remove special characters but keep punctuation
      processed = processed.replace(/[^\w\s.,!?;:()\-'"]/g, '');
      
      // Normalize quotes
      processed = processed.replace(/[""]/g, '"').replace(/['']/g, "'");
      
      return processed;
    } catch (error) {
      logger.error('Text preprocessing failed:', { error: error.message });
      throw error;
    }
  }

  // Language detection
  async detectLanguage(text) {
    try {
      // Simple language detection based on character patterns
      const patterns = {
        'en': /[a-zA-Z]/g,
        'ru': /[а-яё]/gi,
        'zh': /[\u4e00-\u9fff]/g,
        'ja': /[\u3040-\u309f\u30a0-\u30ff]/g,
        'ko': /[\uac00-\ud7af]/g,
        'ar': /[\u0600-\u06ff]/g,
        'hi': /[\u0900-\u097f]/g
      };

      const scores = {};
      for (const [lang, pattern] of Object.entries(patterns)) {
        const matches = text.match(pattern);
        scores[lang] = matches ? matches.length : 0;
      }

      const detectedLang = Object.keys(scores).reduce((a, b) => 
        scores[a] > scores[b] ? a : b
      );

      return {
        language: detectedLang,
        confidence: scores[detectedLang] / text.length,
        scores: scores
      };
    } catch (error) {
      logger.error('Language detection failed:', { error: error.message });
      throw error;
    }
  }

  // Sentiment analysis
  async analyzeSentiment(text) {
    try {
      const positiveWords = [
        'good', 'great', 'excellent', 'amazing', 'wonderful', 'fantastic',
        'love', 'like', 'enjoy', 'happy', 'pleased', 'satisfied'
      ];
      
      const negativeWords = [
        'bad', 'terrible', 'awful', 'horrible', 'disgusting', 'hate',
        'dislike', 'angry', 'sad', 'disappointed', 'frustrated'
      ];

      const words = text.toLowerCase().split(/\s+/);
      let positiveScore = 0;
      let negativeScore = 0;

      words.forEach(word => {
        if (positiveWords.includes(word)) positiveScore++;
        if (negativeWords.includes(word)) negativeScore++;
      });

      const totalScore = positiveScore + negativeScore;
      let sentiment = 'neutral';
      let confidence = 0.5;

      if (totalScore > 0) {
        if (positiveScore > negativeScore) {
          sentiment = 'positive';
          confidence = positiveScore / totalScore;
        } else if (negativeScore > positiveScore) {
          sentiment = 'negative';
          confidence = negativeScore / totalScore;
        }
      }

      return {
        sentiment,
        confidence,
        scores: {
          positive: positiveScore,
          negative: negativeScore,
          neutral: words.length - totalScore
        }
      };
    } catch (error) {
      logger.error('Sentiment analysis failed:', { error: error.message });
      throw error;
    }
  }

  // Text summarization
  async summarizeText(text, maxSentences = 3) {
    try {
      const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
      
      if (sentences.length <= maxSentences) {
        return {
          summary: text,
          originalLength: text.length,
          summaryLength: text.length,
          compressionRatio: 1.0
        };
      }

      // Simple extractive summarization based on sentence length and position
      const scoredSentences = sentences.map((sentence, index) => ({
        text: sentence.trim(),
        score: sentence.length + (sentences.length - index) * 0.1, // Prefer longer and earlier sentences
        index
      }));

      scoredSentences.sort((a, b) => b.score - a.score);
      
      const selectedSentences = scoredSentences
        .slice(0, maxSentences)
        .sort((a, b) => a.index - b.index)
        .map(s => s.text);

      const summary = selectedSentences.join('. ') + '.';
      
      return {
        summary,
        originalLength: text.length,
        summaryLength: summary.length,
        compressionRatio: summary.length / text.length,
        selectedSentences: selectedSentences.length
      };
    } catch (error) {
      logger.error('Text summarization failed:', { error: error.message });
      throw error;
    }
  }

  // Keyword extraction
  async extractKeywords(text, maxKeywords = 10) {
    try {
      // Remove common stop words
      const stopWords = new Set([
        'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for',
        'of', 'with', 'by', 'is', 'are', 'was', 'were', 'be', 'been', 'have',
        'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could', 'should'
      ]);

      const words = text.toLowerCase()
        .replace(/[^\w\s]/g, '')
        .split(/\s+/)
        .filter(word => word.length > 2 && !stopWords.has(word));

      // Count word frequency
      const wordCount = {};
      words.forEach(word => {
        wordCount[word] = (wordCount[word] || 0) + 1;
      });

      // Sort by frequency and return top keywords
      const keywords = Object.entries(wordCount)
        .sort(([,a], [,b]) => b - a)
        .slice(0, maxKeywords)
        .map(([word, count]) => ({ word, count, frequency: count / words.length }));

      return {
        keywords,
        totalWords: words.length,
        uniqueWords: Object.keys(wordCount).length
      };
    } catch (error) {
      logger.error('Keyword extraction failed:', { error: error.message });
      throw error;
    }
  }

  // Text translation (mock implementation)
  async translateText(text, targetLanguage = 'en', sourceLanguage = 'auto') {
    try {
      // Mock translation - in real implementation, integrate with translation API
      const translations = {
        'en': text,
        'es': `[ES] ${text}`,
        'fr': `[FR] ${text}`,
        'de': `[DE] ${text}`,
        'ru': `[RU] ${text}`,
        'zh': `[ZH] ${text}`,
        'ja': `[JA] ${text}`,
        'ko': `[KO] ${text}`
      };

      return {
        originalText: text,
        translatedText: translations[targetLanguage] || text,
        sourceLanguage: sourceLanguage === 'auto' ? 'en' : sourceLanguage,
        targetLanguage,
        confidence: 0.85 // Mock confidence
      };
    } catch (error) {
      logger.error('Text translation failed:', { error: error.message });
      throw error;
    }
  }

  // Named Entity Recognition (mock implementation)
  async extractEntities(text) {
    try {
      // Mock entity extraction
      const entities = {
        persons: [],
        organizations: [],
        locations: [],
        dates: [],
        money: []
      };

      // Simple regex patterns for entity detection
      const patterns = {
        persons: /\b[A-Z][a-z]+ [A-Z][a-z]+\b/g,
        organizations: /\b[A-Z][A-Za-z]+ (Inc|Corp|LLC|Ltd|Company|Corporation)\b/g,
        locations: /\b[A-Z][a-z]+ (City|State|Country|Street|Avenue|Road)\b/g,
        dates: /\b\d{1,2}\/\d{1,2}\/\d{4}\b/g,
        money: /\$\d+(?:,\d{3})*(?:\.\d{2})?\b/g
      };

      for (const [type, pattern] of Object.entries(patterns)) {
        const matches = text.match(pattern);
        if (matches) {
          entities[type] = matches.map(match => ({
            text: match,
            type: type,
            confidence: 0.8
          }));
        }
      }

      return {
        entities,
        totalEntities: Object.values(entities).flat().length
      };
    } catch (error) {
      logger.error('Entity extraction failed:', { error: error.message });
      throw error;
    }
  }

  // Text classification
  async classifyText(text, categories = ['news', 'social', 'academic', 'technical', 'casual']) {
    try {
      // Mock classification based on keyword matching
      const categoryKeywords = {
        news: ['news', 'report', 'breaking', 'update', 'announcement'],
        social: ['hello', 'thanks', 'congratulations', 'birthday', 'party'],
        academic: ['research', 'study', 'analysis', 'thesis', 'paper'],
        technical: ['code', 'programming', 'software', 'algorithm', 'system'],
        casual: ['hey', 'cool', 'awesome', 'nice', 'great']
      };

      const textLower = text.toLowerCase();
      const scores = {};

      categories.forEach(category => {
        const keywords = categoryKeywords[category] || [];
        scores[category] = keywords.reduce((score, keyword) => {
          return score + (textLower.includes(keyword) ? 1 : 0);
        }, 0);
      });

      const maxScore = Math.max(...Object.values(scores));
      const predictedCategory = Object.keys(scores).find(cat => scores[cat] === maxScore);

      return {
        category: predictedCategory,
        confidence: maxScore / text.split(' ').length,
        scores: scores,
        allCategories: categories
      };
    } catch (error) {
      logger.error('Text classification failed:', { error: error.message });
      throw error;
    }
  }
}

module.exports = new TextProcessor();
