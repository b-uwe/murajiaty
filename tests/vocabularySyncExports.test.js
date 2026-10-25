/**
 * @file Tests that vocabulary-sync exposes its reuse helpers on the browser
 * window namespace, so other pages ( e.g. the vocabulary view ) can use them.
 * The jsdom test environment provides a real window to assign onto.
 */

require( '../vocabulary-sync.js' );

describe( 'VocabularySync browser exposure', () => {
  test( 'exposes the reuse helpers on window.VocabularySync', () => {
    const { VocabularySync } = global.window;
    expect( typeof VocabularySync.checkForVocabularyUpdates ).toBe( 'function' );
    expect( typeof VocabularySync.fetchVocabularyData ).toBe( 'function' );
    expect( typeof VocabularySync.parseVocabularyCSV ).toBe( 'function' );
  } );
} );
