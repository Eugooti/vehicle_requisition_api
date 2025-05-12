// This file is used to set up the test environment before any tests run
const iconv = require('iconv-lite');

// Register the 'cesu8' encoding with iconv-lite
// This is needed for MySQL connections that use this encoding
if (!iconv.encodingExists('cesu8')) {
  // CESU-8 is similar to UTF-8 but with a different encoding for surrogate pairs
  // For our purposes, we can treat it as UTF-8
  iconv.encodings.cesu8 = iconv.encodings.utf8;
}

module.exports = async () => {
  console.log('Test environment setup complete');
};