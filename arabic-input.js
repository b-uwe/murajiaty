( () => {
  /**
   * @file Arabic text input interface for vocabulary writing practice
   */

  const { stripArabicDiacritics } = typeof window === 'undefined' ? require( './vocab-logic.js' ) : window.VocabLogic;
  const {
    flags, pickRandomArabicFont, speakWord
  } = typeof window === 'undefined' ? require( './ui-helpers.js' ) : window.UIHelpers;

  /**
   * Sets up the Arabic input interface by creating DOM elements and
   * rendering them into the given container.
   * @param {object} vocabulary - the word or phrase with all translations
   * @param {HTMLElement} container - The parent element to render into
   * @returns {object} Key DOM elements for event wiring: { relativeDiv, overlay, input }
   */
  const setupArabicInputDOM = ( vocabulary, container ) => {
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
    container.innerHTML = '';
    container.appendChild( wrapper );

    return { relativeDiv,
      overlay,
      input };
  };

  /**
   * Wires event listeners and input behavior for the Arabic text input interface.
   * Delegates DOM creation to setupArabicInputDOM.
   * @param {object} vocabulary - the word or phrase to learn as an object with all translations
   * @param {object} elements - DOM element references needed by the input
   * @param {HTMLElement} elements.mainElement - The main content area to render into
   * @param {HTMLButtonElement} elements.successButton - Button to enable on focus
   * @param {HTMLButtonElement} elements.failButton - Button to enable on focus
   */
  const renderArabicInput = ( vocabulary, { mainElement, successButton, failButton } ) => {
    const { relativeDiv, overlay, input } = setupArabicInputDOM( vocabulary, mainElement );

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

  // Browser: expose on window namespace
  if ( typeof window !== 'undefined' ) {
    window.ArabicInput = { 'render': renderArabicInput };
  }

  // Node.js: expose for testing
  if ( typeof module !== 'undefined' && module.exports ) {
    module.exports = { renderArabicInput };
  }
} )();
