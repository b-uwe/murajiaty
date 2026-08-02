/**
 * @file Unit tests for vocabulary update utility functions
 */

const { hashVocabularyWord, parseCSVLineToWord } = require( '../vocabulary-sync.js' );

describe( 'Vocabulary Update System - Unit Tests', () => {
  describe( 'hashVocabularyWord', () => {
    /**
     * Test that hashVocabularyWord generates consistent hash for same vocabulary word
     */
    test( 'should generate consistent hash for same vocabulary word', () => {
      const word = { 'ar': 'كتاب',
        'de': 'Buch',
        'en': 'book',
        'es': 'libro' };
      const hash1 = hashVocabularyWord( word );
      const hash2 = hashVocabularyWord( word );
      expect( hash1 ).toBe( hash2 );
      expect( typeof hash1 ).toBe( 'string' );
      expect( hash1.length ).toBeGreaterThan( 0 );
    } );

    /**
     * Test that hashVocabularyWord generates different hashes for different vocabulary words
     */
    test( 'should generate different hashes for different vocabulary words', () => {
      const word1 = { 'ar': 'كتاب',
        'de': 'Buch',
        'en': 'book',
        'es': 'libro' };
      const word2 = { 'ar': 'قلم',
        'de': 'Stift',
        'en': 'pen',
        'es': 'pluma' };
      expect( hashVocabularyWord( word1 ) ).not.toBe( hashVocabularyWord( word2 ) );
    } );

    /**
     * Test that hashVocabularyWord generates different hashes when any field changes
     */
    test( 'should generate different hashes when any field changes', () => {
      const baseWord = { 'ar': 'كتاب',
        'de': 'Buch',
        'en': 'book',
        'es': 'libro' };
      const modifiedAr = { 'ar': 'كُتُب',
        'de': 'Buch',
        'en': 'book',
        'es': 'libro' };
      const modifiedDe = { 'ar': 'كتاب',
        'de': 'Bücher',
        'en': 'book',
        'es': 'libro' };
      const modifiedEn = { 'ar': 'كتاب',
        'de': 'Buch',
        'en': 'books',
        'es': 'libro' };
      const modifiedEs = { 'ar': 'كتاب',
        'de': 'Buch',
        'en': 'book',
        'es': 'libros' };

      const baseHash = hashVocabularyWord( baseWord );
      expect( hashVocabularyWord( modifiedAr ) ).not.toBe( baseHash );
      expect( hashVocabularyWord( modifiedDe ) ).not.toBe( baseHash );
      expect( hashVocabularyWord( modifiedEn ) ).not.toBe( baseHash );
      expect( hashVocabularyWord( modifiedEs ) ).not.toBe( baseHash );
    } );

    /**
     * Test that hashVocabularyWord handles special characters and diacritics
     */
    test( 'should handle special characters and diacritics', () => {
      const word = { 'ar': 'مُدَرِّس',
        'de': 'Lehrer',
        'en': 'teacher',
        'es': 'maestro' };
      const hash = hashVocabularyWord( word );
      expect( typeof hash ).toBe( 'string' );
      expect( hash.length ).toBeGreaterThan( 0 );
    } );

    /**
     * Test that hashVocabularyWord handles empty strings in vocabulary fields
     */
    test( 'should handle empty strings in vocabulary fields', () => {
      const word = { 'ar': '',
        'de': '',
        'en': '',
        'es': '' };
      const hash = hashVocabularyWord( word );
      expect( typeof hash ).toBe( 'string' );
      expect( hash.length ).toBeGreaterThan( 0 );
    } );
  } );

  describe( 'parseCSVLineToWord', () => {
    /**
     * Test that Arabic is taken from the plain-text column (1), not the
     * GOOGLETRANSLATE formula column (0). Columns differ to prove the source.
     */
    test( 'should read Arabic from the plain-text column, not the formula column', () => {
      const word = parseCSVLineToWord( 'IGNORED,كتاب,Buch,book,libro,md5' );
      expect( word.ar ).toBe( 'كتاب' );
    } );

    /**
     * Test that a word imports correctly even when the formula column exported
     * a #ERROR! sentinel, because the stable text column is used instead.
     */
    test( 'should import correctly when the formula column exported an error', () => {
      expect( parseCSVLineToWord( '#ERROR!,كتاب,Buch,book,libro,md5' ) ).toEqual( {
        'ar': 'كتاب',
        'de': 'Buch',
        'en': 'book',
        'es': 'libro',
        'bucketIndex': 0
      } );
    } );

    /**
     * Test that a row with no usable Arabic in the text column is rejected
     */
    test( 'should reject a row whose plain-text Arabic is empty', () => {
      expect( parseCSVLineToWord( '#ERROR!,,Buch,book,libro,md5' ) ).toBeNull();
    } );
  } );
} );