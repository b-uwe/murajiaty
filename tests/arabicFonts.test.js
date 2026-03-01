/**
 * @file Tests for Arabic font cycling feature
 */

const { ARABIC_FONTS, pickRandomArabicFont } = require( '../main.js' );

describe( 'ARABIC_FONTS', () => {
  test( 'should contain exactly 5 entries (4 fonts + default)', () => {
    expect( ARABIC_FONTS ).toHaveLength( 5 );
  } );

  test( 'should include empty string as the default font option', () => {
    expect( ARABIC_FONTS ).toContain( '' );
  } );

  test( 'should include the four selected Arabic fonts', () => {
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

  test( 'should select fonts based on Math.random value', () => {
    const spy = jest.spyOn( Math, 'random' );

    spy.mockReturnValue( 0 );
    expect( pickRandomArabicFont() ).toBe( '' );

    spy.mockReturnValue( 0.25 );
    expect( pickRandomArabicFont() ).toBe( 'Fustat' );

    spy.mockReturnValue( 0.5 );
    expect( pickRandomArabicFont() ).toBe( 'Reem Kufi' );

    spy.mockReturnValue( 0.75 );
    expect( pickRandomArabicFont() ).toBe( 'Cairo' );

    spy.mockReturnValue( 0.99 );
    expect( pickRandomArabicFont() ).toBe( 'Changa' );

    spy.mockRestore();
  } );

  test( 'should return empty string for system default font', () => {
    const spy = jest.spyOn( Math, 'random' ).mockReturnValue( 0 );
    expect( pickRandomArabicFont() ).toBe( '' );
    spy.mockRestore();
  } );

  test( 'should return a named font for non-zero random values', () => {
    const spy = jest.spyOn( Math, 'random' ).mockReturnValue( 0.5 );
    const font = pickRandomArabicFont();
    expect( font ).not.toBe( '' );
    expect( ARABIC_FONTS ).toContain( font );
    spy.mockRestore();
  } );
} );
