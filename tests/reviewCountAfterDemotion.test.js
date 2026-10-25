/**
 * @file Unit tests for reviewCountAfterDemotion
 */

const { reviewCountAfterDemotion } = require( '../vocab-logic.js' );

describe( 'reviewCountAfterDemotion', () => {
  test( 'drops the reviewCount by 1 when demoted within bucket 0', () => {
    expect( reviewCountAfterDemotion( { 'reviewCount': 3 }, 0 ) ).toBe( 2 );
  } );

  test( 'never drops below 0 in bucket 0', () => {
    expect( reviewCountAfterDemotion( { 'reviewCount': 0 }, 0 ) ).toBe( 0 );
  } );

  test( 'treats a missing reviewCount as 0 in bucket 0', () => {
    expect( reviewCountAfterDemotion( {}, 0 ) ).toBe( 0 );
  } );

  test( 'leaves the reviewCount unchanged when demoted from bucket 1', () => {
    expect( reviewCountAfterDemotion( { 'reviewCount': 3 }, 1 ) ).toBe( 3 );
  } );

  test( 'leaves the reviewCount unchanged when demoted from a later bucket', () => {
    expect( reviewCountAfterDemotion( { 'reviewCount': 2 }, 5 ) ).toBe( 2 );
  } );

  test( 'treats a missing reviewCount as 0 outside bucket 0', () => {
    expect( reviewCountAfterDemotion( {}, 2 ) ).toBe( 0 );
  } );
} );
