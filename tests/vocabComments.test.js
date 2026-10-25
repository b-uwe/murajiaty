/* global window */

/**
 * @file Tests for the vocabulary view's comment helpers: looking up a word's
 * comments by its runtime hash, and rendering a single comment with its
 * author. VocabLogic, VocabularySync ( for hashVocabularyWord ) and a stubbed
 * UIHelpers are put on the jsdom window before vocab.js destructures them.
 */

let lookupComments;
let renderComment;
let hashVocabularyWord;

beforeAll( () => {
  require( '../vocab-logic.js' );
  ( { hashVocabularyWord } = require( '../vocabulary-sync.js' ) );
  window.UIHelpers = { 'speakWord': jest.fn() };
  ( { lookupComments, renderComment } = require( '../vocab.js' ) );
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
