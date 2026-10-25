/**
 * @file Unit tests for formatDistribution
 */

const { formatDistribution } = require( '../vocab-logic.js' );

describe( 'formatDistribution', () => {
  test( 'wraps the highlighted level in angle brackets', () => {
    expect( formatDistribution( [ 64, 203, 65, 43, 22 ], 2 ) ).toBe( '64 203 <65> 43 22' );
  } );

  test( 'highlights the first level', () => {
    expect( formatDistribution( [ 64, 203 ], 0 ) ).toBe( '<64> 203' );
  } );

  test( 'highlights the last level', () => {
    expect( formatDistribution( [ 64, 203, 22 ], 2 ) ).toBe( '64 203 <22>' );
  } );

  test( 'highlights nothing when the level is null', () => {
    expect( formatDistribution( [ 64, 203 ], null ) ).toBe( '64 203' );
  } );

  test( 'highlights nothing when the level is out of range', () => {
    expect( formatDistribution( [ 64, 203 ], 5 ) ).toBe( '64 203' );
  } );

  test( 'returns an empty string for an empty distribution', () => {
    expect( formatDistribution( [], 0 ) ).toBe( '' );
  } );
} );
