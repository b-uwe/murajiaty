/**
 * @file Tests for CSV comma handling in translation strings
 */

const { parseCSVLineToWord, parseGoogleSheetsCSVLineToWord } = require( '../main.js' );

describe( 'CSV comma handling', () => {
  describe( 'parseCSVLineToWord with commas in fields', () => {
    test( 'should handle comma in Arabic field', () => {
      const csvLine = '"مرحبا، أهلا" ; hallo ; hello ; hola ; 0';
      const result = parseCSVLineToWord( csvLine );
      
      expect( result ).not.toBeNull();
      expect( result.ar ).toBe( 'مرحبا، أهلا' );
      expect( result.de ).toBe( 'hallo' );
      expect( result.en ).toBe( 'hello' );
      expect( result.es ).toBe( 'hola' );
      expect( result.bucketIndex ).toBe( 0 );
    } );

    test( 'should handle comma in German field', () => {
      const csvLine = 'مرحبا ; "hallo, guten Tag" ; hello ; hola ; 1';
      const result = parseCSVLineToWord( csvLine );
      
      expect( result ).not.toBeNull();
      expect( result.ar ).toBe( 'مرحبا' );
      expect( result.de ).toBe( 'hallo, guten Tag' );
      expect( result.en ).toBe( 'hello' );
      expect( result.es ).toBe( 'hola' );
      expect( result.bucketIndex ).toBe( 1 );
    } );

    test( 'should handle comma in English field', () => {
      const csvLine = 'مرحبا ; hallo ; "hello, hi" ; hola ; 2';
      const result = parseCSVLineToWord( csvLine );
      
      expect( result ).not.toBeNull();
      expect( result.ar ).toBe( 'مرحبا' );
      expect( result.de ).toBe( 'hallo' );
      expect( result.en ).toBe( 'hello, hi' );
      expect( result.es ).toBe( 'hola' );
      expect( result.bucketIndex ).toBe( 2 );
    } );

    test( 'should handle comma in Spanish field', () => {
      const csvLine = 'مرحبا ; hallo ; hello ; "hola, buenos días" ; 3';
      const result = parseCSVLineToWord( csvLine );
      
      expect( result ).not.toBeNull();
      expect( result.ar ).toBe( 'مرحبا' );
      expect( result.de ).toBe( 'hallo' );
      expect( result.en ).toBe( 'hello' );
      expect( result.es ).toBe( 'hola, buenos días' );
      expect( result.bucketIndex ).toBe( 3 );
    } );

    test( 'should handle multiple fields with commas', () => {
      const csvLine = '"word, phrase" ; "Wort, Ausdruck" ; "word, expression" ; "palabra, expresión" ; 0';
      const result = parseCSVLineToWord( csvLine );
      
      expect( result ).not.toBeNull();
      expect( result.ar ).toBe( 'word, phrase' );
      expect( result.de ).toBe( 'Wort, Ausdruck' );
      expect( result.en ).toBe( 'word, expression' );
      expect( result.es ).toBe( 'palabra, expresión' );
    } );

    test( 'should handle escaped quotes within quoted fields', () => {
      const csvLine = '"He said ""hello""" ; "Er sagte ""hallo""" ; "He said ""hello""" ; "Él dijo ""hola""" ; 0';
      const result = parseCSVLineToWord( csvLine );
      
      expect( result ).not.toBeNull();
      expect( result.ar ).toBe( 'He said "hello"' );
      expect( result.de ).toBe( 'Er sagte "hallo"' );
      expect( result.en ).toBe( 'He said "hello"' );
      expect( result.es ).toBe( 'Él dijo "hola"' );
    } );
  } );

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

  describe( 'Edge cases with commas', () => {
    test( 'should handle empty quoted fields', () => {
      const csvLine = '"" ; test ; test ; test ; 0';
      const result = parseCSVLineToWord( csvLine );
      
      expect( result ).toBeNull(); // Should fail validation due to empty Arabic field
    } );

    test( 'should handle fields with only commas', () => {
      const csvLine = '",," ; test ; test ; test ; 0';
      const result = parseCSVLineToWord( csvLine );
      
      expect( result ).not.toBeNull();
      expect( result.ar ).toBe( ',,' );
    } );

    test( 'should handle mixed quoted and unquoted fields', () => {
      const csvLine = '"quoted, field" ; unquoted ; "another, quoted" ; unquoted ; 0';
      const result = parseCSVLineToWord( csvLine );
      
      expect( result ).not.toBeNull();
      expect( result.ar ).toBe( 'quoted, field' );
      expect( result.de ).toBe( 'unquoted' );
      expect( result.en ).toBe( 'another, quoted' );
      expect( result.es ).toBe( 'unquoted' );
    } );
  } );
} );