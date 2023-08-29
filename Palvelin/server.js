const express = require('express');
const path = require('path');
const fs = require('fs');
const app = express();
const port = 8080
const cheerio = require('cheerio');

let currentWindowsCDNShare = null;

app.use(express.static(path.join(__dirname, 'dist')));

function genUUid() {
  let uuid = '';
  const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

  const sections = [15, 10, 10, 10, 10, 10];

  for (let i = 0; i < sections.length; i++) {
    if (i > 0) {
      uuid += "_";
    }

    for (let j = 0; j < sections[i]; j++) {
      uuid += possible.charAt(Math.floor(Math.random() * possible.length));
    }
  }

  return uuid;
}

app.get('/windows', (req, res) => {
  const downloadsPath = path.join(__dirname, 'windowsCDN');

  fs.readdir(downloadsPath, (err, files) => {
    if (err) {
      console.error('Error reading directory:', err);
      return res.status(500).send('Internal Server Error');
    }

    const filteredFiles = files.filter(file => file.endsWith('.iso'));
    
    const downloadLinks = filteredFiles.map(file => {

      var type = null;

      if (file.includes('x64x86')) type = '64-bit & 32-bit';
      else if (file.includes('x64')) type = '64-bit';
      else if (file.includes('x86')) type = '32-bit';
      else type = 'Unknown';

      let newName = file.replace('x64', '');
      newName = newName.replace('x86', '');

      var isAvailable, statuksenClassit = null;
      
      if (fs.existsSync(path.join(downloadsPath, file))) {
        isAvailable = true;
        statuksenClassit = 'bg-green-800 text-green-100';
      } else {
        isAvailable = false;
        statuksenClassit = 'bg-yellow-800 text-yellow-100';
      }

      const stats = fs.statSync(path.join(downloadsPath, file));
      const fileSizeInBytes = stats.size;
      const fileSizeInMegabytes = fileSizeInBytes / 1000000.0;

      if (fileSizeInMegabytes < 250) {
        return null;
      }

      const fileSizeInGigabytes = (fileSizeInMegabytes / 1000.0).toFixed(2);

      const date = new Date(stats.ctimeMs);
      const day = date.getDate();
      const month = date.getMonth() + 1;
      const year = date.getFullYear();

      const dateCreated = `${day}.${month}.${year}`;

      return `
      <tr class="bg-[#212120] border-b border-[#1C1C1B]">
        <th scope="row" class="px-6 py-4 font-medium whitespace-nowrap text-white">
            ${isAvailable ? `<a href="/${currentWindowsCDNShare}/${file}" class="text-[#4895ef] hover:opacity-60 transition duration-200 font-bold" >${newName}</a>` : newName}
        </th>
        <td class="px-6 py-4">
            ${fileSizeInGigabytes} GB
        </td>
        <td class="px-6 py-4">
            ${type}
        </td>
        <td class="px-6 py-4">
            ${dateCreated}
        </td>
        <td class="px-6 py-4">
            <span class="${statuksenClassit} text-xs font-medium mr-2 px-2.5 py-0.5 rounded">
                ${isAvailable ? 'Aktiivinen' : 'Ei Saatavilla'}
            </span>
        </td>
      </tr>`;
    }).join('');


    var readedHTML = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');

    const $ = cheerio.load(readedHTML);

    $('#tablenbody').html(downloadLinks);
    
    res.send($.html());
  });
}); 

app.listen(port, () => {
  currentWindowsCDNShare = genUUid();
  app.use('/' + currentWindowsCDNShare, express.static(path.join(__dirname, 'windowsCDN')));
  console.log(`Example app listening at http://localhost:${port}`)
})