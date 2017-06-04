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
        if (!self.initialValueChecked && !self.srcId.get()) {
          self.srcId.set(self.data.value);
          self.initialValueChecked = true;
        }

      } else {
        // NOTE: This is experimental
        // All of this is to allow for support other image sources,
        // by getting the image srcId from the form context
        // by assumed naming convention for any data of a pic.
        // It is intented to help with migration from an existing
        // img data store. Just put the old images in the template
        // context with the autoform.

        // Check the form data context for image items in form 'currentDoc'
        // Yes, apparently the form context is 9 levels up...
        var formDoc = Template.parentData(9).currentDoc;
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

  // NOTE: Unused at the moment, is a manual server
  // call for the cloudinary method. We are using client side.
  // self.uploadFiles = function (file) {
    // Here we can hand off uploading files..
    // Also potentially allows for multi process support...

    // Cloudinary.upload(file,
    //   {width: 1320, height: 960, crop: "limit"},
    //   function (err, res) {
    //   if (err) {
    //     console.error("There was an error uploading to Cloudinary");
    //     console.log(err);
    //   } else {
    //     console.error("Success uploading to Cloudinary!");
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
  var ats = self.data.atts;
  var cdyParams = self.data.atts.cdyParams;

  var conf = {};
  // Define config for signature and initialization of DOM
  if (cdyParams && ats.accept.toLowerCase().indexOf("pdf") === -1 ) {
    conf["transformation"] = "c_limit,h_" + cdyParams.height + ",w_" + cdyParams.width
  }

  Meteor.call('afCloudinarySign', conf, function (err, res) {
    if (err) {
      return console.log(err);
    } else {
      // Add result of server signing as DOM property
      // for full client-side uploading
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
    // Event trigger for client upload completed
    var res = data.result;
    if (res) {
      self.$(".progress").hide();
      self.$("button[type=button]").show();
      self.$(progElem).css("width", "5%");
      self.srcId.set("v" + res.version + "/" + res.public_id);
      Tracker.afterFlush(function() {
        self.$(".afCloudinary-Input").trigger("change");
        // Param to trigger submit immediately
        if (self.data.atts.cdyParams.autoSubmit) {
          $(".afCloudinary-Input").closest("form").submit();
        }
      });
      Tracker.flush();
    }
  });

  // Reset reactiveVar on reset form
  self.$(self.firstNode).closest('form').on('reset', function () {
    self.srcId.set(null);
  });
});

Template.afCloudinary.helpers({
  // TODO: A temporary hack to try and smooth image src transition in DOM
  lowresSrc: function () {
    var t = Template.instance();
    var as = t.data.atts;
    if (as.accept.toLowerCase().indexOf("pdf") != -1) {
      return "/packages/cosio55_autoform-cloudinary/public/img/iconPDF_64.png";
    } else {
      return "/packages/cosio55_autoform-cloudinary/public/img/iconImage_64.png";
    }
  },
  previewUrl: function () {
    var t = Template.instance();
    var as = t.data && t.data.atts;
    var cdy = as.cdyParams || null;
    var conf = {};
    // Set values or default
    conf.width = cdy && cdy.previewW || 480;
    conf.height = cdy && cdy.previewH || 270;
    conf.crop = cdy && cdy.previewCrop || "fill"; // Default crop

    if (as.accept.toLowerCase().indexOf("pdf") != -1) {
      conf.crop = cdy && cdy.previewCrop || "limit"; // Default crop override for PDF documents
    } else {

      if (as["data-schema-key"].toLowerCase().indexOf("profile") != -1 || as.name.toLowerCase().indexOf("profile") != -1) {
        // Assume any field with profile in it, will be a square img
        if (!(cdy && cdy.previewW && cdy.previewH)) {
          conf.width = 256; conf.height = 256;
        }
      } else {

        if (!(cdy && cdy.previewW && cdy.previewH) && cdy.maxWidth && cdy.maxHeight) {
          // Set preview = 1/2 max dimensions if nothing else
          conf.width = cdy.maxWidth/2; conf.height = cdy.maxHeight/2;
        } else {
          // Set preview widths as defined in schema
          conf.width = cdy && cdy.previewW || 320;
          conf.height = cdy && cdy.previewH || 600;
        }

      }
    }

    var srcId = t.srcId.get();
    var theUrl;
    t.checkInitialValue();

    if (srcId) {
      theUrl = $.cloudinary.url(srcId + ".png", conf);
    } else if (as.accept.toLowerCase().indexOf("pdf") != -1) {
      theUrl = cdy && cdy.placeholderImg || "/packages/cosio55_autoform-cloudinary/public/img/iconPDF_64.png";
    } else {
      theUrl = cdy && cdy.placeholderImg || "/packages/cosio55_autoform-cloudinary/public/img/iconImage_64.png";
    }
    return theUrl;
  },

  // Helper to track data for entry into form
  srcId: function () {
    var t = Template.instance();
    t.checkInitialValue();
    return t.srcId.get();
  },

  // Will display defined limits in input templates based on schema
  optimal: function () {
    var cdy = this.atts && this.atts.cdyParams
    if (cdy) {
      if (cdy.maxFileSize) {
        return "(Max file size: " + cdy.maxFileSize + "MB)"
      } else if (cdy.maxWidth && cdy.maxHeight) {
        return "(Optimal size: " + cdy.maxWidth + " x " + cdy.maxHeight + ")";
      }
    }
    return null
  },

  accept: function () {
    return this.atts.accept || 'image/*';
  },

  label: function () {
    return this.atts.label || 'Choose File';
  },

  // This helper allows us to pass extra config element
  // from the form schema. It fixes and replaces atts.
  inputAtts: function () {
    var ats = this.atts;
    var attributes = {};
    for (var e in ats) {
      if (e != "cdyParams") {
        attributes[e] = ats[e];  
      }
    }
    return attributes;
  },

  helpText: function () {
    return this.atts.cdyParams.helpText || null
  }

});

Template.afCloudinary.events({

  "click [data-action='afDropUpload']": function(e) {
    // TODO: Enable this feature
    e.stopPropagation();
    e.preventDefault();
    $(e.currentTarget).siblings("input.cloudinary-fileupload[type=file]").click();
  },

  "dragover [data-action='afDropUpload']": function(e) {
    // TODO: Enable this feature
    e.stopPropagation();
    e.preventDefault();
  },

  "dragenter [data-action='afDropUpload']": function(e) {
    // TODO: Enable this feature
    e.stopPropagation();
    e.preventDefault();
  },

  "drop [data-action='afDropUpload']": function(e, t) {
    // TODO: Test & enable this feature
    e.stopPropagation();
    e.preventDefault();

    var file = e.originalEvent.dataTransfer.files[0];
    t.uploadFiles(file);

  },

  "click [data-action='afSelectFile']": function (e, t) {
    // Manully trigger hidden element
    e.stopPropagation();
    e.preventDefault();
    $(e.currentTarget).siblings("input.cloudinary-fileupload[type=file]").click();
  },

  "click [data-action='afRemoveFile']": function(e, t) {
    e.preventDefault();
    t.srcId.set(null);
    // Also clear the form...
    $(e.currentTarget).siblings("input.cloudinary-fileupload[type=file]").val("");
    $(e.currentTarget).siblings("input.afCloudinary-Input").change();
  },

  "change input.cloudinary-fileupload[type=file]": function(e, t, data) {
    // Nothing for now...
  },

});