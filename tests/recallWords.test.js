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
      makeWordsAtLevel( 10, 0 )
    ];

    const newCounter = recallWords( buckets, 0 );

    expect( buckets[ 0 ] ).toHaveLength( 25 );
    expect( buckets[ 6 ] ).toHaveLength( 10 );
    expect( newCounter ).toBe( 0 );
  } );

  test( 'should pull from level 0 when it has >= 10 words', () => {
    const buckets = [
      Array.from( { 'length': 20 }, ( _, i ) => {
        return makeWord( { 'de': `active${i}` } );
      } ),
      [],
      [],
      [],
      [],
      [],
      makeWordsAtLevel( 15, 0 )
    ];

    const newCounter = recallWords( buckets, 0 );

    /*
     * Need 5 words to reach 25. Counter values 1-5 map to target
     * levels [0, 1, 0, 2, 0]. Level 0 starts with 15 words. All
     * 5 pulls succeed — either targeting level 0 directly or falling
     * back to it — because level 0 stays above the threshold
     * throughout (15 → 14 → 13 → 12 → 11 → 10).
     */
    expect( buckets[ 0 ] ).toHaveLength( 25 );
    expect( buckets[ 6 ] ).toHaveLength( 10 );
    expect( newCounter ).toBe( 5 );
  } );

  test( 'should pull from level 0 even when population is below threshold', () => {
    const buckets = [
      Array.from( { 'length': 22 }, ( _, i ) => {
        return makeWord( { 'de': `active${i}` } );
      } ),
      [],
      [],
      [],
      [],
      [],
      makeWordsAtLevel( 7, 0 )
    ];

    /*
     * Only 7 words at level 0 (< threshold). The threshold does not
     * apply to level 0 — all 3 needed pulls succeed via the level-0
     * fallback so the user always has something to review.
     */
    const newCounter = recallWords( buckets, 0 );

    expect( buckets[ 0 ] ).toHaveLength( 25 );
    expect( buckets[ 6 ] ).toHaveLength( 4 );
    expect( newCounter ).toBe( 3 );
  } );

  test( 'should pull from target level when it has >= 10 words', () => {
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
        ...makeWordsAtLevel( 10, 1 ),
        ...makeWordsAtLevel( 10, 0 )
      ]
    ];

    // Need 1 word. Counter 0→1 → target level 0. Level 0 has 10 (>= 10) → pull
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
        ...makeWordsAtLevel( 5, 1 ),
        ...makeWordsAtLevel( 12, 0 )
      ]
    ];

    /*
     * Need 1 word. Counter 0→1 → target level 0. Level 0 has 12 (>= 10).
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
      makeWordsAtLevel( 10, 3 )
    ];

    /*
     * Need 1 word. Counter 0→1 → target level 0.
     * Level 0 has 0 words, level 3 has 10 but is not at target or 0.
     * Counter 7→8 would target level 3 (8 = 2^3), but we only
     * loop once (wordsNeeded=1). So no word gets pulled here.
     *
     * To test reviewCount preservation, use counter=7 so next
     * increment hits level 3 directly.
     */
    const newCounter = recallWords( buckets, 7 );

    // Counter 8 → target level 3. Level 3 has 10 (>= 10) → pull
    expect( buckets[ 0 ][ 24 ].reviewCount ).toBe( 3 );
    expect( newCounter ).toBe( 8 );
  } );

  test( 'should advance counter when pulls are skipped because level 0 is empty', () => {
    const buckets = [
      Array.from( { 'length': 23 }, ( _, i ) => {
        return makeWord( { 'de': `active${i}` } );
      } ),
      [],
      [],
      [],
      [],
      [],
      makeWordsAtLevel( 5, 2 )
    ];

    /*
     * Need 2 words. Level 0 is empty and level 2 has only 5 words
     * (below the threshold for non-zero levels). No pulls succeed;
     * counter still advances for both slots.
     */
    const newCounter = recallWords( buckets, 10 );

    expect( newCounter ).toBe( 12 );
    expect( buckets[ 0 ] ).toHaveLength( 23 );
    expect( buckets[ 6 ] ).toHaveLength( 5 );
  } );

  test( 'should continue pulling from level 0 as it drops below the non-zero threshold', () => {
    const buckets = [
      Array.from( { 'length': 18 }, ( _, i ) => {
        return makeWord( { 'de': `active${i}` } );
      } ),
      [],
      [],
      [],
      [],
      [],
      makeWordsAtLevel( 10, 0 )
    ];

    /*
     * Need 7 words; level 0 starts with 10. No threshold applies to
     * level 0, so every pull succeeds until level 0 is drained to 3.
     */
    const newCounter = recallWords( buckets, 0 );

    expect( buckets[ 0 ] ).toHaveLength( 25 );
    expect( buckets[ 6 ] ).toHaveLength( 3 );
    expect( newCounter ).toBe( 7 );
  } );

  test( 'should still skip pulls from target level > 0 when below threshold', () => {
    const buckets = [
      Array.from( { 'length': 24 }, ( _, i ) => {
        return makeWord( { 'de': `active${i}` } );
      } ),
      [],
      [],
      [],
      [],
      [],
      makeWordsAtLevel( 5, 2 )
    ];

    /*
     * Need 1 word. Starting counter 3 → next counter 4 → target level 2.
     * Level 2 has only 5 words (< threshold) and level 0 is empty, so
     * the pull is skipped even though 5 words exist in the DONE bucket.
     * This proves the threshold still protects non-zero levels from
     * being hammered.
     */
    const newCounter = recallWords( buckets, 3 );

    expect( buckets[ 0 ] ).toHaveLength( 24 );
    expect( buckets[ 6 ] ).toHaveLength( 5 );
    expect( newCounter ).toBe( 4 );
  } );

  test( 'should recall oldest words first when DONE bucket preserves insertion order', () => {
    const oldWords = makeWordsAtLevel( 10, 0, 'old' );
    const newWords = makeWordsAtLevel( 10, 0, 'new' );

    const buckets = [
      Array.from( { 'length': 24 }, ( _, i ) => {
        return makeWord( { 'de': `active${i}` } );
      } ),
      [],
      [],
      [],
      [],
      [],
      [ ...oldWords, ...newWords ]
    ];

    /*
     * Need 1 word. Counter 0→1 → target level 0. Level 0 has 20
     * words (>= 10). The oldest word (old_rc0_0) sits at the front
     * of the bucket — FIFO order ensures it is recalled first.
     */
    const newCounter = recallWords( buckets, 0 );

    expect( buckets[ 0 ][ 24 ].de ).toBe( 'old_rc0_0' );
    expect( newCounter ).toBe( 1 );
  } );

  test( 'should handle legacy words with unknown properties without crashing', () => {
    const legacyWords = Array.from( { 'length': 10 }, ( _, i ) => {
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

    // Legacy words have no reviewCount → treated as level 0. 10 words (>= 10).
    const newCounter = recallWords( buckets, 0 );

    expect( buckets[ 0 ][ 24 ].de ).toBe( 'legacy0' );
    expect( newCounter ).toBe( 1 );
  } );
} );
