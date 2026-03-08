/**
 * @file Service worker for PWA offline functionality
 */

const CACHE_NAME = 'murajiaty-v3';
const urlsToCache = [
  './',
  './index.html',
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
  event.waitUntil(
    caches.open( CACHE_NAME ).
      then( ( cache ) => cache.addAll( urlsToCache ) )
  );
};

/**
 * Fetch event - serve from cache or network
 * @param {FetchEvent} event - The fetch event
 * @returns {void}
 */
const handleFetch = ( event ) => {
  event.respondWith(
    caches.open( CACHE_NAME ).
      then( ( cache ) => cache.match( event.request ) ).
      then( ( response ) => {
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
    caches.keys().then( ( cacheNames ) => Promise.all(
      cacheNames.
        filter( ( cacheName ) => cacheName.startsWith( 'murajiaty-' ) && cacheName !== CACHE_NAME ).
        map( ( cacheName ) => caches.delete( cacheName ) )
    ) ).
      then( () => clients.claim() )
  );
};

self.addEventListener( 'install', handleInstall );
self.addEventListener( 'fetch', handleFetch );
self.addEventListener( 'activate', handleActivate );