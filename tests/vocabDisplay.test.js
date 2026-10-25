/**
 * @file Tests for the vocabulary view's display logic.
 * vocab-logic.js is required first so vocab.js finds window.VocabLogic
 * ( jsdom provides the window the browser branch assigns onto ).
 */

require( '../vocab-logic.js' );
const { displayArabic } = require( '../vocab.js' );

describe( 'displayArabic', () => {
  test( 'keeps diacritics when they are enabled', () => {
    expect( displayArabic( { 'ar': 'كِتَاب' }, true ) ).toBe( 'كِتَاب' );
  } );

  test( 'strips diacritics when they are disabled', () => {
    expect( displayArabic( { 'ar': 'كِتَاب' }, false ) ).toBe( 'كتاب' );
  } );
} );
