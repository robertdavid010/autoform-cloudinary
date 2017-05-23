Package.describe({
  name: 'cosio55:autoform-cloudinary',
  git: 'https://github.com/cosio55/autoform-cloudinary.git',
  summary: 'Use Cloudinary with autoform/simpleschema to upload an image, and save the url on the collection.',
  version: '0.0.2'
});

Package.onUse(function (api) {
  Npm.depends({
    cloudinary: '1.2.1'
  });
  
  api.versionsFrom('1.1.0.2');

  api.use([
    'templating',
    'reactive-var',
    'underscore',
    'nekojira:cloudinary-jquery-upload@0.1.0',
    'aldeed:autoform@6.1.0'
  ], 'client');

  api.addFiles([
    'autoform-cloudinary.html',
    'autoform-cloudinary.css',
    'autoform-cloudinary.js'
  ], 'client');


  api.addFiles([
    'autoform-cloudinary-server.js'
  ], 'server');

  api.addAssets([
    'public/img/iconImage_64.png',
    'public/img/iconPDF_64.png',
    ],'client');

});
