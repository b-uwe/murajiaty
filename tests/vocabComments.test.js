/* global window */

/**
 * @file Tests for the vocabulary view's comment helpers: looking up a word's
 * comments by its runtime hash, and rendering a single comment with its
 * author. VocabLogic, VocabularySync ( for hashVocabularyWord ) and a stubbed
 * UIHelpers are put on the jsdom window before vocab.js destructures them.
 */

let lookupComments;
let renderComment;
let markerLabel;
let buildSaveBody;
let hashVocabularyWord;

beforeAll( () => {
  require( '../vocab-logic.js' );
  ( { hashVocabularyWord } = require( '../vocabulary-sync.js' ) );
  window.UIHelpers = { 'speakWord': jest.fn() };
  ( { lookupComments, renderComment, markerLabel, buildSaveBody } = require( '../vocab.js' ) );
} );

describe( 'lookupComments', () => {
  test( 'returns the comments stored under the word hash', () => {
    const word = { 'ar': 'كتاب',
      'de': 'Buch',
      'en': 'book',
      'es': 'libro' };
    const hash = hashVocabularyWord( word );
    const comment = { 'text': 'hi',
      'author': 'Uwe' };
    const map = { [ hash ]: { 'comments': [ comment ] } };
    expect( lookupComments( map, word ) ).toHaveLength( 1 );
  } );

  test( 'returns an empty array when the word has no comments', () => {
    const word = { 'ar': 'قلم',
      'de': 'Stift',
      'en': 'pen',
      'es': 'pluma' };
    expect( lookupComments( {}, word ) ).toEqual( [] );
  } );
} );

describe( 'renderComment', () => {
  test( 'shows the author and the text', () => {
    const node = renderComment( { 'text': 'nett',
      'author': 'Hossam' } );
    expect( node.textContent ).toContain( 'Hossam' );
    expect( node.textContent ).toContain( 'nett' );
  } );
} );

describe( 'markerLabel', () => {
  test( 'shows the count when comments exist', () => {
    expect( markerLabel( 2, false ) ).toBe( '💬 2' );
  } );

  test( 'offers an add marker when writing is allowed and none exist', () => {
    expect( markerLabel( 0, true ) ).toBe( '➕' );
  } );

  test( 'shows nothing when none exist and writing is not allowed', () => {
    expect( markerLabel( 0, false ) ).toBe( '' );
  } );
} );

describe( 'buildSaveBody', () => {
  test( 'carries the word hash, text and a row snapshot', () => {
    const word = { 'ar': 'باب',
      'de': 'Tür',
      'en': 'door',
      'es': 'puerta' };
    const body = buildSaveBody( word, 'hallo' );
    expect( body.hash ).toBe( hashVocabularyWord( word ) );
    expect( body.text ).toBe( 'hallo' );
    expect( JSON.parse( body.row ) ).toEqual( word );
  } );
} );
