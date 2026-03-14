/**
 * @file Tests for stripArabicDiacritics function
 */

const { stripArabicDiacritics } = require( '../main.js' );

describe( 'stripArabicDiacritics', () => {
  test( 'should remove basic Arabic diacritics (fatha, kasra, damma, sukun)', () => {
    // Fatha
    expect( stripArabicDiacritics( 'كَتَبَ' ) ).toBe( 'كتب' );
    // Kasra + sukun
    expect( stripArabicDiacritics( 'بِسْمِ' ) ).toBe( 'بسم' );
    // Damma
    expect( stripArabicDiacritics( 'عُمُر' ) ).toBe( 'عمر' );
    // Mixed diacritics
    expect( stripArabicDiacritics( 'مَكْتَبَة' ) ).toBe( 'مكتبة' );
  } );

  test( 'should normalize alif forms (أ إ → ا)', () => {
    // Alif with hamza above
    expect( stripArabicDiacritics( 'أحمد' ) ).toBe( 'احمد' );
    // Alif with hamza below
    expect( stripArabicDiacritics( 'إبراهيم' ) ).toBe( 'ابراهيم' );
    // Mixed alif forms
    expect( stripArabicDiacritics( 'أإا' ) ).toBe( 'ااا' );
  } );

  test( 'should handle complex text with both diacritics and alif normalization', () => {
    expect( stripArabicDiacritics( 'أَحْمَدُ إِبْرَاهِيمُ' ) ).toBe( 'احمد ابراهيم' );
    expect( stripArabicDiacritics( 'الْحَمْدُ لِلَّهِ رَبِّ الْعَالَمِينَ' ) ).toBe( 'الحمد لله رب العالمين' );
  } );

  test( 'should handle empty string', () => {
    expect( stripArabicDiacritics( '' ) ).toBe( '' );
  } );

  test( 'should handle strings without diacritics or alif variants', () => {
    expect( stripArabicDiacritics( 'مرحبا بك' ) ).toBe( 'مرحبا بك' );
    expect( stripArabicDiacritics( 'كتاب' ) ).toBe( 'كتاب' );
  } );

  test( 'should handle mixed Arabic and non-Arabic text', () => {
    expect( stripArabicDiacritics( 'Hello أَحْمَد World' ) ).toBe( 'Hello احمد World' );
    expect( stripArabicDiacritics( '123 كَتَبَ 456' ) ).toBe( '123 كتب 456' );
  } );

  test( 'should handle shadda and other extended diacritics (Unicode range \\u064B-\\u0652\\u0670)', () => {
    // With shadda
    expect( stripArabicDiacritics( 'مُحَمَّد' ) ).toBe( 'محمد' );
    // Shadda + damma
    expect( stripArabicDiacritics( 'اللَّهُ' ) ).toBe( 'الله' );
  } );

  test( 'should preserve spaces and punctuation', () => {
    expect( stripArabicDiacritics( 'مَرْحَبًا، كَيْفَ حَالُكَ؟' ) ).toBe( 'مرحبا، كيف حالك؟' );
    expect( stripArabicDiacritics( 'نَعَمْ! هَذَا صَحِيحٌ.' ) ).toBe( 'نعم! هذا صحيح.' );
  } );
} );