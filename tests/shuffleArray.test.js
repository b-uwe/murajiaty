/**
 * @file Tests for shuffleArray utility function
 */

const { shuffleArray } = require( '../main.js' );

describe( 'shuffleArray', () => {
  test( 'should return the same array reference', () => {
    const arr = [ 1, 2, 3, 4, 5 ];
    const result = shuffleArray( arr );
    expect( result ).toBe( arr ); // Same reference
  } );

  test( 'should preserve all original elements', () => {
    const arr = [ 'a', 'b', 'c', 'd', 'e' ];
    const original = [ ...arr ];
    shuffleArray( arr );
    
    // Check that all original elements are still present
    expect( arr ).toHaveLength( original.length );
    original.forEach( ( element ) => {
      expect( arr ).toContain( element );
    } );
  } );

  test( 'should handle empty array', () => {
    const arr = [];
    const result = shuffleArray( arr );
    expect( result ).toEqual( [] );
    expect( result ).toBe( arr );
  } );

  test( 'should handle single element array', () => {
    const arr = [ 'only' ];
    const result = shuffleArray( arr );
    expect( result ).toEqual( [ 'only' ] );
    expect( result ).toBe( arr );
  } );

  test( 'should handle two element array', () => {
    const arr = [ 'first', 'second' ];
    const result = shuffleArray( arr );
    expect( result ).toHaveLength( 2 );
    expect( result ).toContain( 'first' );
    expect( result ).toContain( 'second' );
  } );

  test( 'should work with different data types', () => {
    const arr = [ 1, 'string', { 'key': 'value' }, null, true ];
    const original = [ ...arr ];
    shuffleArray( arr );
    
    expect( arr ).toHaveLength( 5 );
    original.forEach( ( element ) => {
      expect( arr ).toContain( element );
    } );
  } );

  test( 'should work with vocabulary word objects', () => {
    const words = [
      { 'ar': 'كتاب', 'de': 'Buch' },
      { 'ar': 'قلم', 'de': 'Stift' },
      { 'ar': 'بيت', 'de': 'Haus' }
    ];
    const original = [ ...words ];
    shuffleArray( words );
    
    expect( words ).toHaveLength( 3 );
    original.forEach( ( word ) => {
      expect( words ).toContainEqual( word );
    } );
  } );

  test( 'should modify array in place', () => {
    const arr = [ 1, 2, 3, 4, 5, 6, 7, 8, 9, 10 ];
    const originalReference = arr;
    shuffleArray( arr );
    
    expect( arr ).toBe( originalReference );
    expect( arr ).toHaveLength( 10 );
  } );

  test( 'should produce different arrangements on multiple calls (probabilistic)', () => {
    // This test checks that shuffling produces variation
    // Note: There's a small chance this could fail due to randomness
    const original = [ 1, 2, 3, 4, 5, 6, 7, 8 ];
    const results = [];
    
    // Run shuffle multiple times and collect results
    for ( let i = 0; i < 10; i++ ) {
      const arr = [ ...original ];
      shuffleArray( arr );
      results.push( JSON.stringify( arr ) );
    }
    
    // Check that we got at least some different arrangements
    const uniqueResults = new Set( results );
    expect( uniqueResults.size ).toBeGreaterThan( 1 );
  } );
} );