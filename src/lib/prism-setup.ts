import Prism from 'prismjs';

// Prevent Prism from automatically highlighting all code blocks on the page
Prism.manual = true;

// Make Prism available globally for plugins/components that expect it
if (typeof window !== 'undefined') {
  (window as any).Prism = Prism;
}

export default Prism;
