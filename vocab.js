( () => {
  /**
   * @file Read-only table view of the full vocabulary, fetched from the
   * same-origin ./vocab.csv via the shared VocabularySync helpers. Arabic
   * diacritics are stripped by default; a toggle restores them.
   */

  const vocabLogic = typeof window === 'undefined' ? require( './vocab-logic.js' ) : window.VocabLogic;
  const { stripArabicDiacritics } = vocabLogic;

  // Persisted preference key and module-level state shared by the renderers.
  const diacriticsKey = 'murajiaty-vocab-diacritics';
  let words = [];
  let showDiacritics = false;

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
   * Builds one table row for a vocabulary word ( AR, DE, EN, ES ).
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
      }
      row.append( cell );
    } );
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
      status.textContent = 'Keine Vokabeln gefunden.';
      return;
    }

    renderRows();
    status.textContent = `${words.length} Vokabeln`;
  };

  /**
   * Wires the diacritics toggle to the stored preference and re-renders
   * the Arabic column whenever it changes, then loads the vocabulary.
   * @returns {Promise<void>} Resolves once the initial load is complete.
   */
  const init = async () => {
    showDiacritics = readDiacriticsPref();
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
      buildRow,
      readDiacriticsPref };
  }
} )();
