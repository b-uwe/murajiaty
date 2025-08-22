/**
 * @file Tests for constants and simple data structures
 */

const { flags, COMMON_ARABIC_DIACRITICS } = require( '../main.js' );

describe( 'Constants', () => {
  describe( 'flags', () => {
    test( 'should contain exactly 3 flag emojis', () => {
      expect( flags ).toHaveLength( 3 );
    } );

    test( 'should contain correct language flag emojis in order: Spanish, German, English', () => {
      expect( flags[ 0 ] ).toBe( '🇪🇸' ); // Spanish
      expect( flags[ 1 ] ).toBe( '🇩🇪' ); // German  
      expect( flags[ 2 ] ).toBe( '🇺🇸' ); // English/US
    } );

    test( 'should be an array of strings', () => {
      expect( Array.isArray( flags ) ).toBe( true );
      flags.forEach( ( flag ) => {
        expect( typeof flag ).toBe( 'string' );
      } );
    } );
  } );

  describe( 'COMMON_ARABIC_DIACRITICS', () => {
    test( 'should contain exactly 4 diacritical marks', () => {
      expect( COMMON_ARABIC_DIACRITICS ).toHaveLength( 4 );
    } );

    test( 'should contain correct Arabic diacritics in order: Fatha, Kasra, Damma, Sukun', () => {
      expect( COMMON_ARABIC_DIACRITICS[ 0 ] ).toBe( 'َ' ); // Fatha
      expect( COMMON_ARABIC_DIACRITICS[ 1 ] ).toBe( 'ِ' ); // Kasra
      expect( COMMON_ARABIC_DIACRITICS[ 2 ] ).toBe( 'ُ' ); // Damma
      expect( COMMON_ARABIC_DIACRITICS[ 3 ] ).toBe( 'ْ' ); // Sukun
    } );

    test( 'should be an array of strings', () => {
      expect( Array.isArray( COMMON_ARABIC_DIACRITICS ) ).toBe( true );
      COMMON_ARABIC_DIACRITICS.forEach( ( diacritic ) => {
        expect( typeof diacritic ).toBe( 'string' );
      } );
    } );

    test( 'should contain single-character diacritics', () => {
      COMMON_ARABIC_DIACRITICS.forEach( ( diacritic ) => {
        expect( diacritic ).toHaveLength( 1 );
      } );
    } );
  } );
} );