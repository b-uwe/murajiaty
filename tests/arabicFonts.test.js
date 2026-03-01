/**
 * @file Tests for Arabic font cycling feature
 */

const { ARABIC_FONTS, pickRandomArabicFont } = require( '../main.js' );

describe( 'ARABIC_FONTS', () => {
  test( 'should contain exactly 5 entries (4 Google Fonts + default)', () => {
    expect( ARABIC_FONTS ).toHaveLength( 5 );
  } );

  test( 'should include null as the default font option', () => {
    expect( ARABIC_FONTS ).toContain( null );
  } );

  test( 'should include the four selected Google Fonts', () => {
    expect( ARABIC_FONTS ).toContain( 'Fustat' );
    expect( ARABIC_FONTS ).toContain( 'Reem Kufi' );
    expect( ARABIC_FONTS ).toContain( 'Cairo' );
    expect( ARABIC_FONTS ).toContain( 'Changa' );
  } );
} );

describe( 'pickRandomArabicFont', () => {
  test( 'should return a value from the ARABIC_FONTS array', () => {
    for ( let i = 0; i < 50; i++ ) {
      const font = pickRandomArabicFont();
      expect( ARABIC_FONTS ).toContain( font );
    }
  } );

  test( 'should produce different fonts over multiple calls (probabilistic)', () => {
    const uniqueResults = new Set();
    const maxAttempts = 100;

    for ( let attempt = 0; attempt < maxAttempts; attempt++ ) {
      uniqueResults.add( pickRandomArabicFont() );
      if ( uniqueResults.size >= 3 ) {
        break;
      }
    }

    expect( uniqueResults.size ).toBeGreaterThanOrEqual( 3 );
  } );

  test( 'should eventually return null (default font)', () => {
    let foundNull = false;

    for ( let i = 0; i < 200; i++ ) {
      if ( pickRandomArabicFont() === null ) {
        foundNull = true;
        break;
      }
    }

    expect( foundNull ).toBe( true );
  } );

  test( 'should eventually return a named Google Font', () => {
    let foundNamed = false;

    for ( let i = 0; i < 200; i++ ) {
      if ( pickRandomArabicFont() !== null ) {
        foundNamed = true;
        break;
      }
    }

    expect( foundNamed ).toBe( true );
  } );
} );
