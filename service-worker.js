/**
 * @file Service worker for PWA offline functionality
 */

/** @constant {string} Current cache version identifier */
const CACHE_NAME = 'murajiaty-v7';
/** @constant {string[]} URLs to pre-cache during service worker installation */
const urlsToCache = [
  './',
  './index.html',
  './app-utils.js',
  './arabic-input.js',
  './vocabulary-sync.js',
  './main.js',
  './styles.css',
  './manifest.json',
  './fonts/cairo-arabic.woff2',
  './fonts/changa-arabic.woff2',
  './fonts/fustat-arabic.woff2',
  './fonts/reem-kufi-arabic.woff2'
];

/**
 * Install event - cache resources
 * @param {ExtendableEvent} event - The install event
 * @returns {void}
 */
const handleInstall = ( event ) => {
  event.waitUntil( caches.open( CACHE_NAME ).
    then( ( cache ) => {
      return cache.addAll( urlsToCache );
    } ) );
};

/**
 * Fetch event - serve from cache or network
 * @param {FetchEvent} event - The fetch event
 * @returns {void}
 */
const handleFetch = ( event ) => {
  event.respondWith( caches.open( CACHE_NAME ).
    then( ( cache ) => {
      return cache.match( event.request );
    } ).
    then( ( response ) => {
      if ( response ) {
        return response;
      }
      return fetch( event.request );
    } ) );
};

/**
 * Activate event - clean up old caches
 * @param {ExtendableEvent} event - The activate event
 * @returns {void}
 */
const handleActivate = ( event ) => {
  event.waitUntil( caches.keys().then( ( cacheNames ) => {
    return Promise.all( cacheNames.
      filter( ( cacheName ) => {
        return cacheName.startsWith( 'murajiaty-' ) && cacheName !== CACHE_NAME;
      } ).
      map( ( cacheName ) => {
        return caches.delete( cacheName );
      } ) );
  } ).
    then( () => {
      return clients.claim();
    } ) );
};

self.addEventListener( 'install', handleInstall );
self.addEventListener( 'fetch', handleFetch );
self.addEventListener( 'activate', handleActivate );