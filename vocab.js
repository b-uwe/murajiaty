( () => {
  /**
   * @file Read-only table view of the full vocabulary, fetched from the
   * same-origin ./vocab.csv via the shared VocabularySync helpers. Arabic
   * diacritics are stripped by default; a toggle restores them.
   */

  const vocabLogic = typeof window === 'undefined' ? require( './vocab-logic.js' ) : window.VocabLogic;
  const { stripArabicDiacritics } = vocabLogic;
  const uiHelpers = typeof window === 'undefined' ? require( './ui-helpers.js' ) : window.UIHelpers;
  const { speakWord } = uiHelpers;

  // Persisted preference key and module-level state shared by the renderers.
  const diacriticsKey = 'murajiaty-vocab-diacritics';
  let words = [];
  let showDiacritics = false;
  let commentsMap = {};

  /**
   * Returns the Arabic text to display, stripping diacritics unless the
   * viewer has turned them on.
   * @param {object} word - Vocabulary word with an ar field.
   * @param {boolean} withDiacritics - Whether to keep the diacritics.
   * @returns {string} The Arabic text for display.
   */
  const displayArabic = ( word, withDiacritics ) => {
    return withDiacritics ? word.ar : stripArabicDiacritics( word.ar );
  };

  /**
   * Reads the saved diacritics preference, defaulting to off.
   * @returns {boolean} Whether diacritics should be shown.
   */
  const readDiacriticsPref = () => {
    return localStorage.getItem( diacriticsKey ) === 'on';
  };

  /**
   * Speaks a word's Arabic using the original text ( diacritics included ),
   * which guides the text-to-speech even when the table shows the stripped
   * form.
   * @param {object} word - Vocabulary word with an ar field.
   */
  const speakArabic = ( word ) => {
    speakWord( word.ar );
  };

  /**
   * Returns the comments stored for a word, matched by its runtime hash, or
   * an empty array when the word has none.
   * @param {object} map - The hash-keyed comment map from the server.
   * @param {object} word - Vocabulary word with ar/de/en/es fields.
   * @returns {Array<object>} The word's comments.
   */
  const lookupComments = ( map, word ) => {
    const hash = window.VocabularySync.hashVocabularyWord( word );
    return ( map[ hash ] && map[ hash ].comments ) || [];
  };

  /**
   * Builds a list item for one comment, prefixed with its author's name.
   * @param {object} comment - Comment with text and author fields.
   * @returns {HTMLLIElement} The populated list item.
   */
  const renderComment = ( comment ) => {
    const item = document.createElement( 'li' );
    const author = document.createElement( 'strong' );
    author.textContent = `${comment.author}: `;
    item.append( author, document.createTextNode( comment.text ) );
    return item;
  };

  /**
   * Fetches the comment list from the server. A failure leaves the view as a
   * plain read-only table, so comments are strictly additive.
   * @returns {Promise<void>} Resolves once the comments are loaded.
   */
  const fetchComments = async () => {
    try {
      const response = await fetch( `./comments.php?action=list&t=${Date.now()}` );
      if ( !response.ok ) {
        return;
      }
      const data = await response.json();
      commentsMap = data.comments || {};
    } catch {
      // Comments are optional; the table still works without them.
    }
  };

  /**
   * Opens the overlay and fills it with a word's comments.
   * @param {object} word - Vocabulary word with ar/de/en/es fields.
   */
  const openCommentOverlay = ( word ) => {
    const body = document.getElementById( 'overlay-body' );
    const list = document.createElement( 'ul' );
    list.className = 'comment-list';
    lookupComments( commentsMap, word ).forEach( ( comment ) => {
      list.append( renderComment( comment ) );
    } );
    body.replaceChildren( list );
    document.getElementById( 'overlay' ).hidden = false;
  };

  /**
   * Adds a clickable comment marker to a row when the word has comments. The
   * marker opens the overlay with the word's comments.
   * @param {HTMLTableRowElement} row - The row to augment.
   * @param {object} word - Vocabulary word with ar/de/en/es fields.
   */
  const addCommentMarker = ( row, word ) => {
    const count = lookupComments( commentsMap, word ).length;
    if ( count === 0 ) {
      return;
    }
    const marker = document.createElement( 'button' );
    marker.className = 'comment-marker';
    marker.textContent = `💬 ${count}`;
    marker.addEventListener( 'click', () => {
      openCommentOverlay( word );
    } );
    row.lastChild.append( ' ', marker );
  };

  /**
   * Builds one table row for a vocabulary word ( AR, DE, EN, ES ). The
   * Arabic cell speaks the word when tapped.
   * @param {object} word - Vocabulary word with ar/de/en/es fields.
   * @returns {HTMLTableRowElement} The populated table row.
   */
  const buildRow = ( word ) => {
    const row = document.createElement( 'tr' );
    const columns = [ displayArabic( word, showDiacritics ), word.de, word.en, word.es ];
    columns.forEach( ( text, index ) => {
      const cell = document.createElement( 'td' );
      cell.textContent = text;
      if ( index === 0 ) {
        cell.className = 'ar';
        cell.addEventListener( 'click', () => {
          speakArabic( word );
        } );
      }
      row.append( cell );
    } );
    addCommentMarker( row, word );
    return row;
  };

  /**
   * Renders the current word list into the table body, replacing any
   * previously rendered rows.
   */
  const renderRows = () => {
    const body = document.getElementById( 'vocab-body' );
    const fragment = document.createDocumentFragment();
    words.forEach( ( word ) => {
      fragment.append( buildRow( word ) );
    } );
    body.replaceChildren( fragment );
  };

  /**
   * Fetches the vocabulary and performs the initial render.
   * @returns {Promise<void>} Resolves once rendering is complete.
   */
  const loadVocabulary = async () => {
    const status = document.getElementById( 'status' );
    words = await window.VocabularySync.fetchVocabularyData();

    if ( words.length === 0 ) {
      status.textContent = 'لا توجد مفردات.';
      return;
    }

    await fetchComments();
    renderRows();
    status.textContent = `${words.length} مفردة`;
  };

  /**
   * Wires the diacritics toggle to the stored preference and re-renders
   * the Arabic column whenever it changes, then loads the vocabulary.
   * @returns {Promise<void>} Resolves once the initial load is complete.
   */
  const init = async () => {
    showDiacritics = readDiacriticsPref();
    const overlay = document.getElementById( 'overlay' );
    document.getElementById( 'overlay-close' ).addEventListener( 'click', () => {
      overlay.hidden = true;
    } );
    const toggle = document.getElementById( 'diacritics-toggle' );
    toggle.checked = showDiacritics;
    toggle.addEventListener( 'change', () => {
      showDiacritics = toggle.checked;
      localStorage.setItem( diacriticsKey, showDiacritics ? 'on' : 'off' );
      renderRows();
    } );
    await loadVocabulary();
  };

  if ( typeof document !== 'undefined' ) {
    document.addEventListener( 'DOMContentLoaded', init );
  }

  if ( typeof module !== 'undefined' && module.exports ) {
    module.exports = { displayArabic,
      speakArabic,
      buildRow,
      lookupComments,
      renderComment,
      readDiacriticsPref };
  }
} )();
