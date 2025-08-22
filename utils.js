/**
 * @file Utility functions for Murajiaty application
 */

/**
 * Strips Arabic diacritics from a string and normalizes alif forms.
 * @param {string} str - The text with diacritics
 * @returns {string} The cleaned text without diacritics and with normalized alifs
 */
const stripArabicDiacritics = ( str ) => {
  // Covers Arabic vowels and sukun, shadda, etc.
  return str.replace( /[\u064B-\u0652\u0670]/g, '' ).replace( /[أإ]/g, 'ا' );
};

// Export for Node.js testing
if ( typeof module !== 'undefined' && module.exports ) {
  module.exports = {
    stripArabicDiacritics
  };
}