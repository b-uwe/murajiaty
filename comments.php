<?php

/**
 * Comment store for Murajiaty.
 *
 * Listing comments is public; writing and deleting require a valid token
 * presented via the "murajiaty_token" cookie, matched against secrets.php
 * (SHA-256, hash_equals). Each comment records its author's name, taken from
 * the token, so the UI can show who wrote it. Only a token flagged canDelete
 * (the "Uwe" token) may delete.
 *
 * secrets.php and comments.json live in the same directory as this script on
 * the server; both are gitignored so they never land in the repo. Adjust the
 * two paths below if the server layout differs.
 */

header( 'Content-Type: application/json; charset=utf-8' );

$secretsFile = __DIR__ . '/secrets.php';
$commentsFile = __DIR__ . '/comments.json';

/**
 * Resolves the request cookie token to its holder record, or null when the
 * cookie is absent or the token is unknown.
 *
 * @param string $secretsFile Absolute path to the secrets file.
 * @return array|null The holder record ( name, canDelete ) or null.
 */
function resolve_token( $secretsFile ) {
    if ( !isset( $_COOKIE[ 'murajiaty_token' ] ) || !file_exists( $secretsFile ) ) {
        return null;
    }
    $given = hash( 'sha256', $_COOKIE[ 'murajiaty_token' ] );
    $tokens = require $secretsFile;
    foreach ( $tokens as $storedHash => $holder ) {
        if ( hash_equals( $storedHash, $given ) ) {
            return $holder;
        }
    }
    return null;
}

/**
 * Reads the comment store, returning an empty array when it is missing or
 * unreadable.
 *
 * @param string $commentsFile Absolute path to the comment store.
 * @return array The decoded comment map.
 */
function read_comments( $commentsFile ) {
    if ( !file_exists( $commentsFile ) ) {
        return [];
    }
    $data = json_decode( file_get_contents( $commentsFile ), true );
    return is_array( $data ) ? $data : [];
}

/**
 * Writes the comment store atomically enough for a single-user tool: an
 * exclusive lock keeps a concurrent writer from interleaving.
 *
 * @param string $commentsFile Absolute path to the comment store.
 * @param array $data The comment map to persist.
 * @return void
 */
function write_comments( $commentsFile, $data ) {
    $json = json_encode( $data, JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT );
    file_put_contents( $commentsFile, $json, LOCK_EX );
}

$action = isset( $_GET[ 'action' ] ) ? $_GET[ 'action' ] : '';
$holder = resolve_token( $secretsFile );

if ( $action === 'list' ) {
    echo json_encode( [
        'canComment' => $holder !== null,
        'canDelete' => $holder !== null && !empty( $holder[ 'canDelete' ] ),
        'comments' => read_comments( $commentsFile ),
    ], JSON_UNESCAPED_UNICODE );
    exit;
}

if ( $action === 'save' ) {
    if ( $holder === null ) {
        http_response_code( 403 );
        echo json_encode( [ 'error' => 'Invalid token.' ] );
        exit;
    }
    $hash = isset( $_POST[ 'hash' ] ) ? trim( $_POST[ 'hash' ] ) : '';
    $text = isset( $_POST[ 'text' ] ) ? trim( $_POST[ 'text' ] ) : '';
    $row = isset( $_POST[ 'row' ] ) ? json_decode( $_POST[ 'row' ], true ) : null;
    if ( $hash === '' || $text === '' ) {
        http_response_code( 400 );
        echo json_encode( [ 'error' => 'hash and text are required.' ] );
        exit;
    }
    $data = read_comments( $commentsFile );
    if ( !isset( $data[ $hash ] ) ) {
        $data[ $hash ] = [ 'row' => $row, 'comments' => [] ];
    }
    $data[ $hash ][ 'comments' ][] = [
        'text' => $text,
        'ts' => time(),
        'author' => $holder[ 'name' ],
    ];
    write_comments( $commentsFile, $data );
    echo json_encode( [ 'ok' => true ] );
    exit;
}

if ( $action === 'delete' ) {
    if ( $holder === null || empty( $holder[ 'canDelete' ] ) ) {
        http_response_code( 403 );
        echo json_encode( [ 'error' => 'Not allowed.' ] );
        exit;
    }
    $hash = isset( $_POST[ 'hash' ] ) ? trim( $_POST[ 'hash' ] ) : '';
    $index = isset( $_POST[ 'index' ] ) ? (int) $_POST[ 'index' ] : -1;
    $data = read_comments( $commentsFile );
    if ( isset( $data[ $hash ][ 'comments' ][ $index ] ) ) {
        array_splice( $data[ $hash ][ 'comments' ], $index, 1 );
        if ( count( $data[ $hash ][ 'comments' ] ) === 0 ) {
            unset( $data[ $hash ] );
        }
        write_comments( $commentsFile, $data );
    }
    echo json_encode( [ 'ok' => true ] );
    exit;
}

http_response_code( 400 );
echo json_encode( [ 'error' => 'Unknown action.' ] );
