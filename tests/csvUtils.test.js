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
      const csvLine = 'ar,ar,,en,es,hash'; // Empty DE field (3rd column)
      const result = parseCSVLineToWord( csvLine );
      expect( result ).toBeNull(); // Should return null if any required field is empty
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
} );