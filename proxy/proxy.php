<?php
// Enable CORS
header( 'Access-Control-Allow-Origin: *' );

// Define a route to handle audio requests
if ( isset( $_GET[ 'text' ] ) ) {
    $text = $_GET[ 'text' ];
    $audioUrl = 'https://translate.google.com/translate_tts?ie=UTF-8&client=tw-ob&tl=ar&q=' . urlencode( $text );

    // Generate cache key based on text
    $cacheDir = __DIR__ . '/cache';
    $cacheKey = md5( $text );
    $cacheFile = $cacheDir . '/' . $cacheKey . '.mp3';

    // Check if file exists in cache
    if ( file_exists( $cacheFile ) ) {
        header( 'Content-Type: audio/mpeg' );
        readfile( $cacheFile );
        exit;
    }

    // Fetch audio using file_get_contents
    $audioData = file_get_contents( $audioUrl );
    if ( $audioData === false ) {
        http_response_code( 500 );
        echo json_encode( [ 'error' => 'Error fetching audio.' ] );
        exit;
    }

    // Save to cache
    file_put_contents( $cacheFile, $audioData );

    header( 'Content-Type: audio/mpeg' );
    echo $audioData;
}

if ( !isset( $_GET[ 'text' ] ) ) {
    http_response_code( 400 );
    echo json_encode( [ 'error' => 'Text parameter is required.' ] );
}
?>