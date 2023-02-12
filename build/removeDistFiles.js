const fs = require('fs');
const path = require('path');

const dir = 'dist';

fs.readdir(dir, (err, files) => {
  if (err) throw err;

  for (const file of files) {
    fs.unlink(path.join(dir, file), (err) => {
      if (err) throw err;
    });
  }

  console.log('- dist directory successfully emptied');
});