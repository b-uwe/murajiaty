/**
 * @file Service worker for PWA offline functionality
 */

const CACHE_NAME = 'murajiaty-v1';
const urlsToCache = [
  './',
  './index.html',
  './main.js',
  './styles.css',
  './manifest.json'
];

/**
 * Install event - cache resources
 * @param {ExtendableEvent} event - The install event
 * @returns {void}
 */
const handleInstall = ( event ) => {
  event.waitUntil(
    caches.open( CACHE_NAME )
      .then( ( cache ) => {
        return cache.addAll( urlsToCache );
      } )
  );
};

/**
 * Fetch event - serve from cache or network
 * @param {FetchEvent} event - The fetch event
 * @returns {void}
 */
const handleFetch = ( event ) => {
  event.respondWith(
    caches.match( event.request )
      .then( ( response ) => {
        if ( response ) {
          return response;
        }
        return fetch( event.request );
      } )
  );
};

/**
 * Activate event - clean up old caches
 * @param {ExtendableEvent} event - The activate event
 * @returns {void}
 */
const handleActivate = ( event ) => {
  event.waitUntil(
    caches.keys().then( ( cacheNames ) => {
      return Promise.all(
        cacheNames.map( ( cacheName ) => {
          if ( cacheName !== CACHE_NAME ) {
            return caches.delete( cacheName );
          }
        } )
      );
    } )
  );
};

self.addEventListener( 'install', handleInstall );
self.addEventListener( 'fetch', handleFetch );
self.addEventListener( 'activate', handleActivate );