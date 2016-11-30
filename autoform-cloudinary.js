/*
 * AutoForm Cloudinary handler package **********
 *
 * This package displays a file upload interface
 * and handles user interaction and data handling
 * of user selected files.
 * TODO: Expand description and definitions
 * https://github.com/blueimp/jQuery-File-Upload/wiki
 *
 */

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
        // It helps with migration from existing img data store
        // just put the old images in the template context with
        // the autoform
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

  //  NOTE: Unused at the moment
  // self.uploadFiles = function (file) {
    // Here we can hand off uploading files..
    // Also potentially allows for multi process support...

    // Cloudinary.upload(file,
    //   {width: 1320, height: 960, crop: "limit"},
    //   function (err, res) {
    //   if (err) {
    //     console.log("There was an error uploading to Cloudinary");
    //     console.log(err);
    //   } else {
    //     console.log("Success uploading to Cloudinary!");
    //     console.log(res);
    //     // Prepare data for storing in database
    //     self.srcId.set("v" + res.version + "/" + res.public_id);
    //   };
    // });

  // };

});

Template.afCloudinary.onRendered(function () {
  var self = this;

  var cdyElem = "input.cloudinary-fileupload[type=file]";
  var progElem = ".progress-bar:not(.progress-bar-placeholder)";

  Meteor.call('afCloudinarySign', function (err, res) {
    if (err) {
      return console.log(err);
    } else {
      // Add result of server signing as config DOM object
      // for full client-side uploading (can include transformations)
      self.$(cdyElem).cloudinary_fileupload({
        formData: res
      });
    }

  });

  /* Progress Indicator *************************************
   * NOTE: Go here for more info
   * https://github.com/blueimp/jQuery-File-Upload/wiki/Options
   *
   */

  // Initialize progress indicator element
  self.$(cdyElem).bind('fileuploadprogress', function(e, data) {
    self.$(progElem).css('width', Math.round((data.loaded * 100.0) / data.total) + '%');
  });

  // Fileupload hooks
  self.$(cdyElem).bind('fileuploadadd', function(e, data) {
    self.$("button[type=button]").hide();
    self.$(".progress").show();
  });

  self.$(cdyElem).on('fileuploaddone', function (e, data) {
    var res = data.result;
    if (res) {

      self.$(".progress").hide();
      self.$("button[type=button]").show();
      self.$(progElem).css("width", "5%");
      self.$(".afCloudinary-Input").change();
      self.srcId.set("v" + res.version + "/" + res.public_id);
      Tracker.flush();

    }
  });

  // Reset reactiveVar on reset form
  self.$(self.firstNode).closest('form').on('reset', function () {
    self.srcId.set(null);
  });
});

Template.afCloudinary.helpers({
  previewUrl: function () {

    var conf = {};
    var t = Template.instance();
    console.log("data context in previewUrl helper");
    console.log(t);
    var as = t.data.atts;
    if (as.accept.toLowerCase().indexOf("pdf") != -1) {
      conf.width = 480; conf.height = 270; conf.crop = "limit";
    } else {
      if (as["data-schema-key"].toLowerCase().indexOf("profile") != -1 || as.name.toLowerCase().indexOf("profile") != -1) {
        conf.width = 270; conf.height = 270; conf.crop = "fill";
      } else {
        conf.width = 480; conf.height = 270; conf.crop = "fill";
      }
    }

    var srcId = t.srcId.get();
    var theUrl;
    t.checkInitialValue();
    if (srcId) {
      theUrl = $.cloudinary.url(srcId + ".png", conf);
    } else if (as.accept.toLowerCase().indexOf("pdf") != -1) {
      theUrl = "/img/icons/iconPDF_64.png";
    } else {
      theUrl = "/img/icons/iconCampaignImage_64.png";
    }
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

  },

  "click [data-action='afSelectFile']": function (e, t) {

    $(e.currentTarget).siblings("input.cloudinary-fileupload[type=file]").click();

  },

  "click [data-action='afRemoveFile']": function(e, t) {
    e.preventDefault();
    t.srcId.set(null);
    // also need to clear the form...
    $(e.currentTarget).siblings("input.cloudinary-fileupload[type=file]").val("");
    $(e.currentTarget).siblings("input.afCloudinary-Input").change();
  },

  "change input.cloudinary-fileupload[type=file]": function(e, t, data) {
    // return t.uploadFiles(new FS.File(data.files[0]));
    // return t.uploadFiles(new FS.File(e.originalEvent.dataTransfer.files[0]));
  },

});
