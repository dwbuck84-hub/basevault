// 1. ESTABLISH BARE-METAL PLATFORM SHIMS BEFORE ANY COMPILED CODE RUNS
if (typeof global !== 'undefined') {
  if (!global.window) global.window = global;
  
  if (!global.CustomEvent) {
    global.CustomEvent = class CustomEvent {
      constructor(type, params) {
        this.type = type;
        Object.assign(this, params);
      }
    };
    global.window.CustomEvent = global.CustomEvent;
  }

  if (!global.navigator) {
    global.navigator = {
      onLine: true,
      userAgent: 'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36',
    };
    global.window.navigator = global.navigator;
  } else {
    global.navigator.onLine = true;
  }

  global.window.addEventListener = () => {};
  global.window.removeEventListener = () => {};
  global.window.dispatchEvent = () => true;

  const { TextEncoder, TextDecoder } = require('text-encoding-polyfill');
  global.TextEncoder = TextEncoder;
  global.TextDecoder = TextDecoder;
  global.window.TextEncoder = TextEncoder;
  global.window.TextDecoder = TextDecoder;

  if (!global.HTMLElement) {
    class MockHTMLElement {}
    global.HTMLElement = MockHTMLElement;
    global.window.HTMLElement = MockHTMLElement;
  }
  if (!global.customElements) {
    global.customElements = { define: () => {}, get: () => {}, whenDefined: () => Promise.resolve() };
    global.window.customElements = global.customElements;
  }
  if (!global.CSSStyleSheet) {
    class MockCSSStyleSheet { replaceSync() {} insertRule() {} }
    global.CSSStyleSheet = MockCSSStyleSheet;
    global.window.CSSStyleSheet = MockCSSStyleSheet;
  }

  if (!global.document) {
    const mockEl = { setAttribute: () => {}, appendChild: () => {}, style: {} };
    global.document = {
      createElement: () => mockEl,
      getElementsByTagName: () => [mockEl],
      createTreeWalker: () => ({ nextNode: () => null, currentNode: null }),
      body: mockEl,
      documentElement: mockEl,
      addEventListener: () => {},
    };
    global.window.document = global.document;
  }

  if (!global.window.matchMedia) {
    global.window.matchMedia = (query) => ({
      matches: true,
      media: query,
      addListener: () => {},
      removeListener: () => {},
    });
  }
}

// 2. ADAPTIVE COMPONENT IMPORT BINDING DEFINITION
const { registerRootComponent } = require('expo');
const AppModule = require('./App');

// Resolve either ES module default exports or standard structural modules
const FinalApp = AppModule.default || AppModule;

if (!FinalApp) {
  console.error("❌ CRITICAL CONFIGURATION FAULT: ROOT APP MODULE RESOLVED TO UNDEFINED.");
}

registerRootComponent(FinalApp);
