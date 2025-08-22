/**
 * @file Tests for CSV utility functions
 */

const { formatWordToCSVLine, parseCSVLineToWord } = require( '../main.js' );

describe( 'CSV Utilities', () => {
  describe( 'formatWordToCSVLine', () => {
    test( 'should format a complete word object into CSV line', () => {
      const word = {
        'ar': 'كتاب',
        'de': 'Buch',
        'en': 'book',
        'es': 'libro'
      };
      const bucketIndex = 2;
      const result = formatWordToCSVLine( word, bucketIndex );
      expect( result ).toBe( 'كتاب ; Buch ; book ; libro ; 2' );
    } );

    test( 'should handle word with empty translations', () => {
      const word = {
        'ar': 'مثال',
        'de': 'Beispiel',
        'en': '',
        'es': ''
      };
      const result = formatWordToCSVLine( word, 0 );
      expect( result ).toBe( 'مثال ; Beispiel ;  ;  ; 0' );
    } );

    test( 'should handle different bucket indices', () => {
      const word = { 'ar': 'test', 'de': 'test', 'en': 'test', 'es': 'test' };
      expect( formatWordToCSVLine( word, 0 ) ).toContain( ' ; 0' );
      expect( formatWordToCSVLine( word, 5 ) ).toContain( ' ; 5' );
    } );

    test( 'should maintain consistent separator format', () => {
      const word = { 'ar': 'a', 'de': 'b', 'en': 'c', 'es': 'd' };
      const result = formatWordToCSVLine( word, 1 );
      const parts = result.split( ' ; ' );
      expect( parts ).toHaveLength( 5 );
      expect( parts[ 0 ] ).toBe( 'a' );
      expect( parts[ 1 ] ).toBe( 'b' );
      expect( parts[ 2 ] ).toBe( 'c' );
      expect( parts[ 3 ] ).toBe( 'd' );
      expect( parts[ 4 ] ).toBe( '1' );
    } );
  } );

  describe( 'parseCSVLineToWord', () => {
    test( 'should parse a complete CSV line into word object', () => {
      const csvLine = 'كتاب ; Buch ; book ; libro ; 2';
      const result = parseCSVLineToWord( csvLine );
      expect( result ).toEqual( {
        'ar': 'كتاب',
        'de': 'Buch',
        'en': 'book',
        'es': 'libro',
        'bucketIndex': 2
      } );
    } );

    test( 'should return null for missing required fields', () => {
      const csvLine = 'مثال ; Beispiel'; // Missing English and Spanish
      const result = parseCSVLineToWord( csvLine );
      expect( result ).toBeNull(); // Should return null since not all languages are present
    } );

    test( 'should require all languages to be filled', () => {
      const csvLine = 'test ; test ;  ;  ; 3'; // Empty English and Spanish
      const result = parseCSVLineToWord( csvLine );
      expect( result ).toBeNull(); // Should return null since all languages must be filled
    } );

    test( 'should return null for invalid lines (missing any language)', () => {
      expect( parseCSVLineToWord( '  ;  ;  ;  ; 1' ) ).toBeNull(); // Missing all languages
      expect( parseCSVLineToWord( 'test ;  ;  ;  ; 1' ) ).toBeNull(); // Missing de, en, es
      expect( parseCSVLineToWord( '  ; test ;  ;  ; 1' ) ).toBeNull(); // Missing ar, en, es
      expect( parseCSVLineToWord( 'ar ; de ;  ; es ; 1' ) ).toBeNull(); // Missing en
      expect( parseCSVLineToWord( '' ) ).toBeNull(); // Empty line
    } );

    test( 'should parse bucket index correctly', () => {
      expect( parseCSVLineToWord( 'ar ; de ; en ; es ; 0' ).bucketIndex ).toBe( 0 );
      expect( parseCSVLineToWord( 'ar ; de ; en ; es ; 5' ).bucketIndex ).toBe( 5 );
      expect( parseCSVLineToWord( 'ar ; de ; en ; es ; -1' ).bucketIndex ).toBe( -1 );
    } );

    test( 'should default to bucket index 0 when not provided', () => {
      const result = parseCSVLineToWord( 'ar ; de ; en ; es' );
      expect( result.bucketIndex ).toBe( 0 );
    } );

    test( 'should handle special characters in text fields', () => {
      const csvLine = 'كَتَبَ ; schreiben ; write ; escribir ; 1';
      const result = parseCSVLineToWord( csvLine );
      expect( result.ar ).toBe( 'كَتَبَ' );
      expect( result.de ).toBe( 'schreiben' );
    } );
  } );

  describe( 'CSV round-trip consistency', () => {
    test( 'should maintain data integrity through format/parse cycle', () => {
      const originalWord = {
        'ar': 'مدرسة',
        'de': 'Schule',
        'en': 'school',
        'es': 'escuela'
      };
      const bucketIndex = 3;
      
      const csvLine = formatWordToCSVLine( originalWord, bucketIndex );
      const parsedWord = parseCSVLineToWord( csvLine );
      
      expect( parsedWord.ar ).toBe( originalWord.ar );
      expect( parsedWord.de ).toBe( originalWord.de );
      expect( parsedWord.en ).toBe( originalWord.en );
      expect( parsedWord.es ).toBe( originalWord.es );
      expect( parsedWord.bucketIndex ).toBe( bucketIndex );
    } );
  } );
} );