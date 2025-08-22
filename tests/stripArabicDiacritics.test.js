/**
 * @file Tests for stripArabicDiacritics function
 */

const { stripArabicDiacritics } = require( '../main.js' );

describe( 'stripArabicDiacritics', () => {
  test( 'should remove basic Arabic diacritics (fatha, kasra, damma, sukun)', () => {
    // Test individual diacritics
    expect( stripArabicDiacritics( 'كَتَبَ' ) ).toBe( 'كتب' ); // fatha
    expect( stripArabicDiacritics( 'بِسْمِ' ) ).toBe( 'بسم' ); // kasra + sukun
    expect( stripArabicDiacritics( 'عُمُر' ) ).toBe( 'عمر' ); // damma
    expect( stripArabicDiacritics( 'مَكْتَبَة' ) ).toBe( 'مكتبة' ); // mixed diacritics
  } );

  test( 'should normalize alif forms (أ إ → ا)', () => {
    expect( stripArabicDiacritics( 'أحمد' ) ).toBe( 'احمد' ); // alif with hamza above
    expect( stripArabicDiacritics( 'إبراهيم' ) ).toBe( 'ابراهيم' ); // alif with hamza below
    expect( stripArabicDiacritics( 'أإا' ) ).toBe( 'ااا' ); // mixed alif forms
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
    expect( stripArabicDiacritics( 'مُحَمَّد' ) ).toBe( 'محمد' ); // with shadda
    expect( stripArabicDiacritics( 'اللَّهُ' ) ).toBe( 'الله' ); // shadda + damma
  } );

  test( 'should preserve spaces and punctuation', () => {
    expect( stripArabicDiacritics( 'مَرْحَبًا، كَيْفَ حَالُكَ؟' ) ).toBe( 'مرحبا، كيف حالك؟' );
    expect( stripArabicDiacritics( 'نَعَمْ! هَذَا صَحِيحٌ.' ) ).toBe( 'نعم! هذا صحيح.' );
  } );
} );