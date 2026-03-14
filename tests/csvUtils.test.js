/**
 * @file Tests for CSV utility functions
 */

const { parseCSVLineToWord } = require( '../main.js' );

describe( 'CSV Utilities', () => {
  describe( 'parseCSVLineToWord', () => {
    test( 'should parse Google Sheets CSV line with comma separation', () => {
      const csvLine = 'آسِفْ,آسِفْ,Es tut mir leid,I\'m sorry,Lo siento,9fdf6eccd7d89d3aba63dece6bed406a';
      const result = parseCSVLineToWord( csvLine );
      expect( result ).toEqual( {
        'ar': 'آسِفْ',
        'de': 'Es tut mir leid',
        'en': 'I\'m sorry',
        'es': 'Lo siento',
        'bucketIndex': 0
      } );
    } );

    test( 'should handle quoted fields in Google Sheets CSV', () => {
      const csvLine = '"أَبُوك جَاي مَعَايَا بُكْرَة؟","أَبُوك جَاي مَعَايَا بُكْرَة؟","Kommt dein Vater morgen mit mir?","Is your father coming with me tomorrow?","¿Viene tu padre conmigo mañana?","9b7e2fc1cdb6ce3c487c04387c0563b2"';
      const result = parseCSVLineToWord( csvLine );
      expect( result ).toEqual( {
        'ar': 'أَبُوك جَاي مَعَايَا بُكْرَة؟',
        'de': 'Kommt dein Vater morgen mit mir?',
        'en': 'Is your father coming with me tomorrow?',
        'es': '¿Viene tu padre conmigo mañana?',
        'bucketIndex': 0
      } );
    } );

    test( 'should skip header row', () => {
      const headerLine = 'AR,AR,DE,EN,ES,md5';
      const result = parseCSVLineToWord( headerLine );
      expect( result ).toBeNull();
    } );

    test( 'should return null for empty or invalid lines', () => {
      expect( parseCSVLineToWord( '' ) ).toBeNull();
      expect( parseCSVLineToWord( '   ' ) ).toBeNull();
      expect( parseCSVLineToWord( 'incomplete,line' ) ).toBeNull();
    } );

    test( 'should handle empty fields gracefully', () => {
      // Empty DE field (3rd column)
      const csvLine = 'ar,ar,,en,es,hash';
      const result = parseCSVLineToWord( csvLine );
      // Should return null if any required field is empty
      expect( result ).toBeNull();
    } );

    test( 'should ignore extra columns beyond the required ones', () => {
      const csvLine = 'آهْ,آهْ,ja,yes,sí,hash,extra,columns';
      const result = parseCSVLineToWord( csvLine );
      expect( result ).toEqual( {
        'ar': 'آهْ',
        'de': 'ja',
        'en': 'yes',
        'es': 'sí',
        'bucketIndex': 0
      } );
    } );
  } );

  describe( 'parseCSVLineToWord with commas in fields', () => {
    test( 'should handle comma in Arabic field from Google Sheets', () => {
      const csvLine = '"مرحبا، أهلا","مرحبا، أهلا",hallo,hello,hola,abc123';
      const result = parseCSVLineToWord( csvLine );

      expect( result ).not.toBeNull();
      expect( result.ar ).toBe( 'مرحبا، أهلا' );
      expect( result.de ).toBe( 'hallo' );
      expect( result.en ).toBe( 'hello' );
      expect( result.es ).toBe( 'hola' );
    } );

    test( 'should handle comma in German field from Google Sheets', () => {
      const csvLine = 'مرحبا,مرحبا,"hallo, guten Tag",hello,hola,abc123';
      const result = parseCSVLineToWord( csvLine );

      expect( result ).not.toBeNull();
      expect( result.ar ).toBe( 'مرحبا' );
      expect( result.de ).toBe( 'hallo, guten Tag' );
      expect( result.en ).toBe( 'hello' );
      expect( result.es ).toBe( 'hola' );
    } );

    test( 'should handle comma in English field from Google Sheets', () => {
      const csvLine = 'مرحبا,مرحبا,hallo,"hello, hi",hola,abc123';
      const result = parseCSVLineToWord( csvLine );

      expect( result ).not.toBeNull();
      expect( result.ar ).toBe( 'مرحبا' );
      expect( result.de ).toBe( 'hallo' );
      expect( result.en ).toBe( 'hello, hi' );
      expect( result.es ).toBe( 'hola' );
    } );

    test( 'should handle comma in Spanish field from Google Sheets', () => {
      const csvLine = 'مرحبا,مرحبا,hallo,hello,"hola, buenos días",abc123';
      const result = parseCSVLineToWord( csvLine );

      expect( result ).not.toBeNull();
      expect( result.ar ).toBe( 'مرحبا' );
      expect( result.de ).toBe( 'hallo' );
      expect( result.en ).toBe( 'hello' );
      expect( result.es ).toBe( 'hola, buenos días' );
    } );

    test( 'should handle multiple fields with commas in Google Sheets format', () => {
      const csvLine = '"word, phrase","word, phrase","Wort, Ausdruck","word, expression","palabra, expresión",abc123';
      const result = parseCSVLineToWord( csvLine );

      expect( result ).not.toBeNull();
      expect( result.ar ).toBe( 'word, phrase' );
      expect( result.de ).toBe( 'Wort, Ausdruck' );
      expect( result.en ).toBe( 'word, expression' );
      expect( result.es ).toBe( 'palabra, expresión' );
    } );

    test( 'should handle escaped quotes within quoted fields in Google Sheets', () => {
      const csvLine = '"He said ""hello""","He said ""hello""","Er sagte ""hallo""","He said ""hello""","Él dijo ""hola""",abc123';
      const result = parseCSVLineToWord( csvLine );

      expect( result ).not.toBeNull();
      expect( result.ar ).toBe( 'He said "hello"' );
      expect( result.de ).toBe( 'Er sagte "hallo"' );
      expect( result.en ).toBe( 'He said "hello"' );
      expect( result.es ).toBe( 'Él dijo "hola"' );
    } );
  } );
} );