/**
 * @file Tests for 4-language flip cycle helpers (cycleOrderFor, promptLangFor).
 */

const { cycleOrderFor, promptLangFor } = require( '../app-utils.js' );

describe( 'promptLangFor', () => {
  test( 'bucket 0 is German prompt', () => {
    expect( promptLangFor( 0 ) ).toBe( 'de' );
  } );

  test( 'bucket 1 is English prompt', () => {
    expect( promptLangFor( 1 ) ).toBe( 'en' );
  } );

  test( 'bucket 2 is Spanish prompt', () => {
    expect( promptLangFor( 2 ) ).toBe( 'es' );
  } );

  test( 'bucket 3 is Arabic prompt', () => {
    expect( promptLangFor( 3 ) ).toBe( 'ar' );
  } );

  test( 'bucket 4 is Arabic prompt (normalised with bucket 3)', () => {
    /*
     * Behaviour change: bucket 4 used to start on the Arabic typing widget
     * (effectively treated as non-AR for flip purposes). Under the unified
     * cycle it is treated like bucket 3.
     */
    expect( promptLangFor( 4 ) ).toBe( 'ar' );
  } );

  test( 'bucket 5 is Arabic prompt', () => {
    expect( promptLangFor( 5 ) ).toBe( 'ar' );
  } );
} );

describe( 'cycleOrderFor', () => {
  test( 'DE prompt cycle visits de, ar, en, es in order', () => {
    expect( cycleOrderFor( 'de' ) ).toEqual( [ 'de', 'ar', 'en', 'es' ] );
  } );

  test( 'EN prompt cycle visits en, ar, de, es in order', () => {
    expect( cycleOrderFor( 'en' ) ).toEqual( [ 'en', 'ar', 'de', 'es' ] );
  } );

  test( 'ES prompt cycle visits es, ar, de, en in order', () => {
    expect( cycleOrderFor( 'es' ) ).toEqual( [ 'es', 'ar', 'de', 'en' ] );
  } );

  test( 'AR prompt cycle visits ar, de, en, es in order', () => {
    expect( cycleOrderFor( 'ar' ) ).toEqual( [ 'ar', 'de', 'en', 'es' ] );
  } );

  test( 'returned cycle always starts with the prompt language', () => {
    for ( const lang of [ 'de', 'en', 'es', 'ar' ] ) {
      expect( cycleOrderFor( lang )[ 0 ] ).toBe( lang );
    }
  } );

  test( 'returned cycle always contains all four languages exactly once', () => {
    for ( const lang of [ 'de', 'en', 'es', 'ar' ] ) {
      expect( [ ...cycleOrderFor( lang ) ].sort() ).toEqual( [ 'ar', 'de', 'en', 'es' ] );
    }
  } );

  test( 'first step after prompt is always Arabic (the primary answer)', () => {
    // Preserves the "1st ↩️ press = prompt ↔ primary answer" muscle memory.
    expect( cycleOrderFor( 'de' )[ 1 ] ).toBe( 'ar' );
    expect( cycleOrderFor( 'en' )[ 1 ] ).toBe( 'ar' );
    expect( cycleOrderFor( 'es' )[ 1 ] ).toBe( 'ar' );
    // For AR prompts the primary answer is DE.
    expect( cycleOrderFor( 'ar' )[ 1 ] ).toBe( 'de' );
  } );

  test( 'returns a fresh array (does not share mutable state between calls)', () => {
    const a = cycleOrderFor( 'de' );
    const b = cycleOrderFor( 'de' );
    a[ 0 ] = 'mutated';
    expect( b[ 0 ] ).toBe( 'de' );
  } );
} );
