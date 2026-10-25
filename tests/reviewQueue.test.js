/**
 * @file Tests for review queue functions: binary frequency level calculation,
 * review queue insertion, level-based word finding, and stored word parsing.
 */

const {
  calculateTargetLevel,
  insertIntoReviewQueue,
  findWordForLevel,
  parseStoredWord
} = require( '../vocab-logic.js' );

describe( 'calculateTargetLevel', () => {
  test( 'should return 0 for odd counter values', () => {
    expect( calculateTargetLevel( 1 ) ).toBe( 0 );
    expect( calculateTargetLevel( 3 ) ).toBe( 0 );
    expect( calculateTargetLevel( 7 ) ).toBe( 0 );
    expect( calculateTargetLevel( 15 ) ).toBe( 0 );
    expect( calculateTargetLevel( 99 ) ).toBe( 0 );
  } );

  test( 'should return 1 for multiples of 2 but not 4', () => {
    expect( calculateTargetLevel( 2 ) ).toBe( 1 );
    expect( calculateTargetLevel( 6 ) ).toBe( 1 );
    expect( calculateTargetLevel( 10 ) ).toBe( 1 );
    expect( calculateTargetLevel( 14 ) ).toBe( 1 );
  } );

  test( 'should return 2 for multiples of 4 but not 8', () => {
    expect( calculateTargetLevel( 4 ) ).toBe( 2 );
    expect( calculateTargetLevel( 12 ) ).toBe( 2 );
    expect( calculateTargetLevel( 20 ) ).toBe( 2 );
  } );

  test( 'should return 3 for multiples of 8 but not 16', () => {
    expect( calculateTargetLevel( 8 ) ).toBe( 3 );
    expect( calculateTargetLevel( 24 ) ).toBe( 3 );
  } );

  test( 'should return higher levels for higher powers of 2', () => {
    expect( calculateTargetLevel( 16 ) ).toBe( 4 );
    expect( calculateTargetLevel( 32 ) ).toBe( 5 );
    expect( calculateTargetLevel( 64 ) ).toBe( 6 );
    expect( calculateTargetLevel( 128 ) ).toBe( 7 );
    expect( calculateTargetLevel( 1024 ) ).toBe( 10 );
  } );

  test( 'should return 0 for counter value 0', () => {
    expect( calculateTargetLevel( 0 ) ).toBe( 0 );
  } );

  test( 'should produce correct frequency distribution over 64 iterations', () => {
    const counts = {};
    for ( let i = 1; i <= 64; i++ ) {
      const level = calculateTargetLevel( i );
      counts[ level ] = ( counts[ level ] || 0 ) + 1;
    }

    // Level 0 should appear ~50% of the time (32 out of 64)
    expect( counts[ 0 ] ).toBe( 32 );

    // Level 1 should appear ~25% (16 out of 64)
    expect( counts[ 1 ] ).toBe( 16 );

    // Level 2 should appear ~12.5% (8 out of 64)
    expect( counts[ 2 ] ).toBe( 8 );

    // Level 3 should appear ~6.25% (4 out of 64)
    expect( counts[ 3 ] ).toBe( 4 );

    // Level 4 should appear ~3.125% (2 out of 64)
    expect( counts[ 4 ] ).toBe( 2 );

    // Level 5 should appear once (counter=32)
    expect( counts[ 5 ] ).toBe( 1 );

    // Level 6 should appear once (counter=64)
    expect( counts[ 6 ] ).toBe( 1 );
  } );
} );

describe( 'insertIntoReviewQueue', () => {
  /**
   * Creates a minimal word object for testing.
   * @param {object} overrides - Optional field overrides
   * @returns {object} A vocabulary word object
   */
  const makeWord = ( overrides = {} ) => {
    return {
      'ar': 'كتاب',
      'de': 'Buch',
      'en': 'book',
      'es': 'libro',
      ...overrides
    };
  };

  test( 'should set reviewCount based on increment for new word', () => {
    const word = makeWord();
    const buckets = [ [], [], [], [], [], [], [] ];

    insertIntoReviewQueue( word, buckets, 1 );

    expect( word.reviewCount ).toBe( 1 );
  } );

  test( 'should add increment to existing reviewCount', () => {
    const word = makeWord( { 'reviewCount': 3 } );
    const buckets = [ [], [], [], [], [], [], [] ];

    insertIntoReviewQueue( word, buckets, 2 );

    expect( word.reviewCount ).toBe( 5 );
  } );

  test( 'should keep reviewCount unchanged when increment is 0', () => {
    const word = makeWord( { 'reviewCount': 2 } );
    const buckets = [ [], [], [], [], [], [], [] ];

    insertIntoReviewQueue( word, buckets, 0 );

    expect( word.reviewCount ).toBe( 2 );
  } );

  test( 'should push word into the last bucket', () => {
    const word = makeWord();
    const buckets = [ [], [], [], [], [], [], [] ];

    insertIntoReviewQueue( word, buckets, 1 );

    expect( buckets[ 6 ] ).toHaveLength( 1 );
    expect( buckets[ 6 ][ 0 ] ).toBe( word );
  } );

  test( 'should handle words with unknown legacy properties without crashing', () => {
    const word = makeWord( {
      'doneAt': 1000,
      'touched': true,
      'unknownLegacy': 'junk'
    } );
    const buckets = [ [], [], [], [], [], [], [] ];

    insertIntoReviewQueue( word, buckets, 1 );

    expect( word.reviewCount ).toBe( 1 );
    expect( buckets[ 6 ][ 0 ] ).toBe( word );
  } );

  test( 'should delete touched property', () => {
    const word = makeWord( { 'touched': true } );
    const buckets = [ [], [], [], [], [], [], [] ];

    insertIntoReviewQueue( word, buckets, 1 );

    expect( word ).not.toHaveProperty( 'touched' );
  } );

  test( 'should set reviewCount to 0 for word without existing reviewCount and increment 0', () => {
    const word = makeWord();
    const buckets = [ [], [], [], [], [], [], [] ];

    insertIntoReviewQueue( word, buckets, 0 );

    expect( word.reviewCount ).toBe( 0 );
  } );
} );

describe( 'findWordForLevel', () => {
  /**
   * Creates a minimal word object for testing.
   * @param {object} overrides - Optional field overrides
   * @returns {object} A vocabulary word object
   */
  const makeWord = ( overrides = {} ) => {
    return {
      'ar': 'كتاب',
      'de': 'Buch',
      'en': 'book',
      'es': 'libro',
      ...overrides
    };
  };

  /**
   * Creates N words at a given reviewCount level.
   * @param {number} count - Number of words to create
   * @param {number} reviewCount - The reviewCount to assign
   * @returns {Array<object>} Array of word objects
   */
  const makeWordsAtLevel = ( count, reviewCount ) => {
    return Array.from( { 'length': count }, ( _, i ) => {
      return makeWord( { 'de': `lvl${reviewCount}_${i}`,
        reviewCount } );
    } );
  };

  test( 'should pull from target level when it has >= 10 words', () => {
    const bucket = [
      ...makeWordsAtLevel( 10, 2 ),
      ...makeWordsAtLevel( 10, 0 )
    ];

    const result = findWordForLevel( bucket, 2 );

    expect( result.reviewCount ).toBe( 2 );
  } );

  test( 'should fall back directly to level 0 when target level has < 10 words', () => {
    const bucket = [
      ...makeWordsAtLevel( 7, 2 ),
      ...makeWordsAtLevel( 12, 0 )
    ];

    // Target level 2 has only 7 words (< 10), level 0 has 12 (>= 10)
    const result = findWordForLevel( bucket, 2 );

    expect( result.reviewCount ).toBe( 0 );
  } );

  test( 'should skip intermediate levels entirely when falling back', () => {
    const bucket = [
      ...makeWordsAtLevel( 4, 3 ),
      ...makeWordsAtLevel( 15, 1 ),
      ...makeWordsAtLevel( 12, 0 )
    ];

    /*
     * Target level 3 has 4 words (< 10), level 1 has 15 (>= 10) but
     * is skipped — falls directly to level 0 which also has >= 10.
     */
    const result = findWordForLevel( bucket, 3 );

    expect( result.reviewCount ).toBe( 0 );
  } );

  test( 'should fall back to level 0 even when it has < 10 words', () => {
    const bucket = [
      ...makeWordsAtLevel( 4, 2 ),
      ...makeWordsAtLevel( 7, 0 )
    ];

    /*
     * Target level 2 has 4 (< 10), level 0 has 7 (< 10). The threshold
     * does not apply to level 0 as a fallback — return the first level-0
     * word (FIFO) so the user always has something to review.
     */
    const result = findWordForLevel( bucket, 2 );

    expect( result.reviewCount ).toBe( 0 );
    expect( result.de ).toBe( 'lvl0_0' );
  } );

  test( 'should pull from level 0 directly when it has < 10 words', () => {
    const bucket = makeWordsAtLevel( 9, 0 );

    /*
     * Target IS level 0 with only 9 words. The threshold does not apply
     * to level 0 — pull the oldest word.
     */
    const result = findWordForLevel( bucket, 0 );

    expect( result.de ).toBe( 'lvl0_0' );
  } );

  test( 'should pull from level 0 directly when it has a single word', () => {
    const bucket = makeWordsAtLevel( 1, 0 );

    const result = findWordForLevel( bucket, 0 );

    expect( result.de ).toBe( 'lvl0_0' );
  } );

  test( 'should still skip target level with < 10 words when level 0 has any word', () => {
    const bucket = [
      ...makeWordsAtLevel( 5, 2 ),
      ...makeWordsAtLevel( 1, 0 )
    ];

    /*
     * Target level 2 has 5 (< 10) — threshold protects it from hammering.
     * Level 0 has just 1 word but no threshold applies: return it.
     */
    const result = findWordForLevel( bucket, 2 );

    expect( result.reviewCount ).toBe( 0 );
  } );

  test( 'should pull from level 0 when target is level 0 and it has >= 10 words', () => {
    const bucket = makeWordsAtLevel( 10, 0 );

    const result = findWordForLevel( bucket, 0 );

    expect( result.reviewCount ).toBe( 0 );
  } );

  test( 'should treat missing reviewCount as level 0', () => {
    const bucket = [
      ...Array.from( { 'length': 10 }, ( _, i ) => {
        return makeWord( { 'de': `noCount_${i}` } );
      } ),
      ...makeWordsAtLevel( 10, 1 )
    ];

    const result = findWordForLevel( bucket, 0 );

    expect( result.de ).toBe( 'noCount_0' );
  } );

  test( 'should return null for empty bucket', () => {
    const result = findWordForLevel( [], 0 );

    expect( result ).toBeNull();
  } );

  test( 'should return the first word at the target level (FIFO order)', () => {
    const bucket = [
      ...makeWordsAtLevel( 10, 0 ),
      ...makeWordsAtLevel( 10, 1 )
    ];

    /*
     * Level 0 has 10 words (de: lvl0_0 … lvl0_9). The function must
     * return the first one in array order to preserve FIFO: older
     * words (closer to the front) are recalled before newer ones.
     */
    const result = findWordForLevel( bucket, 0 );

    expect( result.de ).toBe( 'lvl0_0' );
  } );

  test( 'should return the first level-0 word when falling back (FIFO order)', () => {
    const bucket = [
      ...makeWordsAtLevel( 4, 2 ),
      ...makeWordsAtLevel( 12, 0 )
    ];

    /*
     * Target level 2 is underpopulated (4 < 10), falls back to
     * level 0 which has 12 words. Must return the first level-0
     * word in array order (lvl0_0) to maintain FIFO recall.
     */
    const result = findWordForLevel( bucket, 2 );

    expect( result.de ).toBe( 'lvl0_0' );
  } );

  test( 'should return null when many words exist but none at target or level 0', () => {
    const bucket = [
      ...makeWordsAtLevel( 15, 3 ),
      ...makeWordsAtLevel( 15, 5 )
    ];

    // Target level 1 has 0 words, level 0 has 0 words — skip
    const result = findWordForLevel( bucket, 1 );

    expect( result ).toBeNull();
  } );
} );

describe( 'parseStoredWord', () => {
  test( 'should keep de, ar, en, es properties', () => {
    const result = parseStoredWord( {
      'de': 'Buch',
      'ar': 'كتاب',
      'en': 'book',
      'es': 'libro'
    } );

    expect( result ).toEqual( {
      'de': 'Buch',
      'ar': 'كتاب',
      'en': 'book',
      'es': 'libro'
    } );
  } );

  test( 'should preserve reviewCount when present', () => {
    const result = parseStoredWord( {
      'de': 'Buch',
      'ar': 'كتاب',
      'en': 'book',
      'es': 'libro',
      'reviewCount': 3
    } );

    expect( result.reviewCount ).toBe( 3 );
  } );

  test( 'should preserve reviewCount of 0', () => {
    const result = parseStoredWord( {
      'de': 'Buch',
      'ar': 'كتاب',
      'en': 'book',
      'es': 'libro',
      'reviewCount': 0
    } );

    expect( result.reviewCount ).toBe( 0 );
  } );

  test( 'should not include reviewCount when undefined', () => {
    const result = parseStoredWord( {
      'de': 'Buch',
      'ar': 'كتاب',
      'en': 'book',
      'es': 'libro'
    } );

    expect( result ).not.toHaveProperty( 'reviewCount' );
  } );

  test( 'should strip legacy doneAt property', () => {
    const result = parseStoredWord( {
      'de': 'Buch',
      'ar': 'كتاب',
      'en': 'book',
      'es': 'libro',
      'doneAt': 1000
    } );

    expect( result ).not.toHaveProperty( 'doneAt' );
  } );

  test( 'should strip touched property', () => {
    const result = parseStoredWord( {
      'de': 'Buch',
      'ar': 'كتاب',
      'en': 'book',
      'es': 'libro',
      'touched': true
    } );

    expect( result ).not.toHaveProperty( 'touched' );
  } );

  test( 'should strip any unknown properties', () => {
    const result = parseStoredWord( {
      'de': 'Buch',
      'ar': 'كتاب',
      'en': 'book',
      'es': 'libro',
      'unknownField': 'junk',
      'anotherJunk': 42
    } );

    expect( Object.keys( result ) ).toEqual( [ 'de', 'ar', 'en', 'es' ] );
  } );
} );
