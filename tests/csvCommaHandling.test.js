/**
 * @file Tests for CSV comma handling in translation strings
 */

const { parseGoogleSheetsCSVLineToWord } = require( '../main.js' );

describe( 'CSV comma handling', () => {

  describe( 'parseGoogleSheetsCSVLineToWord with commas in fields', () => {
    test( 'should handle comma in Arabic field from Google Sheets', () => {
      const csvLine = '"مرحبا، أهلا","مرحبا، أهلا",hallo,hello,hola,abc123';
      const result = parseGoogleSheetsCSVLineToWord( csvLine );
      
      expect( result ).not.toBeNull();
      expect( result.ar ).toBe( 'مرحبا، أهلا' );
      expect( result.de ).toBe( 'hallo' );
      expect( result.en ).toBe( 'hello' );
      expect( result.es ).toBe( 'hola' );
    } );

    test( 'should handle comma in German field from Google Sheets', () => {
      const csvLine = 'مرحبا,مرحبا,"hallo, guten Tag",hello,hola,abc123';
      const result = parseGoogleSheetsCSVLineToWord( csvLine );
      
      expect( result ).not.toBeNull();
      expect( result.ar ).toBe( 'مرحبا' );
      expect( result.de ).toBe( 'hallo, guten Tag' );
      expect( result.en ).toBe( 'hello' );
      expect( result.es ).toBe( 'hola' );
    } );

    test( 'should handle comma in English field from Google Sheets', () => {
      const csvLine = 'مرحبا,مرحبا,hallo,"hello, hi",hola,abc123';
      const result = parseGoogleSheetsCSVLineToWord( csvLine );
      
      expect( result ).not.toBeNull();
      expect( result.ar ).toBe( 'مرحبا' );
      expect( result.de ).toBe( 'hallo' );
      expect( result.en ).toBe( 'hello, hi' );
      expect( result.es ).toBe( 'hola' );
    } );

    test( 'should handle comma in Spanish field from Google Sheets', () => {
      const csvLine = 'مرحبا,مرحبا,hallo,hello,"hola, buenos días",abc123';
      const result = parseGoogleSheetsCSVLineToWord( csvLine );
      
      expect( result ).not.toBeNull();
      expect( result.ar ).toBe( 'مرحبا' );
      expect( result.de ).toBe( 'hallo' );
      expect( result.en ).toBe( 'hello' );
      expect( result.es ).toBe( 'hola, buenos días' );
    } );

    test( 'should handle multiple fields with commas in Google Sheets format', () => {
      const csvLine = '"word, phrase","word, phrase","Wort, Ausdruck","word, expression","palabra, expresión",abc123';
      const result = parseGoogleSheetsCSVLineToWord( csvLine );
      
      expect( result ).not.toBeNull();
      expect( result.ar ).toBe( 'word, phrase' );
      expect( result.de ).toBe( 'Wort, Ausdruck' );
      expect( result.en ).toBe( 'word, expression' );
      expect( result.es ).toBe( 'palabra, expresión' );
    } );

    test( 'should handle escaped quotes within quoted fields in Google Sheets', () => {
      const csvLine = '"He said ""hello""","He said ""hello""","Er sagte ""hallo""","He said ""hello""","Él dijo ""hola""",abc123';
      const result = parseGoogleSheetsCSVLineToWord( csvLine );
      
      expect( result ).not.toBeNull();
      expect( result.ar ).toBe( 'He said "hello"' );
      expect( result.de ).toBe( 'Er sagte "hallo"' );
      expect( result.en ).toBe( 'He said "hello"' );
      expect( result.es ).toBe( 'Él dijo "hola"' );
    } );
  } );

} );