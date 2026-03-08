/**
 * @file Tests for smart vocabulary recycling from the DONE bucket
 */

const { recallWords } = require( '../main.js' );

/**
 * Creates a test vocabulary word with sensible defaults.
 * @param {object} overrides - Optional field overrides for the word
 * @returns {object} A vocabulary word object
 */
const makeWord = ( overrides = {} ) => ( {
  'ar': 'كتاب',
  'de': 'Buch',
  'en': 'book',
  'es': 'libro',
  ...overrides
} );

describe( 'recallWords', () => {
  test( 'should not pull any words when non-DONE buckets have 25 or more words', () => {
    const buckets = [
      Array.from( { 'length': 25 }, ( _, i ) => makeWord( { 'de': `word${i}` } ) ),
      [],
      [],
      [],
      [],
      [],
      [
        makeWord( { 'de': 'done1',
          'doneAt': 1000 } )
      ]
    ];

    recallWords( buckets );

    expect( buckets[ 0 ] ).toHaveLength( 25 );
    expect( buckets[ 6 ] ).toHaveLength( 1 );
  } );

  test( 'should pull words to reach 25 active when below target', () => {
    const doneWords = Array.from( { 'length': 10 }, ( _, i ) => makeWord( { 'de': `done${i}`,
      'doneAt': 1000 + i } ) );

    const buckets = [
      Array.from( { 'length': 20 }, ( _, i ) => makeWord( { 'de': `active${i}` } ) ),
      [],
      [],
      [],
      [],
      [],
      [ ...doneWords ]
    ];

    recallWords( buckets );

    // 25 active words target minus 20 existing = pull 5
    expect( buckets[ 0 ] ).toHaveLength( 25 );
    expect( buckets[ 6 ] ).toHaveLength( 5 );
  } );

  test( 'should pull words with the oldest doneAt timestamps first', () => {
    const buckets = [
      [],
      [],
      [],
      [],
      [],
      [],
      [
        makeWord( { 'de': 'newest',
          'doneAt': 3000 } ),
        makeWord( { 'de': 'oldest',
          'doneAt': 1000 } ),
        makeWord( { 'de': 'middle',
          'doneAt': 2000 } )
      ]
    ];

    recallWords( buckets );

    // All 3 should be pulled (we need 25, only 3 available)
    // But they should be added oldest-first
    expect( buckets[ 0 ][ 0 ].de ).toBe( 'oldest' );
    expect( buckets[ 0 ][ 1 ].de ).toBe( 'middle' );
    expect( buckets[ 0 ][ 2 ].de ).toBe( 'newest' );
    expect( buckets[ 6 ] ).toHaveLength( 0 );
  } );

  test( 'should pull all available when DONE bucket has fewer than needed', () => {
    const buckets = [
      Array.from( { 'length': 22 }, ( _, i ) => makeWord( { 'de': `active${i}` } ) ),
      [],
      [],
      [],
      [],
      [],
      [
        makeWord( { 'de': 'done1',
          'doneAt': 1000 } ),
        makeWord( { 'de': 'done2',
          'doneAt': 2000 } )
      ]
    ];

    recallWords( buckets );

    // Need 3 to reach 25, but only 2 available - pull both
    expect( buckets[ 0 ] ).toHaveLength( 24 );
    expect( buckets[ 6 ] ).toHaveLength( 0 );
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

    recallWords( buckets );

    expect( buckets[ 0 ] ).toHaveLength( 1 );
    expect( buckets[ 6 ] ).toHaveLength( 0 );
  } );

  test( 'should count words across all non-DONE buckets', () => {
    const buckets = [
      Array.from( { 'length': 5 }, ( _, i ) => makeWord( { 'de': `b0_${i}` } ) ),
      Array.from( { 'length': 5 }, ( _, i ) => makeWord( { 'de': `b1_${i}` } ) ),
      Array.from( { 'length': 5 }, ( _, i ) => makeWord( { 'de': `b2_${i}` } ) ),
      Array.from( { 'length': 5 }, ( _, i ) => makeWord( { 'de': `b3_${i}` } ) ),
      Array.from( { 'length': 3 }, ( _, i ) => makeWord( { 'de': `b4_${i}` } ) ),
      Array.from( { 'length': 2 }, ( _, i ) => makeWord( { 'de': `b5_${i}` } ) ),
      Array.from( { 'length': 10 }, ( _, i ) => makeWord( { 'de': `done_${i}`,
        'doneAt': 1000 + i } ) )
    ];

    // 5+5+5+5+3+2 = 25 active, should not pull any
    recallWords( buckets );

    expect( buckets[ 6 ] ).toHaveLength( 10 );
  } );

  test( 'should remove doneAt from recycled words', () => {
    const buckets = [
      [],
      [],
      [],
      [],
      [],
      [],
      [
        makeWord( { 'de': 'recycled',
          'doneAt': 1000 } )
      ]
    ];

    recallWords( buckets );

    expect( buckets[ 0 ][ 0 ].de ).toBe( 'recycled' );
    expect( buckets[ 0 ][ 0 ] ).not.toHaveProperty( 'doneAt' );
  } );

  test( 'should pull exactly enough to reach 25 active words', () => {
    const buckets = [
      Array.from( { 'length': 10 }, ( _, i ) => makeWord( { 'de': `active${i}` } ) ),
      [],
      [],
      Array.from( { 'length': 8 }, ( _, i ) => makeWord( { 'de': `mid${i}` } ) ),
      [],
      [],
      Array.from( { 'length': 20 }, ( _, i ) => makeWord( { 'de': `done${i}`,
        'doneAt': 1000 + i } ) )
    ];

    // 10 + 8 = 18 active, need 7 more
    recallWords( buckets );

    expect( buckets[ 0 ] ).toHaveLength( 17 );
    expect( buckets[ 6 ] ).toHaveLength( 13 );

    // Verify oldest 7 were pulled
    const pulledWords = buckets[ 0 ].slice( 10 );
    expect( pulledWords ).toHaveLength( 7 );
    expect( pulledWords[ 0 ].de ).toBe( 'done0' );
    expect( pulledWords[ 6 ].de ).toBe( 'done6' );
  } );

  test( 'should not modify the DONE bucket sort order for remaining items', () => {
    const buckets = [
      Array.from( { 'length': 23 }, ( _, i ) => makeWord( { 'de': `active${i}` } ) ),
      [],
      [],
      [],
      [],
      [],
      [
        makeWord( { 'de': 'newest',
          'doneAt': 3000 } ),
        makeWord( { 'de': 'oldest',
          'doneAt': 1000 } ),
        makeWord( { 'de': 'middle',
          'doneAt': 2000 } )
      ]
    ];

    // Need 2 more to reach 25, pull oldest and middle
    recallWords( buckets );

    expect( buckets[ 6 ] ).toHaveLength( 1 );
    expect( buckets[ 6 ][ 0 ].de ).toBe( 'newest' );
  } );
} );
