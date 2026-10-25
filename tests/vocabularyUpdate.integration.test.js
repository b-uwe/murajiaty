/**
 * @file Integration tests for vocabulary update system
 */

const { fetchVocabularyData, checkForVocabularyUpdates } = require( '../vocabulary-sync.js' );

describe( 'Vocabulary Update System - Integration Tests', () => {
  describe( 'fetchVocabularyData', () => {
    /**
     * Test that fetchVocabularyData returns array of vocabulary words
     * @returns {Promise<void>}
     */
    test( 'should return array of vocabulary words', async () => {
      // Mock fetch for testing
      global.fetch = jest.fn().mockResolvedValue( {
        'ok': true,
        'text': () => {
          return Promise.resolve( 'AR,DE,EN,ES\nكتاب,Buch,book,libro\nقلم,Stift,pen,pluma' );
        }
      } );

      const result = await fetchVocabularyData();
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

      const result = await fetchVocabularyData();
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

      const result = await fetchVocabularyData();
      expect( result ).toEqual( [] );
    } );
  } );

  describe( 'checkForVocabularyUpdates integration', () => {
    let mockBuckets;

    beforeEach( () => {
      // Setup mock buckets structure
      mockBuckets = [
        [
          { 'ar': 'كتاب',
            'de': 'Buch',
            'en': 'book',
            'es': 'libro' }
        ],
        [
          { 'ar': 'قلم',
            'de': 'Stift',
            'en': 'pen',
            'es': 'pluma' }
        ],
        [],
        [],
        [],
        [],
        []
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
          return Promise.resolve( 'AR,DE,EN,ES\nكتاب,Buch,book,libro\nجديد,neu,new,nuevo' );
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
          return Promise.resolve( 'AR,DE,EN,ES\nكتاب,Buch,book,libro\nقلم,Stift,pen,pluma' );
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
     * Test preservation of existing buckets when fetch fails (offline scenario)
     * @returns {Promise<void>}
     */
    test( 'should preserve existing buckets when fetch fails (offline)', async () => {
      global.fetch = jest.fn().mockRejectedValue( new Error( 'Network error' ) );

      const result = await checkForVocabularyUpdates( mockBuckets );

      // Buckets should remain unchanged
      expect( result.buckets ).toEqual( mockBuckets );
      // Changes should indicate no modifications
      expect( result.changes ).toEqual( {
        'newWords': 0,
        'deletedWords': 0,
        'unchangedWords': 0
      } );
    } );

    /**
     * Test preservation of existing buckets when the source returns empty data
     * @returns {Promise<void>}
     */
    test( 'should preserve existing buckets when the source returns empty data', async () => {
      global.fetch = jest.fn().mockResolvedValue( {
        'ok': true,
        'text': () => {
          return Promise.resolve( '' );
        // Empty response
        }
      } );

      const result = await checkForVocabularyUpdates( mockBuckets );

      // Buckets should remain unchanged - NOT treated as "all words deleted"
      expect( result.buckets ).toEqual( mockBuckets );
      expect( result.changes.deletedWords ).toBe( 0 );
    } );

    /**
     * Test removal of deleted words from vocabulary buckets
     * @returns {Promise<void>}
     */
    test( 'should remove deleted words from buckets', async () => {
      // Setup buckets with multiple words to properly test removal
      const bucketsWithMultipleWords = [
        [
          { 'ar': 'كتاب',
            'de': 'Buch',
            'en': 'book',
            'es': 'libro' }
        ],
        [
          { 'ar': 'قلم',
            'de': 'Stift',
            'en': 'pen',
            'es': 'pluma' },
          { 'ar': 'بيت',
            'de': 'Haus',
            'en': 'house',
            'es': 'casa' }
        ],
        [],
        [],
        [],
        [],
        []
      ];

      global.fetch = jest.fn().mockResolvedValue( {
        'ok': true,
        'text': () => {
          // The source now only contains first two words, 'بيت' is deleted
          return Promise.resolve( 'AR,DE,EN,ES\nكتاب,Buch,book,libro\nقلم,Stift,pen,pluma' );
        }
      } );

      const result = await checkForVocabularyUpdates( bucketsWithMultipleWords );

      // Verify that bucket 1 still contains the non-deleted word
      expect( result.buckets[ 1 ] ).toContainEqual( {
        'ar': 'قلم',
        'de': 'Stift',
        'en': 'pen',
        'es': 'pluma'
      } );

      // Verify that the deleted word 'بيت' is removed from bucket 1
      expect( result.buckets[ 1 ] ).not.toContainEqual( {
        'ar': 'بيت',
        'de': 'Haus',
        'en': 'house',
        'es': 'casa'
      } );
    } );
  } );
} );