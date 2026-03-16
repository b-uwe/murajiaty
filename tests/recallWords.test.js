/**
 * @file Tests for smart vocabulary recycling from the DONE bucket
 * using binary frequency-based level targeting.
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
      [
        makeWord( { 'de': 'done1',
          'reviewCount': 0 } )
      ]
    ];

    const newCounter = recallWords( buckets, 0 );

    expect( buckets[ 0 ] ).toHaveLength( 25 );
    expect( buckets[ 6 ] ).toHaveLength( 1 );
    expect( newCounter ).toBe( 0 );
  } );

  test( 'should pull words to reach 25 active when below target', () => {
    const doneWords = Array.from( { 'length': 10 }, ( _, i ) => {
      return makeWord( { 'de': `done${i}`,
        'reviewCount': 0 } );
    } );

    const buckets = [
      Array.from( { 'length': 20 }, ( _, i ) => {
        return makeWord( { 'de': `active${i}` } );
      } ),
      [],
      [],
      [],
      [],
      [],
      [ ...doneWords ]
    ];

    const newCounter = recallWords( buckets, 0 );

    // 25 active words target minus 20 existing = pull 5
    expect( buckets[ 0 ] ).toHaveLength( 25 );
    expect( buckets[ 6 ] ).toHaveLength( 5 );
    expect( newCounter ).toBe( 5 );
  } );

  test( 'should target words matching the binary frequency level', () => {
    const buckets = [
      [],
      [],
      [],
      [],
      [],
      [],
      [
        makeWord( { 'de': 'level0',
          'reviewCount': 0 } ),
        makeWord( { 'de': 'level1',
          'reviewCount': 1 } ),
        makeWord( { 'de': 'level2',
          'reviewCount': 2 } )
      ]
    ];

    // Counter 0 → counter becomes 1 → level 0 (odd) → picks level0 word
    const newCounter = recallWords( buckets, 0 );

    expect( buckets[ 0 ] ).toHaveLength( 3 );
    expect( newCounter ).toBe( 3 );
  } );

  test( 'should fall back to lower levels when target level has no words', () => {
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
        makeWord( { 'de': 'only-level0',
          'reviewCount': 0 } ),
        makeWord( { 'de': 'also-level0',
          'reviewCount': 0 } )
      ]
    ];

    // Need 1 word. Counter 0→1 → level 0. Finds level0 word.
    const newCounter = recallWords( buckets, 0 );

    expect( buckets[ 0 ] ).toHaveLength( 25 );
    expect( buckets[ 6 ] ).toHaveLength( 1 );
    expect( newCounter ).toBe( 1 );
  } );

  test( 'should fall back to lowest available reviewCount when no match at or below target', () => {
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
        makeWord( { 'de': 'high-level',
          'reviewCount': 5 } )
      ]
    ];

    // Need 1 word. Counter 0→1 → level 0. No level 0 words. Fallback to lowest available (5).
    const newCounter = recallWords( buckets, 0 );

    expect( buckets[ 0 ] ).toHaveLength( 25 );
    expect( buckets[ 0 ][ 24 ].de ).toBe( 'high-level' );
    expect( newCounter ).toBe( 1 );
  } );

  test( 'should pull all available when DONE bucket has fewer than needed', () => {
    const buckets = [
      Array.from( { 'length': 22 }, ( _, i ) => {
        return makeWord( { 'de': `active${i}` } );
      } ),
      [],
      [],
      [],
      [],
      [],
      [
        makeWord( { 'de': 'done1',
          'reviewCount': 0 } ),
        makeWord( { 'de': 'done2',
          'reviewCount': 0 } )
      ]
    ];

    const newCounter = recallWords( buckets, 0 );

    // Need 3 to reach 25, but only 2 available - pull both
    expect( buckets[ 0 ] ).toHaveLength( 24 );
    expect( buckets[ 6 ] ).toHaveLength( 0 );
    expect( newCounter ).toBe( 2 );
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
      Array.from( { 'length': 10 }, ( _, i ) => {
        return makeWord( { 'de': `done_${i}`,
          'reviewCount': 0 } );
      } )
    ];

    // 5+5+5+5+3+2 = 25 active, should not pull any
    const newCounter = recallWords( buckets, 10 );

    expect( buckets[ 6 ] ).toHaveLength( 10 );
    expect( newCounter ).toBe( 10 );
  } );

  test( 'should preserve reviewCount on recycled words', () => {
    const buckets = [
      [],
      [],
      [],
      [],
      [],
      [],
      [
        makeWord( { 'de': 'recycled',
          'reviewCount': 3 } )
      ]
    ];

    recallWords( buckets, 0 );

    expect( buckets[ 0 ][ 0 ].de ).toBe( 'recycled' );
    expect( buckets[ 0 ][ 0 ].reviewCount ).toBe( 3 );
  } );

  test( 'should increment counter by number of words actually pulled', () => {
    const buckets = [
      Array.from( { 'length': 23 }, ( _, i ) => {
        return makeWord( { 'de': `active${i}` } );
      } ),
      [],
      [],
      [],
      [],
      [],
      Array.from( { 'length': 5 }, ( _, i ) => {
        return makeWord( { 'de': `done${i}`,
          'reviewCount': 0 } );
      } )
    ];

    // Need 2 to reach 25, start counter at 10
    const newCounter = recallWords( buckets, 10 );

    expect( newCounter ).toBe( 12 );
    expect( buckets[ 0 ] ).toHaveLength( 25 );
  } );

  test( 'should handle legacy words with doneAt but no reviewCount', () => {
    const buckets = [
      [],
      [],
      [],
      [],
      [],
      [],
      [
        makeWord( { 'de': 'legacy',
          'doneAt': 1000 } )
      ]
    ];

    recallWords( buckets, 0 );

    expect( buckets[ 0 ][ 0 ].de ).toBe( 'legacy' );

    /*
     * Legacy word without reviewCount is treated as reviewCount 0 by findWordForLevel.
     * doneAt persists — parseStoredWord strips it on next restore.
     */
    expect( buckets[ 0 ][ 0 ].doneAt ).toBe( 1000 );
  } );
} );
