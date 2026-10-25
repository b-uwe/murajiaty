( () => {
  /**
   * @file Read-only table view of the full vocabulary, fetched from the
   * same-origin ./vocab.csv via the shared VocabularySync helpers.
   */

  /**
   * Builds one table row for a vocabulary word ( AR, DE, EN, ES ).
   * @param {object} word - Vocabulary word with ar/de/en/es fields.
   * @returns {HTMLTableRowElement} The populated table row.
   */
  const buildRow = ( word ) => {
    const row = document.createElement( 'tr' );
    const columns = [ word.ar, word.de, word.en, word.es ];
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
   * Fetches the vocabulary and renders every word into the table body.
   * @returns {Promise<void>} Resolves once rendering is complete.
   */
  const renderVocabulary = async () => {
    const body = document.getElementById( 'vocab-body' );
    const status = document.getElementById( 'status' );
    const words = await window.VocabularySync.fetchVocabularyData();

    if ( words.length === 0 ) {
      status.textContent = 'Keine Vokabeln gefunden.';
      return;
    }

    const fragment = document.createDocumentFragment();
    words.forEach( ( word ) => {
      fragment.append( buildRow( word ) );
    } );
    body.append( fragment );
    status.textContent = `${words.length} Vokabeln`;
  };

  document.addEventListener( 'DOMContentLoaded', renderVocabulary );
} )();
