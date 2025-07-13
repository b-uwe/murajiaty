( () => {
  /**
   * @file Main JavaScript file for Murajiaty application
   */

  // DOM elements
  let mainElement;
  let speakButton;
  let successButton;
  let failButton;
  let flipButton;
  let letterOverlay;
  let wordsElement;

  let currentBucket = 0;
  let currentSide = 'de';

  // Other global variables
  let buckets = [ [], [], [], [], [], [], [] ];
  const flags = [ '🇪🇸', '🇩🇪', '🇺🇸' ];

  /**
   * Common Arabic diacritical marks (basic vowels and sukun)
   * @constant {string[]}
   */
  const COMMON_ARABIC_DIACRITICS = [
    'َ', // Fatha
    'ِ', // Kasra
    'ُ', // Damma
    'ْ'  // Sukun
  ];

  /**
   * Strips Arabic diacritics from a string.
   * @param {string} str - The text with diacritics
   * @returns {string}
   */
  const stripArabicDiacritics = ( str ) => {
    // Covers Arabic vowels and sukun, shadda, etc.
    return str.replace( /[\u064B-\u0652\u0670]/g, '' ).replace( /[أإ]/g,'ا' );
  };

  /**
   * Renders all elements needed for the input of Arabic text
   * @param {object} vocabulary - the word or phrase to learn as an object with all translations
   */
  const renderArabicInput = ( vocabulary ) => {
    /**
     * Upates the input overlay that shows the inputted text with color coding for right or wrong
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

      if ( solution === input.value ) {
        shownText += '🎉';
      }

      overlay.innerHTML = shownText;
      overlay.style.color = 'inherit';

      relativeDiv.scrollTo( -overlay.scrollWidth, 0 );
    };

    // Remove previous inputs
    const existing = document.getElementById( 'arabicInputWrapper' );
    if ( existing ) existing.remove();

    const labelLang = Math.floor( Math.random() * 3 );
    const label = document.createElement( 'div' );
    label.className = 'arabic-label';
    label.innerHTML = flags[ labelLang ] + '<br/>' + vocabulary[ [ 'es','de','en' ][ labelLang ] ];

    // Relative container for overlay + input
    const relativeDiv = document.createElement( 'div' );
    relativeDiv.className = 'arabic-input-relative';

    // Overlay
    const overlay = document.createElement( 'div' );
    overlay.id = 'arabicInputOverlay';

    // Input
    const input = document.createElement( 'input' );
    input.type = 'text';
    input.id = 'arabicInput';
    input.lang = 'ar';
    input.autocomplete = 'off';
    input.spellcheck = false;
    input.style.opacity =0;

    const wrapper = document.createElement( 'div' );

    relativeDiv.appendChild( overlay );
    relativeDiv.appendChild( input );
    wrapper.appendChild( label );
    wrapper.appendChild( relativeDiv );
    mainElement.innerHTML = '';
    mainElement.appendChild( wrapper );

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

    input.addEventListener( 'input', () => {
      updateOverlay();
    } );
    
    updateOverlay();
  };

  /**
   * Picks the first word in the current bucket and shows it in #main.
   * If there is none, it goes one bucket higher and tries there.
   * Handles overflow in case there are no more buckets available.
   */
  const pickNextWord = () => {
    // Check if the current bucket has words
    if ( buckets[ currentBucket ].filter( ( item ) => {
      return !item.touched;
    } ).length > 0 ) {
      const word = buckets[ currentBucket ][ 0 ]; // Get the first word

      switch ( currentBucket ) {
      case 0:
        mainElement.innerHTML = flags[ 1 ] + '<br/>' +  word.de;
        break;
      case 1:
        mainElement.innerHTML = flags[ 2 ] + '<br/>' + word.en;
        break;
      case 2:
        mainElement.innerHTML = flags[ 0 ] + '<br/>' +  word.es;
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
    } else {
      // If no words in the current bucket, check the next higher bucket. But leave out the last one!
      if ( currentBucket < buckets.length - 2 ) {
        currentBucket++; // Move to the next bucket

        // On the last visible level, replace '👍' with '✨'
        if ( currentBucket === buckets.length - 2 ) {
          successButton.textContent = '✨';
        }
        pickNextWord(); // Try again in the new bucket
      } else {
        // Handle overflow
        mainElement.textContent = '😵'; 
        flipButton.disabled = true;
      }
    }

    updateHeader();
    if ( currentBucket === 3 || currentBucket === 5 ) {
      currentSide = 'ar';
      mainElement.classList.add( 'ar' );
      mainElement.classList.remove( 'de' );
      speakButton.disabled = false;
    } else {
      currentSide = 'de';
      mainElement.classList.add( 'de' );
      mainElement.classList.remove( 'ar' );
      speakButton.disabled = true;
    }

    successButton.disabled = true;
    failButton.disabled = true;
  };

  /**
   * Flips the displayed word between its Arabic and German representations.
   */
  const flipWord = () => {
    const currentWord = buckets[ currentBucket ][ 0 ]; // Get the first word in the current bucket
    
    if ( currentWord ) {
      // Toggle between 'de' and 'ar' representation
      if ( currentSide === 'de' ) {
        mainElement.textContent = currentWord.ar; // Show Arabic
        currentSide = 'ar';
        mainElement.classList.add( 'ar' );
        mainElement.classList.remove( 'de' );
        speakWord( currentWord.ar );
      } else {
        mainElement.textContent = currentWord.de; // Show German
        currentSide = 'de';
        mainElement.classList.add( 'de' );
        mainElement.classList.remove( 'ar' );
      }
    }

    speakButton.disabled = false;
    successButton.disabled = false;
    failButton.disabled = false;
  };

  /**
   * Speaks the given word using the Google Translate.
   * @param {string} word - The word to be spoken.
   */
  const speakWord = ( word ) => {
    if ( currentSide === 'de' ) {
      return;
    }

    const audioContext = new ( window.AudioContext || window.webkitAudioContext )();
    const url = `https://bernitt.biz/murajiaty/proxy/proxy.php?text=${encodeURIComponent( word )}`;

    fetch( url )
      .then( ( response ) => {
        if ( !response.ok ) {
          throw new Error( 'Network response was not ok' );
        }
        return response.arrayBuffer();
      } )
      .then( ( arrayBuffer ) => {
        audioContext.decodeAudioData( arrayBuffer, ( buffer ) => {
          const source = audioContext.createBufferSource();
          source.buffer = buffer;
          //source.playbackRate.value = 1; // Adjust playback rate if necessary
          source.connect( audioContext.destination );
          source.start( 0 );
        } );
      } )
      .catch( ( error ) => {
        return console.error( 'Error fetching audio:', error );
      } );
  };

  /**
   * When the user signals a correctly remembered word, put the card one bucket further out
   */
  const rememberedCorrectly = () => {
    const currentWord = buckets[ currentBucket ][ 0 ]; // Get the first word from the current bucket
    currentWord.touched = true; // Add the "touched" attribute

    // Determine the next bucket
    const nextBucket = currentBucket < buckets.length - 1 ? currentBucket + 1 : buckets.length - 1;

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
   * When the user signals a wrongly remembered word, put the card two buckets back
   */
  const rememberedIncorrectly = () => {
    const currentWord = buckets[ currentBucket ][ 0 ]; // Get the first word from the current bucket
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
   * Adds click event listeners to each letter in the word.
   */
  const addLetterClickListener = () => { 
    document.getElementById( 'main' ).addEventListener( 'click', function ( event ) {
      const div = event.target;

      if ( currentSide === 'de' ) {
        return;
      }

      const text = div.textContent;
      let clickedLetter;
    
      // Click- oder Touch-Position bestimmen
      const clientX = event.touches ? event.touches[ 0 ].clientX : event.clientX;

      // Jedes Zeichen einzeln durchgehen
      for ( let i = 0; i < text.length; i++ ) {
        const range = document.createRange();
        range.setStart( div.firstChild, i );
        range.setEnd( div.firstChild, i + 1 );

        const rect = range.getBoundingClientRect();

        // Prüfen, ob der Klick innerhalb dieses Zeichenbereichs war
        if ( clientX >= rect.left && clientX <= rect.right ) {
          clickedLetter = text[ i ];
          break;
        }
      }

      if ( clickedLetter ) {
        const fatha = clickedLetter + COMMON_ARABIC_DIACRITICS[ 0 ];
        const damma = clickedLetter + COMMON_ARABIC_DIACRITICS[ 1 ];
        const kasra = clickedLetter + COMMON_ARABIC_DIACRITICS[ 2 ];

        letterOverlay.innerHTML = `${clickedLetter}<br/>${fatha}${damma}${kasra}`;
        letterOverlay.style.display = 'block';
        speakWord( clickedLetter + ', . ' + fatha + ', ' + damma + ', ' + kasra );
      }
    } );
  };

  /**
   * Recalls one word from the last bucket and puts it into the first bucket
   */
  const recallOneWord = () => {
    const lastBucket = buckets[ buckets.length - 1 ];
    if ( lastBucket.length === 0 ) {
      return;
    }

    const randomPos = Math.floor( Math.random() * lastBucket.length );
    const word = lastBucket[ randomPos ];
    
    buckets[ 0 ].push( word );
    lastBucket.splice( randomPos, 1 );
  };

  /**
   * Updates the header with the current bucket and word count
   */
  const updateHeader = () => {
    wordsElement.textContent = buckets.filter( ( bucket, idx ) => {
      return idx !== buckets.length - 1;
    } ).map( ( bucket, idx ) => {
      return ( idx === currentBucket ) ? `<${bucket.filter( ( el ) => {
        return !el.touched; 
      } ).length + '/' + bucket.length}>` : bucket.filter( ( el ) => {
        return !el.touched; 
      } ).length + '/' + bucket.length;
    } ).join( ' ' ) + ' (' + buckets[ buckets.length - 1 ].length + ')';
  };

  /**
   * Updates the local storage with the current buckets
   */
  const updateStorage = () => {
    localStorage.setItem( 'buckets', JSON.stringify( buckets ) );
  };

  /**
   * Fetches new vocabulary from the server
   * @param {bool} all - Whether to import ALL vocabulary (from buckets.all.csv) or just the new vocab (from buckets.csv)
   */
  const fetchNewVocabulary = ( all = false ) => {
    fetch( `https://bernitt.biz/murajiaty/buckets${all ? '.all' : ''}.csv?t=${Date.now()}` ) 
      .then( ( response ) => {
        if ( !response.ok ) {
          throw new Error( 'Network response was not ok: ' + response.status );
        }
        return response.text();
      } )
      .then( ( content ) => {
        if ( content.length > 0 ) {
          // Delete the file on the server
          fetch( 'https://bernitt.biz/murajiaty/delete.php' )
            .then( () => {
              const rows = content.split( '\n' );

              rows.forEach( ( row ) => {
                const [ ar, de, en, es, bucketIndex ] = row.split( ' ; ' );
                const index = bucketIndex ? parseInt( bucketIndex ) : 0; // Default to 0 if not provided
                
                // If bucketIndex is -1, search for matching entries and remove them
                if ( index === -1 ) {
                  buckets.forEach( ( bucket ) => {
                    const entryIndex = bucket.findIndex( ( item ) => {
                      return item.ar === ar && item.de === de;
                    } );
                    if ( entryIndex !== -1 ) {
                      bucket.splice( entryIndex, 1 ); // Remove the matching entry
                    }
                  } );
                } else {
                  // Validate the line
                  if ( ar && de ) {
                    buckets[ index ].push( { 'de': de, 'ar': ar, 'en': en, 'es': es } );
                  }
                }
              } );

              updateStorage();
              currentBucket = 0;
              pickNextWord();
            } );
        }
      } )
      .catch( ( err ) => {
        console.error( 'Error importing buckets: ', err.message );
        pickNextWord();
      } );
  };


  /**
   * Export vocabulary to CSV format
   * Format: arabic ; german ; english ; spanish ; bucket
   */
  const exportVocabulary = () => {
    const buckets = JSON.parse( localStorage.getItem( 'buckets' ) );
    let csvContent = '';

    // Process each bucket
    for ( let i = 0; i < buckets.length; i++ ) {
      const bucket = buckets[ i ];
      for ( const word of bucket ) {
        csvContent += `${word.ar} ; ${word.de} ; ${word.en} ; ${word.es} ; ${i}\n`;
      }
    }

    // Create a blob and trigger download
    const blob = new Blob( [ csvContent ], { 'type': 'text/csv;charset=utf-8;' } );
    const link = document.createElement( 'a' );
    link.href = URL.createObjectURL( blob );
    link.download = 'vocabulary.csv';
    link.click();
    URL.revokeObjectURL( link.href );
  };

  /**
   * Initializes the browser interface by setting up DOM elements and event listeners
   */
  const initBrowser = () => { 
    // Get DOM elements
    mainElement = document.getElementById( 'main' );
    speakButton = document.getElementById( 'speakButton' );
    successButton = document.getElementById( 'successButton' );
    failButton = document.getElementById( 'failButton' );
    flipButton = document.getElementById( 'flipButton' );
    letterOverlay = document.getElementById( 'letterOverlay' );
    wordsElement = document.getElementById( 'words' );

    // Implement a loooong click handler to export the vocabulary as CSV
    let pressTimer;
    document.addEventListener( 'touchstart', () => {
      pressTimer = setTimeout( () => {
        exportVocabulary();
      }, 5000 ); // 5 seconds
    } );
    document.addEventListener( 'touchend', () => {
      clearTimeout( pressTimer ); // cancel if user lets go early
    } );

    // On page load, read the buckets from local storage
    const storedBuckets = localStorage.getItem( 'buckets' );
    if ( storedBuckets ) {
      buckets = JSON.parse( storedBuckets ).map( ( bucket ) => {
        return bucket.map( ( { de, ar, en, es } ) => {
          return  { de, ar, en, es }; 
        } );
      } );

      // Shuffle each inner array
      buckets = buckets.map( ( bucket ) => {
        for ( let i = bucket.length - 1; i > 0; i-- ) {
          const j = Math.floor( Math.random() * ( i + 1 ) );
          [ bucket[ i ], bucket[ j ] ] = [ bucket[ j ], bucket[ i ] ];
        }
        return bucket;
      } );

      // Recalls a word we considered "learned forever"
      recallOneWord();
    }

    // Initialize event listeners
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
      fetchNewVocabulary( null === storedBuckets );
    }
  };

  // Initialize browser if we're in a browser environment
  if ( typeof window !== 'undefined' ) { 
    initBrowser();
  };

  // Export constants for Node.js environment
  if ( typeof module !== 'undefined' && module.exports ) { 
    module.exports = { 
    };
  };
} )();
