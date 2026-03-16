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

  // Node.js (Jest): use require; browser: use window namespace set by app-utils.js
  /** @type {number} Global review counter for binary frequency distribution */
  let reviewCounter = 0;

  const {
    flags, COMMON_ARABIC_DIACRITICS, ARABIC_FONTS,
    pickRandomArabicFont, shuffleArray, stripArabicDiacritics,
    speakWord, buildLetterOverlayHTML, insertIntoReviewQueue, recallWords,
    parseStoredWord, createReviewPopup,
    ensurePersistentStorage, showStorageError, setupViewport
  } = typeof window === 'undefined' ? require( './app-utils.js' ) : window.AppUtils;

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
   * Updates the local storage with the current buckets and review counter
   */
  const updateStorage = () => {
    localStorage.setItem( 'murajiaty-buckets', JSON.stringify( buckets ) );
    localStorage.setItem( 'murajiaty-review-counter', String( reviewCounter ) );
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
   * When the user signals a correctly remembered word, put the card one bucket further out.
   * At the last bucket, shows a review quality popup instead of directly graduating.
   */
  const rememberedCorrectly = () => {
    const [ currentWord ] = buckets[ currentBucket ];
    // Mark word as touched
    currentWord.touched = true;

    // Determine the next bucket
    const nextBucket = currentBucket < buckets.length - 1 ? currentBucket + 1 : buckets.length - 1;

    if ( nextBucket === buckets.length - 1 ) {
      // Graduating to review queue: show popup for quality selection
      buckets[ currentBucket ].shift();
      createReviewPopup( successButton.parentElement, ( increment ) => {
        insertIntoReviewQueue( currentWord, buckets, increment );
        pickNextWord();
        updateHeader();
        updateStorage();
      } );
      return;
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

    // Add the word to the end of the target (previous) bucket
    buckets[ trgtBucket ].push( currentWord );

    // Remove the word from the start of the current bucket
    buckets[ currentBucket ].shift();

    // Call the necessary functions
    pickNextWord();
    updateHeader();
    updateStorage();
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
        const kasra = clickedLetter + COMMON_ARABIC_DIACRITICS[ 1 ];
        const damma = clickedLetter + COMMON_ARABIC_DIACRITICS[ 2 ];
        speakWord( `${clickedLetter}, . ${fatha}, ${kasra}, ${damma}` );
      }
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
   * Restores vocabulary buckets from localStorage into the module-level
   * buckets variable, shuffles them, loads the review counter, and
   * recalls graduated words back into active rotation.
   * @returns {boolean} Whether stored buckets were found in localStorage
   */
  const restoreBucketsFromStorage = () => {
    const storedBuckets = localStorage.getItem( 'murajiaty-buckets' );
    if ( storedBuckets ) {
      buckets = JSON.parse( storedBuckets ).map( ( bucket ) => {
        return bucket.map( parseStoredWord );
      } );

      buckets = buckets.map( ( bucket ) => {
        return shuffleArray( [ ...bucket ] );
      } );

      const storedCounter = localStorage.getItem( 'murajiaty-review-counter' );
      reviewCounter = storedCounter ? Number( storedCounter ) : 0;
      reviewCounter = recallWords( buckets, reviewCounter );
      localStorage.setItem( 'murajiaty-review-counter', String( reviewCounter ) );
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
      window.VocabularySync.checkForVocabularyUpdates( buckets ).
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
} )();
