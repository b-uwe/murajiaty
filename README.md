# مُرَاجِعَةِي (Murajiaty)

  A simple spaced repetition vocabulary trainer for learning Arabic.

  ## What it does

  - Shows vocabulary cards in Arabic, German, English, and Spanish
  - Uses a multi-bucket spaced repetition system to optimize learning
  - Heavily optimized towards a quite personal best learning experience that might not match how other people learn languages
  - Allows text input with real-time feedback for Arabic typing practice
  - Provides audio pronunciation via Google Translate TTS
  - Stores progress locally in your browser

  ## Quick Start

  1. Open `index.html` in your browser
  2. Start learning! Use the buttons to mark words as remembered (👍) or forgotten (👎)
  3. Flip cards with ↩️ to see translations
  4. Click 🔊 to hear Arabic pronunciation provided by Google Translate

  ## How the Buckets Work

  - **Bucket 0-2**: New words (German→English→Spanish prompts)
  - **Bucket 3**: Arabic text recognition
  - **Bucket 4**: Arabic text input with typing feedback
  - **Bucket 5-6**: Review levels
  - Words move forward when remembered correctly, backward when forgotten

  ## Adding Vocabulary

  Place CSV files on your server:
  - `buckets.csv` - new vocabulary to import

  Format: `arabic ; german ; english ; spanish ; bucket_number`

  ## Tech Stack

  - Vanilla JavaScript (no frameworks)
  - CSS Grid for responsive layout
  - localStorage for offline persistence
  - PHP proxy for caching Google Translate audio and to allow adding alternative pronounciations provided by friends

  ## License

  GPL-3.0-or-later
