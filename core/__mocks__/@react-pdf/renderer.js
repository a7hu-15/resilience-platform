module.exports = {
  pdf: () => ({
    toBuffer: async () => Buffer.from('mock-pdf-buffer'),
    toBlob: async () => new Blob(['mock-pdf']),
  }),
  Document: () => null,
  Page: () => null,
  Text: () => null,
  View: () => null,
  StyleSheet: { create: (styles) => styles },
};
