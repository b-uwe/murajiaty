/**
 * @file Service worker for PWA offline functionality
 */

console.log( '[SW] Service worker script started loading' );

const CACHE_NAME = 'murajiaty-v1';
const urlsToCache = [
  './',
  './index.html',
  './main.js',
  './styles.css',
  './manifest.json'
];

console.log( '[SW] Constants defined:', { CACHE_NAME, urlsToCache } );

/**
 * Install event - cache resources
 * @param {ExtendableEvent} event - The install event
 * @returns {void}
 */
const handleInstall = ( event ) => {
  console.log( '[SW] Install event triggered' );
  console.log( '[SW] Install event object:', event );
  
  event.waitUntil(
    caches.open( CACHE_NAME )
      .then( ( cache ) => {
        console.log( '[SW] Cache opened successfully:', CACHE_NAME );
        console.log( '[SW] About to add URLs to cache:', urlsToCache );
        return cache.addAll( urlsToCache );
      } )
      .then( () => {
        console.log( '[SW] All URLs successfully added to cache' );
      } )
      .catch( ( error ) => {
        console.error( '[SW] Error during cache installation:', error );
        console.error( '[SW] Error stack:', error.stack );
      } )
  );
  console.log( '[SW] Install event handler completed' );
};

/**
 * Fetch event - serve from cache or network
 * @param {FetchEvent} event - The fetch event
 * @returns {void}
 */
const handleFetch = ( event ) => {
  console.log( '[SW] Fetch event triggered for:', event.request.url );
  console.log( '[SW] Fetch request method:', event.request.method );
  console.log( '[SW] Fetch request headers:', event.request.headers );
  
  event.respondWith(
    caches.match( event.request )
      .then( ( response ) => {
        if ( response ) {
          console.log( '[SW] Cache hit for:', event.request.url );
          console.log( '[SW] Returning cached response:', response );
          return response;
        }
        console.log( '[SW] Cache miss for:', event.request.url );
        console.log( '[SW] Fetching from network:', event.request.url );
        return fetch( event.request )
          .then( ( networkResponse ) => {
            console.log( '[SW] Network response received for:', event.request.url );
            console.log( '[SW] Network response status:', networkResponse.status );
            console.log( '[SW] Network response ok:', networkResponse.ok );
            return networkResponse;
          } )
          .catch( ( error ) => {
            console.error( '[SW] Network fetch failed for:', event.request.url, error );
            console.error( '[SW] Network error stack:', error.stack );
            throw error;
          } );
      } )
      .catch( ( error ) => {
        console.error( '[SW] Fetch handler error for:', event.request.url, error );
        console.error( '[SW] Fetch error stack:', error.stack );
        throw error;
      } )
  );
};

/**
 * Activate event - clean up old caches
 * @param {ExtendableEvent} event - The activate event
 * @returns {void}
 */
const handleActivate = ( event ) => {
  console.log( '[SW] Activate event triggered' );
  console.log( '[SW] Activate event object:', event );
  
  event.waitUntil(
    caches.keys().then( ( cacheNames ) => {
      console.log( '[SW] Available cache names:', cacheNames );
      console.log( '[SW] Current cache name:', CACHE_NAME );
      
      return Promise.all(
        cacheNames.map( ( cacheName ) => {
          if ( cacheName !== CACHE_NAME ) {
            console.log( '[SW] Deleting old cache:', cacheName );
            return caches.delete( cacheName );
          } else {
            console.log( '[SW] Keeping current cache:', cacheName );
          }
        } )
      );
    } )
      .then( ( results ) => {
        console.log( '[SW] Cache cleanup completed:', results );
        console.log( '[SW] Claiming clients to control all open pages...' );
        return clients.claim();
      } )
      .then( () => {
        console.log( '[SW] Clients claimed successfully - service worker now controls all pages' );
      } )
      .catch( ( error ) => {
        console.error( '[SW] Error during activation (cache cleanup or client claiming):', error );
        console.error( '[SW] Activation error stack:', error.stack );
      } )
  );
  console.log( '[SW] Activate event handler completed' );
};

console.log( '[SW] About to register event listeners' );

self.addEventListener( 'install', handleInstall );
console.log( '[SW] Install event listener registered' );

self.addEventListener( 'fetch', handleFetch );
console.log( '[SW] Fetch event listener registered' );

self.addEventListener( 'activate', handleActivate );
console.log( '[SW] Activate event listener registered' );

console.log( '[SW] Service worker script fully loaded and initialized' );