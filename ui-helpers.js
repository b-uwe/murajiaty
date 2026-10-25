( () => {
  /**
   * @file Presentation and side-effecting helpers: flags, Arabic font/overlay
   * rendering, audio playback, PWA storage/viewport setup, and DOM popups.
   */

  /**
   * Flag emojis for different languages in order: Spanish, German, English
   * @constant {string[]}
   */
  const flags = [ '🇪🇸', '🇩🇪', '🇺🇸' ];

  /** @constant {string[]} Basic Arabic marks in order: Fatha, Kasra, Damma, Sukun. */
  const COMMON_ARABIC_DIACRITICS = [ 'َ', 'ِ', 'ُ', 'ْ' ];

  /**
   * @constant {string[]} Arabic font families for recognition practice. Empty
   * string = system default (Noto Naskh Arabic on Android); the rest are
   * self-hosted woff2 fonts declared in styles.css.
   */
  const ARABIC_FONTS = [ '', 'Fustat', 'Reem Kufi', 'Cairo', 'Changa' ];

  /**
   * Picks a random Arabic font family from ARABIC_FONTS.
   * Returns an empty string for the system default or a font family name.
   * @returns {string} Font family name or empty string for default
   */
  const pickRandomArabicFont = () => {
    return ARABIC_FONTS[ Math.floor( Math.random() * ARABIC_FONTS.length ) ];
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
    } ).join( '<span class="letter-spacer">·</span>' );

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

  // Shared public API, exposed on window ( browser ) and module.exports ( tests )
  const publicApi = {
    flags,
    COMMON_ARABIC_DIACRITICS,
    ARABIC_FONTS,
    pickRandomArabicFont,
    speakWord,
    buildLetterOverlayHTML,
    isPWA,
    showStorageError,
    ensurePersistentStorage,
    setupViewport,
    createReviewPopup
  };

  if ( typeof window !== 'undefined' ) {
    window.UIHelpers = publicApi;
  }

  if ( typeof module !== 'undefined' && module.exports ) {
    module.exports = publicApi;
  }
} )();
