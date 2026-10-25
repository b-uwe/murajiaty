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
  let canComment = false;
  let canDelete = false;
  let activeWord = null;

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
   * Builds a list item for one comment, prefixed with its author's name. When
   * deletion is allowed, a delete button carrying the comment index is added;
   * a delegated listener in init acts on it.
   * @param {object} comment - Comment with text and author fields.
   * @param {number} index - The comment's position within its word.
   * @param {boolean} deletable - Whether a delete button should be shown.
   * @returns {HTMLLIElement} The populated list item.
   */
  const renderComment = ( comment, index, deletable ) => {
    const item = document.createElement( 'li' );
    const author = document.createElement( 'strong' );
    author.textContent = `${comment.author}: `;
    item.append( author, document.createTextNode( comment.text ) );
    if ( deletable ) {
      const remove = document.createElement( 'button' );
      remove.type = 'button';
      remove.className = 'comment-delete';
      remove.dataset.index = String( index );
      remove.textContent = '🗑';
      item.append( ' ', remove );
    }
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
      canComment = Boolean( data.canComment );
      canDelete = Boolean( data.canDelete );
    } catch {
      // Comments are optional; the table still works without them.
    }
  };

  /**
   * Chooses the marker text for a row: a count badge when comments exist, an
   * add marker when writing is allowed, or nothing.
   * @param {number} count - Number of comments on the word.
   * @param {boolean} writable - Whether the viewer may add comments.
   * @returns {string} The marker label, or an empty string for no marker.
   */
  const markerLabel = ( count, writable ) => {
    if ( count > 0 ) {
      return `💬 ${count}`;
    }
    return writable ? '➕' : '';
  };

  /**
   * Builds the POST body for saving a comment: the word hash, the text and a
   * snapshot of the row so an orphaned comment stays identifiable.
   * @param {object} word - Vocabulary word with ar/de/en/es fields.
   * @param {string} commentText - The comment text.
   * @returns {object} The body fields for the save request.
   */
  const buildSaveBody = ( word, commentText ) => {
    const row = { 'ar': word.ar,
      'de': word.de,
      'en': word.en,
      'es': word.es };
    return { 'hash': window.VocabularySync.hashVocabularyWord( word ),
      'text': commentText,
      'row': JSON.stringify( row ) };
  };

  /**
   * Builds the POST body for deleting a comment: the word hash and the
   * comment's index within that word.
   * @param {object} word - Vocabulary word the comment belongs to.
   * @param {number} index - The comment's position within its word.
   * @returns {object} The body fields for the delete request.
   */
  const buildDeleteBody = ( word, index ) => {
    return { 'hash': window.VocabularySync.hashVocabularyWord( word ),
      'index': String( index ) };
  };

  /**
   * Builds the "add comment" form shown in the overlay when writing is
   * allowed. The save button is wired by a delegated listener in init.
   * @returns {HTMLDivElement} The form element.
   */
  const buildCommentForm = () => {
    const form = document.createElement( 'div' );
    form.className = 'comment-form';
    const input = document.createElement( 'textarea' );
    const save = document.createElement( 'button' );
    save.type = 'button';
    save.className = 'comment-save';
    save.textContent = 'Speichern';
    form.append( input, save );
    return form;
  };

  /**
   * Opens the overlay for a word and fills it with the word's comments,
   * remembering the word so a save knows which row it belongs to.
   * @param {object} word - Vocabulary word with ar/de/en/es fields.
   */
  const openCommentOverlay = ( word ) => {
    activeWord = word;
    const body = document.getElementById( 'overlay-body' );
    const list = document.createElement( 'ul' );
    list.className = 'comment-list';
    lookupComments( commentsMap, word ).forEach( ( comment, index ) => {
      list.append( renderComment( comment, index, canDelete ) );
    } );
    body.replaceChildren( list );
    if ( canComment ) {
      body.append( buildCommentForm() );
    }
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
    const label = markerLabel( count, canComment );
    if ( label === '' ) {
      return;
    }
    const marker = document.createElement( 'button' );
    marker.className = 'comment-marker';
    marker.textContent = label;
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
   * Saves a comment for a word, then reloads the comments, re-renders the
   * table and reopens the overlay so the new entry shows immediately.
   * @param {object} word - Vocabulary word the comment belongs to.
   * @param {string} commentText - The comment text.
   * @returns {Promise<void>} Resolves once the overlay is refreshed.
   */
  const saveComment = async ( word, commentText ) => {
    if ( commentText.trim() === '' ) {
      return;
    }
    await fetch( './comments.php?action=save', { 'method': 'POST',
      'body': new URLSearchParams( buildSaveBody( word, commentText ) ) } );
    await fetchComments();
    renderRows();
    openCommentOverlay( word );
  };

  /**
   * Deletes a comment by its index, then reloads the comments, re-renders the
   * table and reopens the overlay.
   * @param {object} word - Vocabulary word the comment belongs to.
   * @param {number} index - The comment's position within its word.
   * @returns {Promise<void>} Resolves once the overlay is refreshed.
   */
  const deleteComment = async ( word, index ) => {
    await fetch( './comments.php?action=delete', { 'method': 'POST',
      'body': new URLSearchParams( buildDeleteBody( word, index ) ) } );
    await fetchComments();
    renderRows();
    openCommentOverlay( word );
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
    document.getElementById( 'overlay-body' ).addEventListener( 'click', ( event ) => {
      if ( event.target.classList.contains( 'comment-save' ) ) {
        saveComment( activeWord, event.target.previousElementSibling.value );
      }
      if ( event.target.classList.contains( 'comment-delete' ) ) {
        deleteComment( activeWord, Number( event.target.dataset.index ) );
      }
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
      markerLabel,
      buildSaveBody,
      buildDeleteBody,
      readDiacriticsPref };
  }
} )();
