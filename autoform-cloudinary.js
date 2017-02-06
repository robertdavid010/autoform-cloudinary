AutoForm.addInputType('cloudinary', {
  template: 'afCloudinary',

  valueOut: function () {
    return this.val();
  }
});

Template.afCloudinary.onCreated(function () {
  var self = this;
  var t = Template.currentData();
  // var collect = t.atts.collection;
  var docType = t.atts.accept;
  var formDoc = Template.parentData(9).currentDoc;

  self.srcId = new ReactiveVar();

  // check for data, check for cdy
  

  if (formDoc && docType && docType.search(/pdf/i)) {
    // This is the pdf case
    if (formDoc.pdf) {

      self.srcId.set(formDoc.pdf);

    } else if (formDoc.profile && formDoc.profile.mediakit) {

      self.srcId.set(formDoc.profile.mediakit);

    };


  // We assume all other images
  } else if (formDoc && formDoc.profile && formDoc.profile.picture) {

    // this is a profile picture
    self.srcId.set(formDoc.profile.picture);

  } else if (formDoc && formDoc.picture) {
    // this is some other picture
    self.srcId.set(formDoc.picture);

  };


  self.initialValueChecked = false;
  self.checkInitialValue = function () {
    Tracker.nonreactive(function () {


      // Set to existing form field value
      if (! self.initialValueChecked && ! self.srcId.get() && self.data.value) {
        self.srcId.set(self.data.value);
        self.initialValueChecked = true;
      };

    });

  };

  self.uploadFiles = function (file) {
    // Here we can hand off uploading files..
    // Also potentially allows for multi process support...

    Cloudinary.upload(file,
      {width: 1320, height: 960, crop: "limit"},
      function (err, res) {
      if (err) {
        console.log("There was an error uploading to Cloudinary");
        console.log(err);
      } else {
        console.log("Success uploading to Cloudinary!");
        console.log(res);
        // Prepare data for storing in database
        self.srcId.set("v" + res.version + "/" + res.public_id);
      };
    });

  };

});

Template.afCloudinary.onRendered(function () {
  var self = this;

  Meteor.call('afCloudinarySign', function (err, res) {
    if (err) {
      return console.log(err);
    }

    // Initialize fields to be used based on server
    // method call above
    // self.$('input.cloudinary-fileupload[type=file]').cloudinary_fileupload({
      // formData: res
    // });
  });

  /*
  self.$('input.cloudinary-fileupload[type=file]').on('fileuploaddone', function (e, data) {
    // Seting data to id instead of url
    console.log("checking results of upload");
    console.log(data.result);
    // self.srcId.set(data.result.secure_url);
    self.srcId.set(data.result.public_id);
    Tracker.flush();
  });
*/

  self.$("[data-nav='afDropUpload']").on('drop', function (e, data) {
    // Just testing drag-n-drop implementation
    // self.srcId.set(data.result.secure_url);
    // Tracker.flush();
  });

  self.$(self.firstNode).closest('form').on('reset', function () {
    self.srcId.set(null);
  });
});

Template.afCloudinary.helpers({
  fileImg: function () {
    // This is to handle non-cloudinary images from FS.file

  },
  previewUrl: function () {
    var theUrl;
    var t = Template.instance();
    var srcId = t.srcId.get();
    var collect = this.atts.collection;
    var accept = this.atts.accept;
    t.checkInitialValue();

    // Cloudinary record includes version which starts
    // with 'v' first char and contains '/'
    if (srcId && srcId.startsWith("v") && srcId.includes("/")) {
      // This is a couldinary resource
      // Force '.png' for previewing all files
      theUrl = $.cloudinary.url(srcId + ".png", {width: 480, height: 220, crop: 'limit'});
    } else if (srcId) {
      // We assume this is a file repo
      // Also check for types
      // if this is an original non-image, we return a flag...
      // YAY we get to map collections to image collections...
      var imgCollections = [
        {rel: "Images", relType: "image", relSrc: "Images", params: {}},
        {rel: "Pdfs", relType: "pdf", relSrc: "Pdfs"},
        {rel: "ProfilePicture", relType: "image", relSrc: "ProfilePicture"},
        {rel: "Mediakit", relType: "pdf", relSrc: "Mediakit"},
        {rel: "Postimages", relType: "image", relSrc: "Postimages"},

      ];


      var theCollection = imgCollections.filter(function (o) {
        return (o.rel === collect && accept.search(o.relType));
      }).shift();

      console.log("logging inside previewUrl:helper in autoform-cloudinary.js");
      console.log(theCollection);


      var imgSrc = theCollection && theCollection.relSrc;
      console.log(imgSrc);

      var pic;

      if (imgSrc) {

        switch (imgSrc) {
          case "Images":
            pic = Images.findOne(srcId);
          break;
          case "Pdfs":
            pic = Pdfs.findOne(srcId);
          break;
          case "Postimages":
            pic = Postimages.findOne(srcId);
          break;
          case "ProfilePicture":
            pic = ProfilePicture.findOne(srcId);
          break;
          case "Mediakit":
            pic = Mediakit.findOne(srcId);
          break;
        };

        theUrl = pic && pic.url() || null;

        // var pic = global.Pdfs.findOne(srcId) || null;
        // console.log(pic);
        // theUrl = pic && pic.url() || null;
        // console.log(theUrl);
      };


     // var rec = global[collec].findOne(srcId);

    };
    return theUrl;
  },
  srcId: function () {
    var t = Template.instance();
    t.checkInitialValue();
    return t.srcId.get();
  },

  accept: function () {
    return this.atts.accept || 'image/*';
  },

  label: function () {
    return this.atts.label || 'Choose File';
  },

  origPic: function () {
    // get the image from collection
    // return Template.instance().data;
    // WOW: 9 levels to get to the context we need...
    var imgId;
    var formDoc = Template.parentData(9).currentDoc;
    if (formDoc && formDoc.picture) {
      imgId = formDoc.picture;
    } else if (formDoc && formDoc.profile && formDoc.profile.picture) {
      imgId = formDoc.profile.picture;
    };
    return Template.parentData(2);
  }

});

Template.afCloudinary.events({

 "dragover data-action[data-action='afDropUpload']": function(e) {
    e.stopPropagation();
    e.preventDefault();
  },

  "dragenter data-action[data-action='afDropUpload']": function(e) {
    e.stopPropagation();
    e.preventDefault();
  },

  "drop data-action[data-action='afDropUpload']": function(e, t) {
    e.stopPropagation();
    e.preventDefault();

    var file = e.originalEvent.dataTransfer.files[0];
    t.uploadFiles(file);

    // return t.uploadFiles(new FS.File(e.originalEvent.dataTransfer.files[0]));
  },

  "click [data-action='afSelectFile']": function (e, t) {

    $(e.currentTarget).siblings("input.cloudinary-fileupload[type=file]").click();

  },

  "click [data-action='afRemoveFile']": function(e, t) {
    e.preventDefault();
    t.srcId.set(null);
  },

  "change input.cloudinary-fileupload[type=file]": function(e, t, data) {

    var file = e.currentTarget.files[0];
    t.uploadFiles(file);

    // return t.uploadFiles(new FS.File(data.files[0]));
  },

});
