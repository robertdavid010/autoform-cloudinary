About
=====

This package lets you use Cloudinary with autoform/simpleschema to easily upload an image to your Cloudinary account, and it automatically saves the url for the image using autoform.

Update
======

This package has been updated to improve the flexibility and control over the uploading and display of "form" element.

**Now supports:**

* maxFileSize: (int for MB)
* maxWidth: (int for pixels)
* maxHeight: (int for pixels)
* previewW: (int for pixels)
* previewH: (int for pixels)
* previewImg: (string for img url)
* previewCrop: (string for API param)



Usage
=====

1. `meteor add cosio55:autoform-cloudinary`

2. Set up settings.json file

```json
{
  "public": {
    "CLOUDINARY_API_KEY": "[YOUR API KEY]",
    "CLOUDINARY_CLOUD_NAME": "[YOUR CLOUD NAME]"
  },

  "CLOUDINARY_API_SECRET": "[YOUR API SECRET]"
}
```

3. Create collection and attach simple schema

```javascript
Images = new Mongo.Collection('images');

Images.attachSchema(new SimpleSchema({
  image: {
    type: String,
    autoform: {
      afFieldInput: {
        type: 'cloudinary'
      }
    }
  }
}));
```

4. Create quick form

```html
<template name="imageForm">
  {{> quickForm collection="Images" type="insert" id="add-image"}}
</template>
```

5. Run meteor

`meteor --settings settings.json`

6. Limitations

Cloudinary supports many file formats including images, video, audio, and other documents.

This link discusses it:
https://support.cloudinary.com/hc/en-us/articles/204292392-Why-does-Cloudinary-reject-the-files-I-m-uploading-

Based on that source, the below file formats are NOT supported by Cloudinary free/basic plans

'action', 'apk', 'app', 'bat', 'bin', 'cmd', 'com', 'command', 'cpl', 'csh', 'exe', 'gadget', 'inf1', 'ins', 'inx', 'ipa', 'isu', 'job', 'jse', 'ksh', 'lnk', 'msc', 'msi', 'msp', 'mst', 'osx', 'out', 'paf', 'pif', 'prg', 'ps1', 'reg', 'rgs', 'run', 'sct', 'shb', 'shs', 'u3p', 'vb', 'vbe', 'vbs', 'vbscript', 'workflow', 'ws', 'wsf'.
