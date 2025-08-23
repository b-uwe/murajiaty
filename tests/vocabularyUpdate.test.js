/**
 * @file Tests for vocabulary update functionality
 */

const { hashVocabularyWord, checkForVocabularyUpdates, fetchGoogleSheetsData } = require( '../main.js' );

describe( 'Vocabulary Update System', () => {
  describe( 'hashVocabularyWord', () => {
    test( 'should generate consistent hash for same vocabulary word', () => {
      const word = { 'ar': 'كتاب', 'de': 'Buch', 'en': 'book', 'es': 'libro' };
      const hash1 = hashVocabularyWord( word );
      const hash2 = hashVocabularyWord( word );
      expect( hash1 ).toBe( hash2 );
      expect( typeof hash1 ).toBe( 'string' );
      expect( hash1.length ).toBeGreaterThan( 0 );
    } );

    test( 'should generate different hashes for different vocabulary words', () => {
      const word1 = { 'ar': 'كتاب', 'de': 'Buch', 'en': 'book', 'es': 'libro' };
      const word2 = { 'ar': 'قلم', 'de': 'Stift', 'en': 'pen', 'es': 'pluma' };
      expect( hashVocabularyWord( word1 ) ).not.toBe( hashVocabularyWord( word2 ) );
    } );

    test( 'should generate different hashes when any field changes', () => {
      const baseWord = { 'ar': 'كتاب', 'de': 'Buch', 'en': 'book', 'es': 'libro' };
      const modifiedAr = { 'ar': 'كُتُب', 'de': 'Buch', 'en': 'book', 'es': 'libro' };
      const modifiedDe = { 'ar': 'كتاب', 'de': 'Bücher', 'en': 'book', 'es': 'libro' };
      const modifiedEn = { 'ar': 'كتاب', 'de': 'Buch', 'en': 'books', 'es': 'libro' };
      const modifiedEs = { 'ar': 'كتاب', 'de': 'Buch', 'en': 'book', 'es': 'libros' };

      const baseHash = hashVocabularyWord( baseWord );
      expect( hashVocabularyWord( modifiedAr ) ).not.toBe( baseHash );
      expect( hashVocabularyWord( modifiedDe ) ).not.toBe( baseHash );
      expect( hashVocabularyWord( modifiedEn ) ).not.toBe( baseHash );
      expect( hashVocabularyWord( modifiedEs ) ).not.toBe( baseHash );
    } );

    test( 'should handle special characters and diacritics', () => {
      const word = { 'ar': 'مُدَرِّس', 'de': 'Lehrer', 'en': 'teacher', 'es': 'maestro' };
      const hash = hashVocabularyWord( word );
      expect( typeof hash ).toBe( 'string' );
      expect( hash.length ).toBeGreaterThan( 0 );
    } );

    test( 'should handle empty strings in vocabulary fields', () => {
      const word = { 'ar': '', 'de': '', 'en': '', 'es': '' };
      const hash = hashVocabularyWord( word );
      expect( typeof hash ).toBe( 'string' );
      expect( hash.length ).toBeGreaterThan( 0 );
    } );
  } );

  describe( 'fetchGoogleSheetsData', () => {
    /**
     * Test that fetchGoogleSheetsData returns array of vocabulary words
     * @returns {Promise<void>}
     */
    test( 'should return array of vocabulary words', async () => {
      // Mock fetch for testing
      global.fetch = jest.fn().mockResolvedValue( {
        'ok': true,
        'text': () => {
          return Promise.resolve( 'AR,AR,DE,EN,ES,md5\nكتاب,كتاب,Buch,book,libro,hash1\nقلم,قلم,Stift,pen,pluma,hash2' );
        }
      } );

      const result = await fetchGoogleSheetsData();
      expect( Array.isArray( result ) ).toBe( true );
      expect( result ).toHaveLength( 2 );
      expect( result[ 0 ] ).toEqual( {
        'ar': 'كتاب',
        'de': 'Buch', 
        'en': 'book',
        'es': 'libro',
        'bucketIndex': 0
      } );
    } );

    /**
     * Test error handling for network failures
     * @returns {Promise<void>}
     */
    test( 'should handle fetch errors gracefully', async () => {
      global.fetch = jest.fn().mockRejectedValue( new Error( 'Network error' ) );
      
      const result = await fetchGoogleSheetsData();
      expect( result ).toEqual( [] );
    } );

    /**
     * Test error handling for invalid HTTP responses
     * @returns {Promise<void>}
     */
    test( 'should handle invalid response gracefully', async () => {
      global.fetch = jest.fn().mockResolvedValue( {
        'ok': false,
        'status': 404
      } );
      
      const result = await fetchGoogleSheetsData();
      expect( result ).toEqual( [] );
    } );
  } );

  describe( 'checkForVocabularyUpdates integration', () => {
    let mockBuckets;
    
    beforeEach( () => {
      // Setup mock buckets structure
      mockBuckets = [
        [ { 'ar': 'كتاب', 'de': 'Buch', 'en': 'book', 'es': 'libro' } ],
        [ { 'ar': 'قلم', 'de': 'Stift', 'en': 'pen', 'es': 'pluma' } ],
        [], [], [], [], []
      ];
    } );

    /**
     * Test detection and addition of new vocabulary words
     * @returns {Promise<void>}
     */
    test( 'should detect new words and add them to bucket 0', async () => {
      global.fetch = jest.fn().mockResolvedValue( {
        'ok': true,
        'text': () => {
          return Promise.resolve( 'AR,AR,DE,EN,ES,md5\nكتاب,كتاب,Buch,book,libro,hash1\nجديد,جديد,neu,new,nuevo,hash2' );
        }
      } );

      const result = await checkForVocabularyUpdates( mockBuckets );
      
      // Should add the new word 'جديد' to bucket 0
      expect( result.buckets[ 0 ] ).toContainEqual( {
        'ar': 'جديد',
        'de': 'neu', 
        'en': 'new',
        'es': 'nuevo'
      } );
    } );

    /**
     * Test preservation of unchanged words with existing progress
     * @returns {Promise<void>}
     */
    test( 'should preserve unchanged words with their progress', async () => {
      global.fetch = jest.fn().mockResolvedValue( {
        'ok': true,
        'text': () => {
          return Promise.resolve( 'AR,AR,DE,EN,ES,md5\nكتاب,كتاب,Buch,book,libro,hash1\nقلم,قلم,Stift,pen,pluma,hash2' );
        }
      } );

      const result = await checkForVocabularyUpdates( mockBuckets );
      
      // Original words should remain in their ORIGINAL buckets (preserving progress)
      expect( result.buckets[ 0 ] ).toContainEqual( {
        'ar': 'كتاب',
        'de': 'Buch',
        'en': 'book', 
        'es': 'libro'
      } );
      expect( result.buckets[ 1 ] ).toContainEqual( {
        'ar': 'قلم',
        'de': 'Stift',
        'en': 'pen',
        'es': 'pluma'
      } );
      
      // Verify that the advanced word is NOT moved back to bucket 0 (progress preserved)
      expect( result.buckets[ 0 ] ).not.toContainEqual( {
        'ar': 'قلم',
        'de': 'Stift',
        'en': 'pen',
        'es': 'pluma'
      } );
      
      // Verify that the beginner word is NOT moved to bucket 1
      expect( result.buckets[ 1 ] ).not.toContainEqual( {
        'ar': 'كتاب',
        'de': 'Buch',
        'en': 'book',
        'es': 'libro'
      } );
    } );

    /**
     * Test removal of deleted words from vocabulary buckets
     * @returns {Promise<void>}
     */
    test( 'should remove deleted words from buckets', async () => {
      global.fetch = jest.fn().mockResolvedValue( {
        'ok': true,
        'text': () => {
          return Promise.resolve( 'AR,AR,DE,EN,ES,md5\nكتاب,كتاب,Buch,book,libro,hash1' ); // Only first word remains
        }
      } );

      const result = await checkForVocabularyUpdates( mockBuckets );
      
      // Second word should be deleted from bucket 1
      expect( result.buckets[ 1 ] ).not.toContainEqual( {
        'ar': 'قلم',
        'de': 'Stift',
        'en': 'pen',
        'es': 'pluma'
      } );
    } );
  } );
} );