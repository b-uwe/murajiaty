/* global window */

/**
 * @file Tests that the vocabulary view pronounces the original Arabic
 * ( diacritics included ), which guides the text-to-speech even when the
 * table shows the stripped form. VocabLogic and a stubbed UIHelpers are
 * put on the jsdom window before vocab.js destructures them, inside
 * beforeAll where the jsdom environment is active.
 */

const speakSpy = jest.fn();
let speakArabic;

beforeAll( () => {
  require( '../vocab-logic.js' );
  window.UIHelpers = { 'speakWord': speakSpy };
  ( { speakArabic } = require( '../vocab.js' ) );
} );

describe( 'speakArabic', () => {
  test( 'speaks the original Arabic including diacritics', () => {
    speakArabic( { 'ar': 'كِتَاب' } );
    expect( speakSpy ).toHaveBeenCalledWith( 'كِتَاب' );
  } );
} );
