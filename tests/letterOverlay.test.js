/**
 * @file Tests for letter overlay HTML generation showing all Arabic fonts
 */

const { buildLetterOverlayHTML, ARABIC_FONTS } = require( '../app-utils.js' );

// Fatha, Kasra, Damma
const DIACRITICS = [ '\u064E', '\u0650', '\u064F' ];

describe( 'buildLetterOverlayHTML', () => {
  test( 'should return a string', () => {
    const result = buildLetterOverlayHTML( 'ف', DIACRITICS, ARABIC_FONTS );
    expect( typeof result ).toBe( 'string' );
  } );

  test( 'should contain the isolated letter once per font in the top row', () => {
    const result = buildLetterOverlayHTML( 'ب', DIACRITICS, ARABIC_FONTS );
    const topRowMatch = result.match( /class="letter-top-row"/u );
    expect( topRowMatch ).not.toBeNull();

    // Each font gets a span with the isolated letter
    for ( const font of ARABIC_FONTS ) {
      if ( font === '' ) {
        expect( result ).toContain( '<span class="letter-font-sample">ب</span>' );
      } else {
        expect( result ).toContain( `font-family: ${font}` );
      }
    }
  } );

  test( 'should include spacers between letters in the top row', () => {
    const result = buildLetterOverlayHTML( 'ف', DIACRITICS, ARABIC_FONTS );
    const spacerCount = ( result.match( /class="letter-spacer"/gu ) || [] ).length;
    // 5 fonts = 4 spacers between them
    expect( spacerCount ).toBe( ARABIC_FONTS.length - 1 );
  } );

  test( 'should have one diacritics row per font', () => {
    const result = buildLetterOverlayHTML( 'ن', DIACRITICS, ARABIC_FONTS );
    const rowCount = ( result.match( /class="letter-diacritics-row"/gu ) || [] ).length;
    expect( rowCount ).toBe( ARABIC_FONTS.length );
  } );

  test( 'should show fatha, kasra, and damma forms in each diacritics row', () => {
    const letter = 'ت';
    const result = buildLetterOverlayHTML( letter, DIACRITICS, ARABIC_FONTS );
    // Each row should contain the letter combined with each diacritic
    for ( const d of DIACRITICS ) {
      const combined = letter + d;
      const occurrences = ( result.match( new RegExp( combined, 'gu' ) ) || [] ).length;
      // Once per font row
      expect( occurrences ).toBe( ARABIC_FONTS.length );
    }
  } );

  test( 'should apply correct font-family style to each diacritics row', () => {
    const result = buildLetterOverlayHTML( 'ع', DIACRITICS, ARABIC_FONTS );
    // Named fonts should appear as font-family in diacritics rows
    for ( const font of ARABIC_FONTS ) {
      if ( font !== '' ) {
        const pattern = `class="letter-diacritics-row" style="font-family: ${font}"`;
        expect( result ).toContain( pattern );
      }
    }
  } );

  test( 'should not set font-family for the system default diacritics row', () => {
    const result = buildLetterOverlayHTML( 'ع', DIACRITICS, ARABIC_FONTS );
    // The system default row should have no inline style
    expect( result ).toContain( 'class="letter-diacritics-row">' );
  } );

  test( 'should work with a single font', () => {
    const result = buildLetterOverlayHTML( 'ك', DIACRITICS, [ 'Cairo' ] );
    const spacerCount = ( result.match( /class="letter-spacer"/gu ) || [] ).length;
    expect( spacerCount ).toBe( 0 );
    const rowCount = ( result.match( /class="letter-diacritics-row"/gu ) || [] ).length;
    expect( rowCount ).toBe( 1 );
  } );
} );
