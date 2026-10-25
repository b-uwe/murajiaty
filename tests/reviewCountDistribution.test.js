/**
 * @file Tests for the per-word reviewCount distribution helper that
 * feeds the distribution line shown above the bucket counts.
 */

const { reviewCountDistribution } = require( '../vocab-logic.js' );

/**
 * Builds a bucket structure from a flat list of reviewCount values.
 * @param {Array<number>} counts - reviewCount value for each word
 * @returns {Array<Array<object>>} A single-bucket structure holding the words
 */
const bucketsFrom = ( counts ) => {
  return [
    counts.map( ( reviewCount ) => {
      return { 'de': 'x',
        'ar': 'x',
        'en': 'x',
        'es': 'x',
        reviewCount };
    } )
  ];
};

describe( 'reviewCountDistribution', () => {
  it( 'returns an empty array when there are no words', () => {
    expect( reviewCountDistribution( [ [], [], [] ] ) ).toEqual( [] );
  } );

  it( 'counts words per reviewCount level starting at zero', () => {
    const buckets = bucketsFrom( [ 0, 0, 1, 1, 1, 2 ] );
    expect( reviewCountDistribution( buckets ) ).toEqual( [ 2, 3, 1 ] );
  } );

  it( 'fills gaps between levels with zero', () => {
    const buckets = bucketsFrom( [ 0, 3 ] );
    expect( reviewCountDistribution( buckets ) ).toEqual( [ 1, 0, 0, 1 ] );
  } );

  it( 'aggregates words across every bucket', () => {
    const buckets = [
      bucketsFrom( [ 1, 1 ] )[ 0 ],
      bucketsFrom( [ 0, 2 ] )[ 0 ]
    ];
    expect( reviewCountDistribution( buckets ) ).toEqual( [ 1, 2, 1 ] );
  } );

  it( 'treats a missing reviewCount as level zero', () => {
    const buckets = [
      [
        { 'de': 'x',
          'ar': 'x',
          'en': 'x',
          'es': 'x' }
      ]
    ];
    expect( reviewCountDistribution( buckets ) ).toEqual( [ 1 ] );
  } );
} );
