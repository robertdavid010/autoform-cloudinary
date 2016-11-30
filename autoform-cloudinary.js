AutoForm.addInputType('cloudinary', {
  template: 'afCloudinary',

  valueOut: function () {
    return this.val();
  }
});

Template.afCloudinary.onCreated(function () {
  var self = this;

  self.srcId = new ReactiveVar();
  self.upProg = new ReactiveDict();

  self.initialValueChecked = false;
  self.checkInitialValue = function () {
    Tracker.nonreactive(function () {

      if (self.data.value) {
        // Set to existing form field value
        // Initialize reactiveVar to form data value on first run
        console.log("there was a field value");
        if (!self.initialValueChecked && !self.srcId.get()) {
          self.srcId.set(self.data.value);
          self.initialValueChecked = true;
        }

      } else {
        // NOTE: All of this is only to support other image sources,
        // by getting the image srcId from the form context.
        // as assumed naming convention for any data of a pic
        console.log("there was no field data");

        // Check the form data context for image items in form 'currentDoc'
        // Yes, apparently the form context is 9 levels up...
        var formDoc = Template.parentData(9).currentDoc;
        // console.log(formDoc);
        if (formDoc) {

          // Find the fields of interest, and set srcId reactive var
          if (formDoc.picture) {
            self.srcId.set(formDoc.picture);
            self.initialValueChecked = true;
          } else if (formDoc.pdf) {
            self.srcId.set(formDoc.pdf);
            self.initialValueChecked = true;
          } else if (formDoc.profile && formDoc.profile.picture) {
            // This assumes the form data context is a user document
            self.srcId.set(formDoc.profile.picture);
            self.initialValueChecked = true;
          }

        } // END if (formDoc)

      } // END if (self.data.value)

    }); // END Tracker.nonreactive()

  }; // END self.checkinitialValue()

  self.autorun(function() {
    // We want to track uplaoding status....?!?!

  });

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
    } else {
      // Add result of server signing as config DOM object
      // for full client-side uploading. Can include transformations
      self.$('input.cloudinary-fileupload[type=file]').cloudinary_fileupload({
        formData: res
      });
    }

  });

  // Can we take this over for progress?
  var cdyElem = 'input.cloudinary-fileupload[type=file]';
  // self.$cdyElem.bind('fil')
  // self.$('input.cloudinary-fileupload[type=file]').bind('fileuploadprogress', function(e, data) {
  self.$(cdyElem).bind('fileuploadprogress', function(e, data) {
    self.$('.progress > .progress-bar').css('width', Math.round((data.loaded * 100.0) / data.total) + '%');
  });

  self.$(cdyElem).on('fileuploaddone', function (e, data) {
    // Seting data to id instead of url
    console.log("checking results of upload");
    console.log(data.result);
    // self.srcId.set(data.result.secure_url);
    self.srcId.set(data.result.public_id);
    Tracker.flush();
  });

  // self.$("[data-nav='afDropUpload']").on('drop', function (e, data) {
    // Just testing drag-n-drop implementation
    // self.srcId.set(data.result.secure_url);
    // Tracker.flush();
  // });

  self.$(self.firstNode).closest('form').on('reset', function () {
    self.srcId.set(null);
  });
});

Template.afCloudinary.helpers({
  fileImg: function () {
    // This is to handle non-cloudinary images from FS.file

  },
  cdyAtts: function () {
    var dObj = {};
    dObj["data-form-data"] = JSON.stringify({
      "signature": "test"
    });

    return dObj;

  },
  previewUrl: function () {
    var t = Template.instance();
    var srcId = t.srcId.get();
    t.checkInitialValue();
    var theUrl = $.cloudinary.url(srcId + ".png", {width: 480, height: 270, crop: 'fill'});
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
    // TODO: This is currently unused. Consider removing
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
    // also need to clear the form...
    $(e.currentTarget).siblings("input.cloudinary-fileupload[type=file]").val("");
  },

  "change input.cloudinary-fileupload[type=file]": function(e, t, data) {

    // we should check to see if this is a remove
    if ($(event.currentTarget).val()) {
      console.log("we are removing the data")
    } else {
      var file = e.currentTarget.files[0];
      t.uploadFiles(file);
    }

    // return t.uploadFiles(new FS.File(data.files[0]));
  },

});
