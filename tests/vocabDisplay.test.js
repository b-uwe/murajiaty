/* global window */

/**
 * @file Tests for the vocabulary view's display logic. VocabLogic and a
 * stubbed UIHelpers are placed on the jsdom window before vocab.js
 * destructures them, inside beforeAll where the jsdom window is active.
 */

let displayArabic;

beforeAll( () => {
  require( '../vocab-logic.js' );
  window.UIHelpers = { 'speakWord': jest.fn() };
  ( { displayArabic } = require( '../vocab.js' ) );
} );

describe( 'displayArabic', () => {
  test( 'keeps diacritics when they are enabled', () => {
    expect( displayArabic( { 'ar': 'كِتَاب' }, true ) ).toBe( 'كِتَاب' );
  } );

  test( 'strips diacritics when they are disabled', () => {
    expect( displayArabic( { 'ar': 'كِتَاب' }, false ) ).toBe( 'كتاب' );
  } );
} );
