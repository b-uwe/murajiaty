( () => {
  /**
   * @file Vocabulary synchronization module.
   * Handles CSV parsing, vocabulary-source fetching, and vocabulary diff logic.
   * Exposes window.VocabularySync for browser use and module.exports for tests.
   */

  /**
   * Parses a CSV line handling quoted fields
   * @param {string} csvLine - The CSV line to parse (format: "field1","field2",...)
   * @param {string} separator - The field separator (default: ',')
   * @returns {string[]} Array of parsed fields
   */
  const parseCSVLine = ( csvLine, separator = ',' ) => {
    if ( !csvLine || csvLine.trim() === '' ) {
      return [];
    }

    const fields = [];
    let currentField = '';
    let inQuotes = false;
    let i = 0;

    while ( i < csvLine.length ) {
      const char = csvLine[ i ];
      const nextChar = csvLine[ i + 1 ];

      if ( char === '"' ) {
        if ( inQuotes && nextChar === '"' ) {
          // Escaped quote within quoted field
          currentField += '"';
          // Skip both quotes
          i += 2;
        } else {
          // Start or end of quoted field
          inQuotes = !inQuotes;
          i++;
        }
      } else if ( !inQuotes && csvLine.substring( i, i + separator.length ) === separator ) {
        // Found separator outside of quotes
        fields.push( currentField.trim() );
        currentField = '';
        i += separator.length;
      } else {
        currentField += char;
        i++;
      }
    }

    // Add the last field
    fields.push( currentField.trim() );
    return fields;
  };

  /**
   * Parses a vocabulary CSV line to extract word data
   * Uses columns 0, 1, 2, 3 (AR, DE, EN, ES) from the source format
   * @param {string} csvLine - The CSV line to parse
   * @returns {object|null} Parsed word object or null if invalid
   */
  const parseCSVLineToWord = ( csvLine ) => {
    if ( !csvLine || csvLine.trim() === '' ) {
      return null;
    }

    // Skip header row
    if ( csvLine.includes( 'AR,DE,EN,ES' ) ) {
      return null;
    }

    // Parse CSV line with default comma separators, handling quoted fields properly
    const parts = parseCSVLine( csvLine );

    // Extract columns: 0=AR, 1=DE, 2=EN, 3=ES.
    const ar = ( parts[ 0 ] || '' ).trim();
    const de = ( parts[ 1 ] || '' ).trim();
    const en = ( parts[ 2 ] || '' ).trim();
    const es = ( parts[ 3 ] || '' ).trim();

    // Validate that all required fields are present and non-empty
    if ( ar && de && en && es && parts.length >= 4 ) {
      return { ar,
        de,
        en,
        es,
        'bucketIndex': 0 };
    }

    return null;
  };

  /**
   * Parses CSV content and returns an array of vocabulary words
   * @param {string} csvContent - The raw CSV content to parse
   * @returns {Array<object>} Array of parsed vocabulary word objects
   */
  const parseVocabularyCSV = ( csvContent ) => {
    const words = [];

    if ( csvContent.length > 0 ) {
      const rows = csvContent.split( '\n' );

      rows.forEach( ( row ) => {
        const parsedWord = parseCSVLineToWord( row );
        if ( parsedWord ) {
          words.push( parsedWord );
        }
      } );
    }

    return words;
  };

  /**
   * DJB2-variant hash for vocabulary word identity comparison.
   * Creates a 32-bit hash from the concatenated ar|de|en|es content.
   * @param {object} word - The vocabulary word with ar, de, en, es properties
   * @returns {string} Hash string representation of the word
   */
  const hashVocabularyWord = ( word ) => {
    const content = `${word.ar}|${word.de}|${word.en}|${word.es}`;
    let hash = 0;
    for ( let i = 0; i < content.length; i++ ) {
      const char = content.charCodeAt( i );
      hash = ( ( hash << 5 ) - hash ) + char;
      // Convert to 32bit integer
      hash &= hash;
    }
    return hash.toString( 16 );
  };

  /**
   * Fetches vocabulary data from the vocabulary source
   * @returns {Promise<Array<object>>} Array of vocabulary word objects
   */
  const fetchVocabularyData = async () => {
    try {
      const response = await fetch( `./vocab.csv?t=${Date.now()}` );

      if ( !response.ok ) {
        throw new Error( `Network response was not ok: ${response.status}` );
      }

      const content = await response.text();
      return parseVocabularyCSV( content );
    } catch ( err ) {
      console.error( 'Error fetching vocabulary from source:', err.message );
      return [];
    }
  };

  /**
   * Builds a hash-based index of local vocabulary for change detection
   * @param {Array<Array>} currentBuckets - Current bucket structure
   * @returns {object} Maps for lookup: { localVocabMap, localHashSet }
   */
  const buildLocalVocabIndex = ( currentBuckets ) => {
    const localVocabMap = new Map();
    const localHashSet = new Set();

    currentBuckets.forEach( ( bucket, bucketIndex ) => {
      bucket.forEach( ( word, arrayIndex ) => {
        const wordHash = hashVocabularyWord( word );
        localVocabMap.set( wordHash, { word,
          bucketIndex,
          arrayIndex } );
        localHashSet.add( wordHash );
      } );
    } );

    return { localVocabMap,
      localHashSet };
  };

  /**
   * Compares local vocabulary against the vocabulary source and applies changes
   * @param {Array<Array>} currentBuckets - Current bucket structure
   * @param {Set} localHashSet - Set of local vocabulary hashes
   * @param {Map} localVocabMap - Map of hash to word location
   * @param {Array} sourceVocab - Vocabulary from the source
   * @returns {object} Updated buckets and change statistics
   */
  const applyVocabularyDiff = ( currentBuckets, localHashSet, localVocabMap, sourceVocab ) => {
    const sourceHashSet = new Set();
    const newWords = [];

    sourceVocab.forEach( ( sourceWord ) => {
      const sourceHash = hashVocabularyWord( sourceWord );
      sourceHashSet.add( sourceHash );

      if ( !localHashSet.has( sourceHash ) ) {
        newWords.push( sourceWord );
      }
    } );

    // Find DELETED words
    const deletionsToProcess = [];
    localHashSet.forEach( ( localHash ) => {
      if ( !sourceHashSet.has( localHash ) ) {
        const { bucketIndex, arrayIndex } = localVocabMap.get( localHash );
        deletionsToProcess.push( { bucketIndex,
          arrayIndex } );
      }
    } );

    // Deep copy buckets and apply changes
    const updatedBuckets = currentBuckets.map( ( bucket ) => {
      return [ ...bucket ];
    } );

    newWords.forEach( ( word ) => {
      updatedBuckets[ 0 ].push( { 'ar': word.ar,
        'de': word.de,
        'en': word.en,
        'es': word.es } );
    } );

    /*
     * Process deletions in reverse order to avoid index shifting.
     * Sort by bucket first, then by array index (both descending).
     */
    deletionsToProcess.
      sort( ( a, b ) => {
        if ( a.bucketIndex !== b.bucketIndex ) {
          return b.bucketIndex - a.bucketIndex;
        }
        return b.arrayIndex - a.arrayIndex;
      } ).
      forEach( ( { bucketIndex, arrayIndex } ) => {
        updatedBuckets[ bucketIndex ].splice( arrayIndex, 1 );
      } );

    return {
      'buckets': updatedBuckets,
      'changes': {
        'newWords': newWords.length,
        'deletedWords': deletionsToProcess.length,
        'unchangedWords': localHashSet.size - deletionsToProcess.length
      }
    };
  };

  /**
   * Checks for vocabulary updates by comparing local storage with the vocabulary source
   * @param {Array<Array>} currentBuckets - Current bucket structure from localStorage
   * @returns {Promise<object>} Object containing updated buckets and change statistics
   */
  const checkForVocabularyUpdates = async ( currentBuckets ) => {
    try {
      const { localVocabMap, localHashSet } = buildLocalVocabIndex( currentBuckets );
      const sourceVocab = await fetchVocabularyData();

      /*
       * CRITICAL: If fetch returned empty data, preserve existing buckets
       * This handles offline scenarios and prevents progress loss
       */
      if ( sourceVocab.length === 0 ) {
        return {
          'buckets': currentBuckets,
          'changes': { 'newWords': 0,
            'deletedWords': 0,
            'unchangedWords': 0 }
        };
      }

      return applyVocabularyDiff( currentBuckets, localHashSet, localVocabMap, sourceVocab );
    } catch ( err ) {
      console.error( 'Error checking for vocabulary updates:', err.message );
      return { 'buckets': currentBuckets,
        'changes': { 'newWords': 0,
          'deletedWords': 0,
          'unchangedWords': 0 } };
    }
  };

  // Browser: expose on window namespace
  if ( typeof window !== 'undefined' ) {
    window.VocabularySync = { checkForVocabularyUpdates };
  }

  // Node.js: expose for testing
  if ( typeof module !== 'undefined' && module.exports ) {
    module.exports = {
      parseCSVLine,
      parseCSVLineToWord,
      parseVocabularyCSV,
      hashVocabularyWord,
      fetchVocabularyData,
      buildLocalVocabIndex,
      applyVocabularyDiff,
      checkForVocabularyUpdates
    };
  }
} )();
