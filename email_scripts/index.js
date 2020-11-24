const { promises: fsPromises } = require('fs');
const mjml2html = require('mjml');

const read = (path) => fsPromises.readFile(path, { encoding: 'utf-8' });
const write = (path, data) =>
  fsPromises.writeFile(path, data, { encoding: 'utf-8' });

const main = async () => {
  const mjml = await read('email_scripts/email_template.mjml');
  const { html } = mjml2html(mjml, {
    keepComments: false,
    minify: true,
  });
  await write('email_scripts/email_template.html', html);
};

main();
