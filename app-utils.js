( () => {
  /**
   * @file Pure utility functions, constants, and self-contained helpers
   */

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
   * Calculates the target review level from a counter value using
   * binary frequency distribution (trailing zeros in binary representation).
   * Level 0 appears 50% of the time, level 1 at 25%, level 2 at 12.5%, etc.
   * @param {number} counter - The global review counter value
   * @returns {number} The target review level (0, 1, 2, ...)
   */
  const calculateTargetLevel = ( counter ) => {
    let level = 0;
    let value = counter;
    while ( value > 0 && value % 2 === 0 ) {
      level++;
      value = Math.floor( value / 2 );
    }
    return level;
  };

  /**
   * Inserts a graduated word into the review queue (last bucket) with
   * updated reviewCount. Cleans up transient properties.
   * @param {object} word - The vocabulary word to insert
   * @param {Array<Array>} targetBuckets - The bucket structure
   * @param {number} increment - How much to add to reviewCount (0=bald, 1=gut, 2=sitzt)
   */
  const insertIntoReviewQueue = ( word, targetBuckets, increment ) => {
    word.reviewCount = ( word.reviewCount || 0 ) + increment;
    delete word.touched;
    targetBuckets[ targetBuckets.length - 1 ].push( word );
  };

  /**
   * Finds a word in the bucket matching the target reviewCount level.
   *
   * Strategy:
   * - Levels > 0 are gated by a minimum population threshold to prevent
   *   hammering the same few words at a thinly populated higher level.
   * - Level 0 is never gated: it is the entry level for recycling, has
   *   no lower level to fall back to, and newly-graduated words are
   *   what the binary-frequency design wants cycled back fastest.
   *
   * When the target level is > 0 and underpopulated, fall through
   * directly to level 0 (skipping intermediate levels). If level 0 is
   * also empty, return null to signal "skip this pull".
   * @param {Array<object>} bucket - The DONE bucket to search
   * @param {number} targetLevel - The desired reviewCount level
   * @returns {object|null} The matched word, or null if none is available
   */
  const findWordForLevel = ( bucket, targetLevel ) => {
    if ( bucket.length === 0 ) {
      return null;
    }

    /**
     * Collects all words at the given reviewCount level.
     * @param {number} level - The reviewCount value to match
     * @returns {Array<object>} Words whose reviewCount equals level
     */
    const wordsAtLevel = ( level ) => {
      return bucket.filter( ( w ) => {
        return ( w.reviewCount || 0 ) === level;
      } );
    };

    /*
     * Minimum words a level > 0 must have before we pull from it.
     * Prevents hammering thin high-level populations.
     */
    const minPopulation = 10;

    if ( targetLevel > 0 ) {
      const atTarget = wordsAtLevel( targetLevel );
      if ( atTarget.length >= minPopulation ) {
        return atTarget[ 0 ];
      }
    }

    /*
     * Level-0 pull — used both as the direct path when targetLevel === 0
     * and as the fallback when the non-zero target is underpopulated.
     * No threshold: return the oldest level-0 word if any exist.
     */
    const atZero = wordsAtLevel( 0 );
    return atZero[ 0 ] || null;
  };

  /**
   * Recalls words from the DONE bucket into the first bucket to maintain
   * 25 actively-cycling words. Uses binary frequency distribution to select
   * words by reviewCount level: level 0 at 50%, level 1 at 25%, etc.
   * When no level meets the minimum population threshold, the pull slot
   * is skipped — the counter advances but no word moves. This prevents
   * hammering the same few words when the review queue is sparsely populated.
   * @param {Array<Array>} targetBuckets - The bucket structure to operate on
   * @param {number} reviewCounter - The current global review counter
   * @returns {number} The updated review counter after pull attempts
   */
  const recallWords = ( targetBuckets, reviewCounter ) => {
    const lastBucket = targetBuckets[ targetBuckets.length - 1 ];
    if ( lastBucket.length === 0 ) {
      return reviewCounter;
    }

    // 25 = target number of words actively cycling through non-DONE buckets
    const activeWordCount = targetBuckets.
      slice( 0, -1 ).
      reduce( ( sum, bucket ) => {
        return sum + bucket.length;
      }, 0 );

    const wordsNeeded = 25 - activeWordCount;
    if ( wordsNeeded <= 0 ) {
      return reviewCounter;
    }

    let counter = reviewCounter;
    for ( let i = 0; i < wordsNeeded && lastBucket.length > 0; i++ ) {
      counter++;
      const targetLevel = calculateTargetLevel( counter );
      const word = findWordForLevel( lastBucket, targetLevel );
      /*
       * When findWordForLevel returns null, no level met the minimum
       * population threshold. Skip this slot — the counter still advances
       * to maintain the binary frequency distribution across future calls.
       */
      if ( word ) {
        const idx = lastBucket.indexOf( word );
        lastBucket.splice( idx, 1 );
        targetBuckets[ 0 ].push( word );
      }
    }

    return counter;
  };

  /**
   * Detects if the app is running as a PWA
   * @returns {boolean} True if running as PWA
   */
  const isPWA = () => {
    if ( typeof window === 'undefined' || !window.matchMedia ) {
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
   * Parses a stored vocabulary word, keeping only known properties
   * and discarding legacy fields like doneAt.
   * @param {object} raw - The raw word object from localStorage
   * @param {string} raw.de - German translation
   * @param {string} raw.ar - Arabic word
   * @param {string} raw.en - English translation
   * @param {string} raw.es - Spanish translation
   * @param {number} [raw.reviewCount] - Number of completed review cycles
   * @returns {object} A clean word object with de, ar, en, es, and optional reviewCount
   */
  const parseStoredWord = ( { de, ar, en, es, reviewCount } ) => {
    const word = {
      de,
      ar,
      en,
      es
    };
    if ( typeof reviewCount === 'number' ) {
      word.reviewCount = reviewCount;
    }
    return word;
  };

  /**
   * Shows a full-screen overlay with 3 review quality options (bald/gut/sitzt).
   * Displays the word's current review count above the buttons.
   * Clicking outside the popup dismisses it without side effects.
   * @param {Function} onSelect - Callback receiving the chosen increment value
   * @param {number} reviewCount - The word's current reviewCount
   */
  const createReviewPopup = ( onSelect, reviewCount ) => {
    const overlay = document.createElement( 'div' );
    overlay.className = 'review-overlay';

    const popup = document.createElement( 'div' );
    popup.className = 'review-popup';

    overlay.addEventListener( 'click', () => {
      overlay.remove();
    } );

    const counter = document.createElement( 'div' );
    counter.className = 'review-popup-counter';
    counter.textContent = `× ${reviewCount}`;
    popup.appendChild( counter );

    const buttonRow = document.createElement( 'div' );
    buttonRow.className = 'review-popup-buttons';

    const options = [
      {
        'label': '🔁',
        'increment': 0
      },
      {
        'label': '👍',
        'increment': 1
      },
      {
        'label': '✨',
        'increment': 2
      }
    ];

    options.forEach( ( { label, increment } ) => {
      const btn = document.createElement( 'button' );
      btn.textContent = label;
      btn.addEventListener( 'click', ( event ) => {
        event.stopPropagation();
        overlay.remove();
        onSelect( increment );
      } );
      buttonRow.appendChild( btn );
    } );

    popup.appendChild( buttonRow );
    overlay.appendChild( popup );
    document.body.appendChild( overlay );
  };

  // Browser: expose on window namespace
  if ( typeof window !== 'undefined' ) {
    window.AppUtils = {
      flags,
      COMMON_ARABIC_DIACRITICS,
      ARABIC_FONTS,
      pickRandomArabicFont,
      shuffleArray,
      stripArabicDiacritics,
      speakWord,
      buildLetterOverlayHTML,
      calculateTargetLevel,
      insertIntoReviewQueue,
      findWordForLevel,
      recallWords,
      parseStoredWord,
      createReviewPopup,
      showStorageError,
      ensurePersistentStorage,
      setupViewport
    };
  }

  // Node.js: expose for testing
  if ( typeof module !== 'undefined' && module.exports ) {
    module.exports = {
      flags,
      COMMON_ARABIC_DIACRITICS,
      ARABIC_FONTS,
      pickRandomArabicFont,
      shuffleArray,
      stripArabicDiacritics,
      speakWord,
      buildLetterOverlayHTML,
      calculateTargetLevel,
      insertIntoReviewQueue,
      findWordForLevel,
      recallWords,
      parseStoredWord,
      createReviewPopup,
      showStorageError,
      ensurePersistentStorage,
      setupViewport
    };
  }
} )();
