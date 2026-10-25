( () => {
  /**
   * @file Pure vocabulary domain logic: language-side selection, text
   * normalization, and the spaced-repetition review queue. No DOM or audio.
   */

  /**
   * Maps a bucket index to its prompt-side language. Contract: buckets 0/1/2
   * use DE/EN/ES; every bucket >= 3 uses AR (including the bucket-4 typing
   * widget and the bucket-5 graduated review).
   * @param {number} bucket - Zero-based bucket index.
   * @returns {string} One of 'de' | 'en' | 'es' | 'ar'.
   */
  const promptLangFor = ( bucket ) => {
    return bucket < 3 ? [ 'de', 'en', 'es' ][ bucket ] : 'ar';
  };

  /**
   * 4-language flip cycle order for the given prompt language. Starts at the
   * prompt itself, then AR (for DE/EN/ES prompts) or DE (for AR prompts), then
   * the two remaining languages. Fresh array on each call.
   * @param {string} promptLang - One of 'de' | 'en' | 'es' | 'ar'.
   * @returns {string[]} Ordered language codes covering all four languages.
   */
  const cycleOrderFor = ( promptLang ) => {
    if ( promptLang === 'ar' ) {
      return [ 'ar', 'de', 'en', 'es' ];
    }
    const rest = [ 'de', 'en', 'es' ].filter( ( lang ) => {
      return lang !== promptLang;
    } );
    return [ promptLang, 'ar', ...rest ];
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
    return str.replace( /[ً-ْٰ]/gu, '' ).replace( /[أإ]/gu, 'ا' );
  };

  /**
   * Display text for a side of a vocabulary word; bucket 5 strips AR diacritics.
   * @param {object} word - Vocabulary word with { de, en, es, ar }.
   * @param {string} side - Language code ('de' | 'en' | 'es' | 'ar').
   * @param {number} bucket - Current bucket index.
   * @returns {string} Text to render.
   */
  const textForSide = ( word, side, bucket ) => {
    if ( side === 'ar' && bucket === 5 ) {
      return stripArabicDiacritics( word.ar );
    }
    return word[ side ];
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
   * Computes a word's reviewCount after an unknown (👎) demotion. In the first
   * bucket a word cannot drop any further, so instead its reviewCount is
   * decremented (floored at 0) to push it back through the recall queue sooner.
   * Any other bucket leaves the reviewCount untouched.
   * @param {object} word - The vocabulary word being demoted
   * @param {number} bucketIndex - The bucket the word is currently in
   * @returns {number} The reviewCount to store on the word
   */
  const reviewCountAfterDemotion = ( word, bucketIndex ) => {
    const current = word.reviewCount || 0;
    return bucketIndex === 0 ? Math.max( 0, current - 1 ) : current;
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
   * Counts how many words sit at each per-word reviewCount level.
   * @param {Array<Array<object>>} targetBuckets - The bucket structure to scan
   * @returns {Array<number>} Word counts indexed by reviewCount, lowest first
   */
  const reviewCountDistribution = ( targetBuckets ) => {
    const distribution = [];
    targetBuckets.flat().forEach( ( word ) => {
      const level = word.reviewCount || 0;
      while ( distribution.length <= level ) {
        distribution.push( 0 );
      }
      distribution[ level ] += 1;
    } );
    return distribution;
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

  // Shared public API, exposed on window ( browser ) and module.exports ( tests )
  const publicApi = {
    promptLangFor,
    cycleOrderFor,
    shuffleArray,
    stripArabicDiacritics,
    textForSide,
    calculateTargetLevel,
    insertIntoReviewQueue,
    reviewCountAfterDemotion,
    findWordForLevel,
    recallWords,
    reviewCountDistribution,
    parseStoredWord
  };

  if ( typeof window !== 'undefined' ) {
    window.VocabLogic = publicApi;
  }

  if ( typeof module !== 'undefined' && module.exports ) {
    module.exports = publicApi;
  }
} )();
