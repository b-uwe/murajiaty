/**
 * @file Tests for smart vocabulary recycling from the DONE bucket
 * using binary frequency-based level targeting with minimum population
 * threshold and direct level-0 fallback.
 */

const { recallWords } = require( '../app-utils.js' );

/**
 * Creates a test vocabulary word with sensible defaults.
 * @param {object} overrides - Optional field overrides for the word
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
 * @param {string} prefix - Prefix for de field
 * @returns {Array<object>} Array of word objects
 */
const makeWordsAtLevel = ( count, reviewCount, prefix = 'done' ) => {
  return Array.from( { 'length': count }, ( _, i ) => {
    return makeWord( { 'de': `${prefix}_rc${reviewCount}_${i}`,
      reviewCount } );
  } );
};

describe( 'recallWords', () => {
  test( 'should not pull any words when non-DONE buckets have 25 or more words', () => {
    const buckets = [
      Array.from( { 'length': 25 }, ( _, i ) => {
        return makeWord( { 'de': `word${i}` } );
      } ),
      [],
      [],
      [],
      [],
      [],
      makeWordsAtLevel( 5, 0 )
    ];

    const newCounter = recallWords( buckets, 0 );

    expect( buckets[ 0 ] ).toHaveLength( 25 );
    expect( buckets[ 6 ] ).toHaveLength( 5 );
    expect( newCounter ).toBe( 0 );
  } );

  test( 'should pull from level 0 when it has >= 5 words', () => {
    const buckets = [
      Array.from( { 'length': 20 }, ( _, i ) => {
        return makeWord( { 'de': `active${i}` } );
      } ),
      [],
      [],
      [],
      [],
      [],
      makeWordsAtLevel( 10, 0 )
    ];

    const newCounter = recallWords( buckets, 0 );

    /*
     * Need 5 words to reach 25. Counter values 1-5 map to target
     * levels [0, 1, 0, 2, 0]. Level 0 starts with 10 words. All
     * 5 pulls succeed — either targeting level 0 directly or falling
     * back to it — because level 0 stays above the threshold
     * throughout (10 → 9 → 8 → 7 → 6 → 5).
     */
    expect( buckets[ 0 ] ).toHaveLength( 25 );
    expect( buckets[ 6 ] ).toHaveLength( 5 );
    expect( newCounter ).toBe( 5 );
  } );

  test( 'should skip pull when no level meets the population threshold', () => {
    const buckets = [
      Array.from( { 'length': 22 }, ( _, i ) => {
        return makeWord( { 'de': `active${i}` } );
      } ),
      [],
      [],
      [],
      [],
      [],
      makeWordsAtLevel( 3, 0 )
    ];

    // Only 3 words at level 0 (< 5 threshold), no other levels
    const newCounter = recallWords( buckets, 0 );

    // Counter advances 3 times (wordsNeeded=3) but no words pulled
    expect( buckets[ 0 ] ).toHaveLength( 22 );
    expect( buckets[ 6 ] ).toHaveLength( 3 );
    expect( newCounter ).toBe( 3 );
  } );

  test( 'should pull from target level when it has >= 5 words', () => {
    const buckets = [
      Array.from( { 'length': 24 }, ( _, i ) => {
        return makeWord( { 'de': `active${i}` } );
      } ),
      [],
      [],
      [],
      [],
      [],
      [
        ...makeWordsAtLevel( 5, 1 ),
        ...makeWordsAtLevel( 5, 0 )
      ]
    ];

    // Need 1 word. Counter 0→1 → target level 0. Level 0 has 5 (>= 5) → pull
    const newCounter = recallWords( buckets, 0 );

    expect( buckets[ 0 ] ).toHaveLength( 25 );
    expect( buckets[ 0 ][ 24 ].reviewCount ).toBe( 0 );
    expect( newCounter ).toBe( 1 );
  } );

  test( 'should fall back to level 0 when target level is underpopulated', () => {
    const buckets = [
      Array.from( { 'length': 24 }, ( _, i ) => {
        return makeWord( { 'de': `active${i}` } );
      } ),
      [],
      [],
      [],
      [],
      [],
      [
        ...makeWordsAtLevel( 2, 1 ),
        ...makeWordsAtLevel( 6, 0 )
      ]
    ];

    /*
     * Need 1 word. Counter 0→1 → target level 0. Level 0 has 6 (>= 5).
     * Pulls from level 0.
     */
    const newCounter = recallWords( buckets, 0 );

    expect( buckets[ 0 ] ).toHaveLength( 25 );
    expect( buckets[ 0 ][ 24 ].reviewCount ).toBe( 0 );
    expect( newCounter ).toBe( 1 );
  } );

  test( 'should do nothing when DONE bucket is empty', () => {
    const buckets = [
      [ makeWord( { 'de': 'active1' } ) ],
      [],
      [],
      [],
      [],
      [],
      []
    ];

    const newCounter = recallWords( buckets, 5 );

    expect( buckets[ 0 ] ).toHaveLength( 1 );
    expect( buckets[ 6 ] ).toHaveLength( 0 );
    expect( newCounter ).toBe( 5 );
  } );

  test( 'should count words across all non-DONE buckets', () => {
    const buckets = [
      Array.from( { 'length': 5 }, ( _, i ) => {
        return makeWord( { 'de': `b0_${i}` } );
      } ),
      Array.from( { 'length': 5 }, ( _, i ) => {
        return makeWord( { 'de': `b1_${i}` } );
      } ),
      Array.from( { 'length': 5 }, ( _, i ) => {
        return makeWord( { 'de': `b2_${i}` } );
      } ),
      Array.from( { 'length': 5 }, ( _, i ) => {
        return makeWord( { 'de': `b3_${i}` } );
      } ),
      Array.from( { 'length': 3 }, ( _, i ) => {
        return makeWord( { 'de': `b4_${i}` } );
      } ),
      Array.from( { 'length': 2 }, ( _, i ) => {
        return makeWord( { 'de': `b5_${i}` } );
      } ),
      makeWordsAtLevel( 10, 0 )
    ];

    // 5+5+5+5+3+2 = 25 active, should not pull any
    const newCounter = recallWords( buckets, 10 );

    expect( buckets[ 6 ] ).toHaveLength( 10 );
    expect( newCounter ).toBe( 10 );
  } );

  test( 'should preserve reviewCount on recycled words', () => {
    const buckets = [
      Array.from( { 'length': 24 }, ( _, i ) => {
        return makeWord( { 'de': `active${i}` } );
      } ),
      [],
      [],
      [],
      [],
      [],
      makeWordsAtLevel( 5, 3 )
    ];

    /*
     * Need 1 word. Counter 0→1 → target level 0.
     * Level 0 has 0 words, level 3 has 5 but is not at target or 0.
     * Counter 7→8 would target level 3 (8 = 2^3), but we only
     * loop once (wordsNeeded=1). So no word gets pulled here.
     *
     * To test reviewCount preservation, use counter=7 so next
     * increment hits level 3 directly.
     */
    const newCounter = recallWords( buckets, 7 );

    // Counter 8 → target level 3. Level 3 has 5 (>= 5) → pull
    expect( buckets[ 0 ][ 24 ].reviewCount ).toBe( 3 );
    expect( newCounter ).toBe( 8 );
  } );

  test( 'should advance counter even when pulls are skipped', () => {
    const buckets = [
      Array.from( { 'length': 23 }, ( _, i ) => {
        return makeWord( { 'de': `active${i}` } );
      } ),
      [],
      [],
      [],
      [],
      [],
      makeWordsAtLevel( 2, 0 )
    ];

    // Need 2 words, but level 0 has only 2 (< 5). No pulls, counter still advances.
    const newCounter = recallWords( buckets, 10 );

    expect( newCounter ).toBe( 12 );
    expect( buckets[ 0 ] ).toHaveLength( 23 );
    expect( buckets[ 6 ] ).toHaveLength( 2 );
  } );

  test( 'should stop pulling when level drops below threshold mid-loop', () => {
    const buckets = [
      Array.from( { 'length': 18 }, ( _, i ) => {
        return makeWord( { 'de': `active${i}` } );
      } ),
      [],
      [],
      [],
      [],
      [],
      makeWordsAtLevel( 5, 0 )
    ];

    /*
     * Need 7 words but level 0 starts with exactly 5. Counter 1 →
     * target level 0: 5 >= 5 → pull (4 left). Now level 0 has 4 < 5,
     * so all subsequent pull attempts return null. Only 1 word moved.
     */
    const newCounter = recallWords( buckets, 0 );

    expect( buckets[ 0 ] ).toHaveLength( 19 );
    expect( buckets[ 6 ] ).toHaveLength( 4 );
    expect( newCounter ).toBe( 7 );
  } );

  test( 'should handle legacy words with unknown properties without crashing', () => {
    const legacyWords = Array.from( { 'length': 5 }, ( _, i ) => {
      return makeWord( {
        'de': `legacy${i}`,
        'doneAt': 1000,
        'unknownLegacy': 'junk'
      } );
    } );

    const buckets = [
      Array.from( { 'length': 24 }, ( _, i ) => {
        return makeWord( { 'de': `active${i}` } );
      } ),
      [],
      [],
      [],
      [],
      [],
      legacyWords
    ];

    // Legacy words have no reviewCount → treated as level 0. 5 words (>= 5).
    const newCounter = recallWords( buckets, 0 );

    expect( buckets[ 0 ][ 24 ].de ).toBe( 'legacy0' );
    expect( newCounter ).toBe( 1 );
  } );
} );
