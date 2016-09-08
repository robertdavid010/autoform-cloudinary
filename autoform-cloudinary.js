AutoForm.addInputType('cloudinary', {
  template: 'afCloudinary',

  valueOut: function () {
    return this.val();
  }
});

Template.afCloudinary.onCreated(function () {
  var self = this;

  self.srcId = new ReactiveVar();

  self.initialValueChecked = false;
  self.checkInitialValue = function () {
    Tracker.nonreactive(function () {
      // Perform checks and initialize reactive var 'srcId'
      if (self.data.value) {

        // Set to existing form field value
        if (! self.initialValueChecked && ! self.srcId.get()) {
          self.srcId.set(self.data.value);
          self.initialValueChecked = true;
        };

      } else {

        // Check the form data context for item 'currentDoc'
        // as assumed naming convention for any data of a pic

        // Yes, apparently the form context is 9 levels up...
        var formDoc = Template.parentData(9).currentDoc;
        if (formDoc) {

          // Find the fields of interest, and set reactive var 'srcId'
          if (formDoc.picture) {

            self.srcId.set(formDoc.picture)
            self.initialValueChecked = true;

          } else if (formDoc.profile && formDoc.profile.picture) {

            // This assumes the form data context is a user document
            self.srcId.set(formDoc.profile.picture)
            self.initialValueChecked = true;

          };

        };

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
    var collec = this.atts.collection;
    var type = this.atts.accept;
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
        {rel: "Campaigns", type: "image", src: "Images"},
        {rel: "Campaigns", type: "pdf", src: "Pdfs"},
        {rel: "users", type: "image", src: "ProfilePicture"},
        {rel: "users", type: "pdf", src: "Mediakit"},
        {rel: "Posts", type: "image", src: "Postimages"},

      ];

      var theCollection = imgCollections.filter(function (o) {
        return (o.rel === collec && type.search(o.type));
      }).shift();

      console.log("logging inside previewUrl:helper in autoform-cloudinary.js");
      console.log(theCollection);

      var imgSrc = theCollection.src;

      pic = global[imgSrc].findOne(srcId) || null;
      theUrl = pic.url();

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
