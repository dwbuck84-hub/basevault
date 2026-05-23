// ==========================================
// 🛡️ BARE-METAL UNIVERSAL BROWSER EMULATION SHIELDS
// ==========================================
if (typeof global !== 'undefined') {
  if (!global.window) {
    global.window = global;
  }
  
  global.window.addEventListener = () => {};
  global.window.removeEventListener = () => {};
  global.window.dispatchEvent = () => true;
  
  if (!(global as any).document) {
    const mockElement = {
      setAttribute: () => {},
      appendChild: () => {},
      style: {},
      pathname: '',
      hash: '',
      search: '',
      href: ''
    };
    
    const mockDocument = {
      createElement: () => mockElement,
      getElementsByTagName: () => [mockElement],
      getElementById: () => null,
      querySelector: () => null,
      querySelectorAll: () => [],
      createTreeWalker: () => ({
        nextNode: () => null,
        currentNode: null
      }),
      body: mockElement,
      documentElement: mockElement,
      addEventListener: () => {},
      removeEventListener: () => {},
    };
    
    (global as any).document = mockDocument;
    (global as any).window.document = mockDocument;
  }

  if (!(global as any).HTMLElement) {
    class MockHTMLElement {}
    (global as any).HTMLElement = MockHTMLElement;
    (global as any).window.HTMLElement = MockHTMLElement;
  }

  if (!(global as any).customElements) {
    const mockCustomElements = {
      define: () => {},
      get: () => {},
      whenDefined: () => Promise.resolve(),
    };
    (global as any).customElements = mockCustomElements;
    (global as any).window.customElements = mockCustomElements;
  }

  if (!(global as any).CSSStyleSheet) {
    class MockCSSStyleSheet {
      replaceSync() {}
      insertRule() {}
    }
    (global as any).CSSStyleSheet = MockCSSStyleSheet;
    (global as any).window.CSSStyleSheet = MockCSSStyleSheet;
  }

  if (!global.window.matchMedia) {
    global.window.matchMedia = (query: string) => ({
      matches: true,
      media: query,
      onchange: null,
      addListener: () => {},
      removeListener: () => {},
      addEventListener: () => {},
      removeEventListener: () => {},
      dispatchEvent: () => true,
    } as any);
  }

  const { TextEncoder, TextDecoder } = require('text-encoding-polyfill');
  (global as any).TextEncoder = TextEncoder;
  (global as any).TextDecoder = TextDecoder;
  global.window.TextEncoder = TextEncoder;
  global.window.TextDecoder = TextDecoder;
}

if (typeof global !== 'undefined' && !(global as any).CustomEvent) {
  (global as any).CustomEvent = class CustomEvent {
    type: string;
    constructor(type: string, params?: any) {
      this.type = type;
      Object.assign(this, params);
    }
  };
}

// ==========================================
// 🚀 EXPLICIT COMPONENT HOOK INJECTION
// ==========================================
import { registerRootComponent } from 'expo';
import App from './App';

registerRootComponent(App);
