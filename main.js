( () => {
  /**
   * @file Main JavaScript file for Murajiaty application
   */

  /** @type {HTMLElement} Main content area for displaying words */
  let mainElement;
  /** @type {HTMLButtonElement} Button to trigger text-to-speech */
  let speakButton;
  /** @type {HTMLButtonElement} Button for marking a word as correctly remembered */
  let successButton;
  /** @type {HTMLButtonElement} Button for marking a word as incorrectly remembered */
  let failButton;
  /** @type {HTMLButtonElement} Button for flipping between Arabic and translation */
  let flipButton;
  /** @type {HTMLElement} Overlay for showing Arabic letter diacritics */
  let letterOverlay;
  /** @type {HTMLElement} Header element showing bucket word counts */
  let wordsElement;

  /** @type {number} Index of the currently active spaced-repetition bucket */
  let currentBucket = 0;
  /** @type {string} Current display language side: 'de' or 'ar' */
  let currentSide = 'de';

  /** @type {Array<Array<object>>} Spaced-repetition buckets holding vocabulary words */
  let buckets = [ [], [], [], [], [], [], [] ];

  /**
   * Flag emojis for different languages in order: Spanish, German, English
   * @constant {string[]}
   */
  const flags = [ '🇪🇸', '🇩🇪', '🇺🇸' ];

  /**
   * Common Arabic diacritical marks (basic vowels and sukun)
   * @constant {string[]}
   */
  const COMMON_ARABIC_DIACRITICS = [
    // Fatha
    'َ',
    // Kasra
    'ِ',
    // Damma
    'ُ',
    // Sukun
    'ْ'
  ];


  /**
   * Arabic font families for recognition practice: empty string represents the system default
   * (Noto Naskh Arabic on Android), the rest are self-hosted woff2 fonts declared in styles.css.
   * @constant {string[]}
   */
  const ARABIC_FONTS = [
    '',
    'Fustat',
    'Reem Kufi',
    'Cairo',
    'Changa'
  ];

  /**
   * Picks a random Arabic font family from ARABIC_FONTS.
   * Returns an empty string for the system default or a font family name.
   * @returns {string} Font family name or empty string for default
   */
  const pickRandomArabicFont = () => {
    return ARABIC_FONTS[ Math.floor( Math.random() * ARABIC_FONTS.length ) ];
  };

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
   * Parses a Google Sheets CSV line to extract word data
   * Uses columns 1, 3, 4, 5 (AR, DE, EN, ES) from Google Sheets format
   * @param {string} csvLine - The CSV line to parse
   * @returns {object|null} Parsed word object or null if invalid
   */
  const parseCSVLineToWord = ( csvLine ) => {
    if ( !csvLine || csvLine.trim() === '' ) {
      return null;
    }

    // Skip header row
    if ( csvLine.includes( 'AR,AR,DE,EN,ES' ) ) {
      return null;
    }

    // Parse CSV line with default comma separators, handling quoted fields properly
    const parts = parseCSVLine( csvLine );

    // Extract columns: 0=AR, 1=AR(duplicate), 2=DE, 3=EN, 4=ES, 5=md5
    const ar = ( parts[ 0 ] || '' ).trim();
    const de = ( parts[ 2 ] || '' ).trim();
    const en = ( parts[ 3 ] || '' ).trim();
    const es = ( parts[ 4 ] || '' ).trim();

    // Validate that all required fields are present and non-empty
    if ( ar && de && en && es && parts.length >= 5 ) {
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
  const parseGoogleSheetsCSV = ( csvContent ) => {
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
   * Shuffles an array in place using Fisher-Yates algorithm
   * @param {Array} array - The array to shuffle
   * @returns {Array} The shuffled array (same reference)
   */
  const shuffleArray = ( array ) => {
    for ( let i = array.length - 1; i > 0; i-- ) {
      const j = Math.floor( Math.random() * ( i + 1 ) );
      [ array[ i ], array[ j ] ] = [ array[ j ], array[ i ] ];
    }
    return array;
  };

  /**
   * Strips Arabic diacritics from a string and normalizes alif forms.
   * @param {string} str - The text with diacritics
   * @returns {string} The cleaned text without diacritics and with normalized alifs
   */
  const stripArabicDiacritics = ( str ) => {
    // Covers Arabic vowels and sukun, shadda, etc.
    return str.replace( /[\u064B-\u0652\u0670]/gu, '' ).replace( /[أإ]/gu, 'ا' );
  };

  /**
   * Speaks the given word using the Google Translate.
   * @param {string} word - The word to be spoken.
   */
  const speakWord = ( word ) => {
    const audioContext = new ( window.AudioContext || window.webkitAudioContext )();
    const url = `https://bernitt.biz/murajiaty/proxy/proxy.php?text=${encodeURIComponent( word )}`;

    fetch( url ).
      then( ( response ) => {
        if ( !response.ok ) {
          throw new Error( 'Network response was not ok' );
        }
        return response.arrayBuffer();
      } ).
      then( ( arrayBuffer ) => {
        audioContext.decodeAudioData( arrayBuffer, ( buffer ) => {
          const source = audioContext.createBufferSource();
          source.buffer = buffer;
          source.connect( audioContext.destination );
          source.start( 0 );
        } );
      } ).
      catch( ( error ) => {
        return console.error( 'Error fetching audio:', error );
      } );
  };

  /**
   * Sets up the Arabic input interface by creating DOM elements and
   * rendering them into mainElement.
   * @param {object} vocabulary - the word or phrase with all translations
   * @returns {object} Key DOM elements for event wiring: { relativeDiv, overlay, input }
   */
  const setupArabicInputDOM = ( vocabulary ) => {
    const labelLang = Math.floor( Math.random() * 3 );
    const label = document.createElement( 'div' );
    label.className = 'arabic-label';
    label.innerHTML = `${flags[ labelLang ]}<br/>${vocabulary[ [ 'es', 'de', 'en' ][ labelLang ] ]}`;

    // Relative container for overlay + input
    const relativeDiv = document.createElement( 'div' );
    relativeDiv.className = 'arabic-input-relative';
    relativeDiv.style.fontFamily = pickRandomArabicFont();

    const overlay = document.createElement( 'div' );
    overlay.id = 'arabicInputOverlay';

    const input = document.createElement( 'input' );
    input.type = 'text';
    input.id = 'arabicInput';
    input.lang = 'ar';
    input.autocomplete = 'off';
    input.spellcheck = false;
    input.style.opacity = 0;

    const wrapper = document.createElement( 'div' );

    relativeDiv.appendChild( overlay );
    relativeDiv.appendChild( input );
    wrapper.appendChild( label );
    wrapper.appendChild( relativeDiv );
    mainElement.innerHTML = '';
    mainElement.appendChild( wrapper );

    return { relativeDiv,
      overlay,
      input };
  };

  /**
   * Wires event listeners and input behavior for the Arabic text input interface.
   * Delegates DOM creation to setupArabicInputDOM.
   * @param {object} vocabulary - the word or phrase to learn as an object with all translations
   */
  const renderArabicInput = ( vocabulary ) => {
    const { relativeDiv, overlay, input } = setupArabicInputDOM( vocabulary );

    input.addEventListener( 'focus', () => {
      input.style.position = 'fixed';
      input.style.opacity = 0;
      input.style.height = 0;
      input.style.width = 0;
      input.style.top = '100%';
      setTimeout( () => {
        input.scrollIntoView();

        successButton.disabled = false;
        failButton.disabled = false;
      }, 100 );
    } );

    const solution = stripArabicDiacritics( vocabulary.ar );

    /**
     * Updates the input overlay with color-coded comparison of user input vs solution
     */
    const updateOverlay = () => {
      const userInput = stripArabicDiacritics( input.value );
      let shownText = '';

      for ( let i = 0; i < userInput.length || i < solution.length; i++ ) {
        const uc = userInput[ i ] || '';
        const sc = solution[ i ] || '';
        if ( uc === sc ) {
          shownText += `<span class="input-correct">${uc}</span>`;
        } else {
          shownText += `<span class="input-wrong">${uc}</span>`;
        }
      }

      if ( solution === stripArabicDiacritics( input.value ) ) {
        shownText += '🎉';
        speakWord( vocabulary.ar );
      }

      overlay.innerHTML = shownText;
      overlay.style.color = 'inherit';

      relativeDiv.scrollTo( -overlay.scrollWidth, 0 );
    };

    input.addEventListener( 'input', () => {
      updateOverlay();
    } );

    updateOverlay();

    // Auto-focus the input field so user can start typing immediately
    input.focus();
  };

  /**
   * Updates the header with the current bucket and word count
   */
  const updateHeader = () => {
    wordsElement.textContent = `${buckets.filter( ( bucket, idx ) => {
      return idx !== buckets.length - 1;
    } ).map( ( bucket, idx ) => {
      return ( ( idx === currentBucket ) ? `<${`${bucket.filter( ( el ) => {
        return !el.touched;
      } ).length}/${bucket.length}`}>` : `${bucket.filter( ( el ) => {
        return !el.touched;
      } ).length}/${bucket.length}` );
    } ).join( ' ' )} (${buckets[ buckets.length - 1 ].length})`;
  };

  /**
   * Updates the local storage with the current buckets
   */
  const updateStorage = () => {
    localStorage.setItem( 'murajiaty-buckets', JSON.stringify( buckets ) );
  };

  /**
   * Configures UI state after picking a word (language direction, button states)
   */
  const configureUIAfterPick = () => {
    updateHeader();
    if ( currentBucket === 3 || currentBucket === 5 ) {
      currentSide = 'ar';
      mainElement.classList.add( 'ar' );
      mainElement.classList.remove( 'de' );
      mainElement.style.fontFamily = pickRandomArabicFont();
      speakButton.disabled = false;
    } else {
      currentSide = 'de';
      mainElement.classList.add( 'de' );
      mainElement.classList.remove( 'ar' );
      mainElement.style.fontFamily = '';
      speakButton.disabled = true;
    }

    successButton.disabled = true;
    failButton.disabled = true;
  };

  /**
   * Picks the first word in the current bucket and shows it in #main.
   * If there is none, it goes one bucket higher and tries there.
   * Handles overflow in case there are no more buckets available.
   */
  const pickNextWord = () => {
    // Check if the current bucket has words
    if ( buckets[ currentBucket ].some( ( item ) => {
      return !item.touched;
    } ) ) {
      const [ word ] = buckets[ currentBucket ];

      switch ( currentBucket ) {
        case 0:
          mainElement.innerHTML = `${flags[ 1 ]}<br/>${word.de}`;
          break;
        case 1:
          mainElement.innerHTML = `${flags[ 2 ]}<br/>${word.en}`;
          break;
        case 2:
          mainElement.innerHTML = `${flags[ 0 ]}<br/>${word.es}`;
          break;
        case 3:
          mainElement.textContent = word.ar;
          break;
        case 4:
          renderArabicInput( word );
          break;
        default:
          mainElement.textContent = stripArabicDiacritics( word.ar );
          break;
      }
    } else if ( currentBucket < buckets.length - 2 ) {
      // If no words in the current bucket, check the next higher bucket. But leave out the last one!
      currentBucket++;

      // On the last visible level, replace '👍' with '✨'
      if ( currentBucket === buckets.length - 2 ) {
        successButton.textContent = '✨';
      }
      // Try again in the new bucket
      pickNextWord();
    } else {
      // Handle overflow
      mainElement.textContent = '😵';
      flipButton.disabled = true;
    }

    configureUIAfterPick();
  };

  /**
   * Flips the displayed word between its Arabic and German representations.
   */
  const flipWord = () => {
    const [ currentWord ] = buckets[ currentBucket ];

    if ( currentWord ) {
      // Toggle between 'de' and 'ar' representation
      if ( currentSide === 'de' ) {
        // Show Arabic
        mainElement.textContent = currentWord.ar;
        currentSide = 'ar';
        mainElement.classList.add( 'ar' );
        mainElement.classList.remove( 'de' );
        mainElement.style.fontFamily = pickRandomArabicFont();
        speakWord( currentWord.ar );
      } else {
        // Show German
        mainElement.textContent = currentWord.de;
        currentSide = 'de';
        mainElement.classList.add( 'de' );
        mainElement.classList.remove( 'ar' );
        mainElement.style.fontFamily = '';
      }
    }

    speakButton.disabled = false;
    successButton.disabled = false;
    failButton.disabled = false;
  };

  /**
   * When the user signals a correctly remembered word, put the card one bucket further out
   */
  const rememberedCorrectly = () => {
    const [ currentWord ] = buckets[ currentBucket ];
    // Mark word as touched
    currentWord.touched = true;

    // Determine the next bucket
    const nextBucket = currentBucket < buckets.length - 1 ? currentBucket + 1 : buckets.length - 1;

    // Record when the word graduated to the DONE bucket for oldest-first recycling
    if ( nextBucket === buckets.length - 1 ) {
      currentWord.doneAt = Date.now();
    }

    // Add the word to the end of the next bucket
    buckets[ nextBucket ].push( currentWord );

    // Remove the word from the start of the current bucket
    buckets[ currentBucket ].shift();

    // Call the necessary functions
    pickNextWord();
    updateHeader();
    updateStorage();
  };

  /**
   * When the user signals a wrongly remembered word, put the card one bucket back
   */
  const rememberedIncorrectly = () => {
    const [ currentWord ] = buckets[ currentBucket ];
    const trgtBucket = currentBucket > 0 ? currentBucket - 1 : 0;

    // Add the word to the end of the next bucket
    buckets[ trgtBucket ].push( currentWord );

    // Remove the word from the start of the current bucket
    buckets[ currentBucket ].shift();

    // Call the necessary functions
    pickNextWord();
    updateHeader();
    updateStorage();
  };

  /**
   * Builds the HTML for the letter overlay showing the isolated letter and its
   * diacritical forms across all available Arabic fonts.
   * @param {string} letter - The isolated Arabic letter
   * @param {string[]} diacritics - Array of diacritical marks to combine with the letter
   * @param {string[]} fonts - Array of font family names (empty string = system default)
   * @returns {string} HTML string for the overlay content
   */
  const buildLetterOverlayHTML = ( letter, diacritics, fonts ) => {
    // Top row: isolated letter side by side in all fonts
    const topLetters = fonts.map( ( font ) => {
      const style = font ? ` style="font-family: ${font}"` : '';
      return `<span class="letter-font-sample"${style}>${letter}</span>`;
    } ).join( '<span class="letter-spacer">\u00B7</span>' );

    // One row per font showing fatha, kasra, damma
    const diacriticRows = fonts.map( ( font ) => {
      const style = font ? ` style="font-family: ${font}"` : '';
      const forms = diacritics.map( ( d ) => {
        return letter + d;
      } ).join( '' );
      return `<div class="letter-diacritics-row"${style}>${forms}</div>`;
    } ).join( '' );

    return `<div class="letter-top-row">${topLetters}</div>${diacriticRows}`;
  };

  /**
   * Adds a click listener to #main that detects which Arabic letter was tapped
   * and shows it with common diacritics in all available fonts on the overlay.
   */
  const addLetterClickListener = () => {
    document.getElementById( 'main' ).addEventListener( 'click', ( event ) => {
      const div = event.target;

      if ( currentSide === 'de' ) {
        return;
      }

      const text = div.textContent;
      let clickedLetter;

      // Determine click or touch position
      const clientX = event.touches ? event.touches[ 0 ].clientX : event.clientX;

      // Walk through each character individually
      for ( let i = 0; i < text.length; i++ ) {
        const range = document.createRange();
        range.setStart( div.firstChild, i );
        range.setEnd( div.firstChild, i + 1 );

        const rect = range.getBoundingClientRect();

        // Check if the click falls within this character's bounding box
        if ( clientX >= rect.left && clientX <= rect.right ) {
          clickedLetter = text[ i ];
          break;
        }
      }

      if ( clickedLetter ) {
        letterOverlay.innerHTML = buildLetterOverlayHTML( clickedLetter, COMMON_ARABIC_DIACRITICS.slice( 0, 3 ), ARABIC_FONTS );
        letterOverlay.style.display = 'block';

        const fatha = clickedLetter + COMMON_ARABIC_DIACRITICS[ 0 ];
        const damma = clickedLetter + COMMON_ARABIC_DIACRITICS[ 1 ];
        const kasra = clickedLetter + COMMON_ARABIC_DIACRITICS[ 2 ];
        speakWord( `${clickedLetter}, . ${fatha}, ${damma}, ${kasra}` );
      }
    } );
  };

  /**
   * Recalls words from the DONE bucket into the first bucket to maintain
   * 25 actively-cycling words. Picks the oldest-graduated words first
   * (by doneAt timestamp) and strips doneAt before recycling.
   * @param {Array<Array>} targetBuckets - The bucket structure to operate on
   * @returns {void}
   */
  const recallWords = ( targetBuckets ) => {
    const lastBucket = targetBuckets[ targetBuckets.length - 1 ];
    if ( lastBucket.length === 0 ) {
      return;
    }

    // 25 = target number of words actively cycling through non-DONE buckets
    const activeWordCount = targetBuckets.
      slice( 0, -1 ).
      reduce( ( sum, bucket ) => {
        return sum + bucket.length;
      }, 0 );

    const wordsNeeded = 25 - activeWordCount;
    if ( wordsNeeded <= 0 ) {
      return;
    }

    const sorted = [ ...lastBucket ].sort( ( a, b ) => {
      return a.doneAt - b.doneAt;
    } );

    const toRecycle = sorted.slice( 0, wordsNeeded );

    toRecycle.forEach( ( word ) => {
      const idx = lastBucket.indexOf( word );
      lastBucket.splice( idx, 1 );
      delete word.doneAt;
      targetBuckets[ 0 ].push( word );
    } );
  };

  /**
   * Initializes the UI by setting current bucket to 0 and picking the first word
   * Only initializes if buckets contain vocabulary data
   */
  const initializeUIIfDataExists = () => {
    if ( buckets.some( ( bucket ) => {
      return bucket.length > 0;
    } ) ) {
      currentBucket = 0;
      pickNextWord();
    }
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
   * Fetches vocabulary data from Google Sheets
   * @returns {Promise<Array<object>>} Array of vocabulary word objects
   */
  const fetchGoogleSheetsData = async () => {
    try {
      const response = await fetch( `https://docs.google.com/spreadsheets/d/1kPsGq3Zo9PPjtcst-T3pfiToeohq82K-yHuLywxtucU/export?format=csv&t=${Date.now()}` );

      if ( !response.ok ) {
        throw new Error( `Network response was not ok: ${response.status}` );
      }

      const content = await response.text();
      return parseGoogleSheetsCSV( content );
    } catch ( err ) {
      console.error( 'Error fetching vocabulary from Google Sheets:', err.message );
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
   * Compares local vocabulary against Google Sheets data and applies changes
   * @param {Array<Array>} currentBuckets - Current bucket structure
   * @param {Set} localHashSet - Set of local vocabulary hashes
   * @param {Map} localVocabMap - Map of hash to word location
   * @param {Array} googleVocab - Vocabulary from Google Sheets
   * @returns {object} Updated buckets and change statistics
   */
  const applyVocabularyDiff = ( currentBuckets, localHashSet, localVocabMap, googleVocab ) => {
    const googleHashSet = new Set();
    const newWords = [];

    googleVocab.forEach( ( googleWord ) => {
      const googleHash = hashVocabularyWord( googleWord );
      googleHashSet.add( googleHash );

      if ( !localHashSet.has( googleHash ) ) {
        newWords.push( googleWord );
      }
    } );

    // Find DELETED words
    const deletionsToProcess = [];
    localHashSet.forEach( ( localHash ) => {
      if ( !googleHashSet.has( localHash ) ) {
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
   * Checks for vocabulary updates by comparing local storage with Google Sheets data
   * @param {Array<Array>} currentBuckets - Current bucket structure from localStorage
   * @returns {Promise<object>} Object containing updated buckets and change statistics
   */
  const checkForVocabularyUpdates = async ( currentBuckets = buckets ) => {
    try {
      const { localVocabMap, localHashSet } = buildLocalVocabIndex( currentBuckets );
      const googleVocab = await fetchGoogleSheetsData();

      /*
       * CRITICAL: If fetch returned empty data, preserve existing buckets
       * This handles offline scenarios and prevents progress loss
       */
      if ( googleVocab.length === 0 ) {
        return {
          'buckets': currentBuckets,
          'changes': { 'newWords': 0,
            'deletedWords': 0,
            'unchangedWords': 0 }
        };
      }

      return applyVocabularyDiff( currentBuckets, localHashSet, localVocabMap, googleVocab );
    } catch ( err ) {
      console.error( 'Error checking for vocabulary updates:', err.message );
      return { 'buckets': currentBuckets,
        'changes': { 'newWords': 0,
          'deletedWords': 0,
          'unchangedWords': 0 } };
    }
  };

  /**
   * Detects if the app is running as a PWA
   * @returns {boolean} True if running as PWA
   */
  const isPWA = () => {
    if ( typeof window === 'undefined' || !window.matchMedia ) {
      // Not in browser environment or matchMedia not available
      return false;
    }
    return window.matchMedia( '(display-mode: standalone)' ).matches ||
           window.navigator.standalone === true;
  };

  /**
   * Shows error message and prevents app from starting
   * @param {string} message - Error message to display
   */
  const showStorageError = ( message ) => {
    document.body.innerHTML = `
      <div style="padding: 20px; text-align: center; color: #333; font-family: Arial, sans-serif;">
        <h2>Storage Permission Required</h2>
        <p>${message}</p>
        <p>Please grant persistent storage permission and restart the app.</p>
        <p><em>Note: This requirement only applies when running as a PWA to prevent data loss.</em></p>
      </div>
    `;
  };

  /**
   * Requests persistent storage for PWA and initializes the app
   * @returns {Promise<boolean>} True if initialization can proceed
   */
  const ensurePersistentStorage = async () => {
    // Only require persistent storage for PWA mode
    if ( !isPWA() ) {
      console.log( 'Running in browser mode - persistent storage not required' );
      return true;
    }

    console.log( 'PWA detected - checking persistent storage permission' );

    if ( !( 'storage' in navigator && 'persist' in navigator.storage ) ) {
      showStorageError( 'Persistent storage is not supported in this browser.' );
      return false;
    }

    try {
      const persistent = await navigator.storage.persist();
      if ( !persistent ) {
        showStorageError( 'Persistent storage permission was denied. This PWA requires persistent storage to prevent vocabulary data loss.' );
        return false;
      }
      console.log( 'Persistent storage permission granted for PWA' );
      return true;
    } catch ( error ) {
      showStorageError( `Error requesting persistent storage: ${error.message}` );
      return false;
    }
  };

  /**
   * Sets up dynamic viewport height adjustment for PWA system UI.
   * Adjusts on load, resize, and orientation change.
   */
  const setupViewport = () => {
    /**
     * Calculates and applies the adjusted viewport height minus padding.
     */
    const setViewportHeight = () => {
      const vh = window.innerHeight;
      // 2rem in pixels (assuming 1rem = 16px)
      const padding = 32;
      const adjustedHeight = vh - padding;
      document.body.style.minHeight = `${adjustedHeight}px`;
      document.body.style.height = `${adjustedHeight}px`;
      document.body.style.maxHeight = `${adjustedHeight}px`;
    };

    setViewportHeight();
    window.addEventListener( 'resize', setViewportHeight );
    window.addEventListener( 'orientationchange', setViewportHeight );
  };

  /**
   * Restores vocabulary buckets from localStorage into the module-level
   * buckets variable, shuffles them, and recalls graduated words back
   * into active rotation.
   * @returns {boolean} Whether stored buckets were found in localStorage
   */
  const restoreBucketsFromStorage = () => {
    const storedBuckets = localStorage.getItem( 'murajiaty-buckets' );
    if ( storedBuckets ) {
      buckets = JSON.parse( storedBuckets ).map( ( bucket ) => {
        return bucket.map( ( { de, ar, en, es, doneAt } ) => {
          const word = { de,
            ar,
            en,
            es };
          if ( doneAt ) {
            word.doneAt = doneAt;
          }
          return word;
        } );
      } );

      buckets = buckets.map( ( bucket ) => {
        return shuffleArray( [ ...bucket ] );
      } );

      recallWords( buckets );
    }
    return storedBuckets !== null;
  };

  /**
   * Initializes the browser interface by setting up DOM elements and event listeners
   */
  const initBrowser = () => {
    mainElement = document.getElementById( 'main' );
    speakButton = document.getElementById( 'speakButton' );
    successButton = document.getElementById( 'successButton' );
    failButton = document.getElementById( 'failButton' );
    flipButton = document.getElementById( 'flipButton' );
    letterOverlay = document.getElementById( 'letterOverlay' );
    wordsElement = document.getElementById( 'words' );

    setupViewport();

    const hasStoredBuckets = restoreBucketsFromStorage();

    /*
     * Initialize event listeners
     * Check that all required DOM elements are present before adding listeners
     */
    if ( mainElement && speakButton && successButton && failButton && flipButton && letterOverlay && wordsElement ) {
      speakButton.addEventListener( 'click', () => {
        speakWord( buckets[ currentBucket ][ 0 ].ar );
      } );
      successButton.addEventListener( 'click', rememberedCorrectly );
      failButton.addEventListener( 'click', rememberedIncorrectly );
      flipButton.addEventListener( 'click', flipWord );

      letterOverlay.addEventListener( 'click', () => {
        letterOverlay.style.display = 'none';
      } );

      addLetterClickListener();

      // Load vocabulary (handles both initial load and updates)
      checkForVocabularyUpdates( buckets ).
        then( ( updateResult ) => {
          if ( updateResult.changes.newWords > 0 || updateResult.changes.deletedWords > 0 ) {
            const { newWords, deletedWords, unchangedWords } = updateResult.changes;
            console.log( `Vocabulary updated: +${newWords} new, -${deletedWords} deleted, ${unchangedWords} unchanged` );
            ( { buckets } = updateResult );
            updateStorage();
            updateHeader();
          }

          // Initialize UI for first-time users or after successful updates
          if ( !hasStoredBuckets ) {
            initializeUIIfDataExists();
          }
        } ).
        catch( ( err ) => {
          console.error( 'Vocabulary update failed:', err.message );
          // For initial load failures, still try to initialize UI with existing data
          if ( !hasStoredBuckets ) {
            initializeUIIfDataExists();
          }
        } );

      // Initialize UI for returning users (existing localStorage data)
      if ( hasStoredBuckets ) {
        initializeUIIfDataExists();
      }
    }
  };

  // Initialize browser if we're in a browser environment
  if ( typeof window !== 'undefined' ) {
    // Check persistent storage requirements before initializing
    ensurePersistentStorage().then( ( canProceed ) => {
      if ( canProceed ) {
        initBrowser();

        // Register Service Worker for PWA functionality
        if ( 'serviceWorker' in navigator ) {
          navigator.serviceWorker.register( './service-worker.js' ).
            then( ( registration ) => {
              console.log( 'Service Worker registered successfully:', registration.scope );
            } ).
            catch( ( error ) => {
              console.log( 'Service Worker registration failed:', error );
            } );
        }
      }
    } ).catch( ( error ) => {
      console.error( 'Failed to initialize app:', error );
      showStorageError( 'Application failed to initialize due to storage requirements.' );
    } );
  }

  // Export functions for Node.js testing environment
  if ( typeof module !== 'undefined' && module.exports ) {
    module.exports = {
      stripArabicDiacritics,
      parseCSVLine,
      parseCSVLineToWord,
      parseGoogleSheetsCSV,
      shuffleArray,
      hashVocabularyWord,
      fetchGoogleSheetsData,
      checkForVocabularyUpdates,
      renderArabicInput,
      recallWords,
      ARABIC_FONTS,
      pickRandomArabicFont,
      buildLetterOverlayHTML
    };
  };
} )();
