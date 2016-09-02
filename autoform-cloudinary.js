AutoForm.addInputType('cloudinary', {
  template: 'afCloudinary',

  valueOut: function () {
    return this.val();
  }
});

Meteor.startup(function () {
    // Meteor.call('publicCredentials', function(err, res) {
    //   if (res) {
    //     $.cloudinary.config({
    //       cloud_name: res.cloudName,
    //       api_key: res.apiKey
    //     });
    //   } else {
    //     $.cloudinary.config({
    //       cloud_name: Meteor.settings.public.CLOUDINARY_CLOUD_NAME,
    //       api_key: Meteor.settings.public.CLOUDINARY_API_KEY
    //     });
    //   }
    // });
});


Template.afCloudinary.onCreated(function () {
  var self = this;

  self.srcId = new ReactiveVar();

  self.initialValueChecked = false;
  self.checkInitialValue = function () {
    Tracker.nonreactive(function () {
      if (! self.initialValueChecked && ! self.srcId.get() && self.data.value) {
        self.srcId.set(self.data.value);
        self.initialValueChecked = true;
      }
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
    var t = Template.instance();
    var srcId = t.srcId.get();
    t.checkInitialValue();
    // Force '.png' file type for previewing all files
    var theUrl = $.cloudinary.url(srcId + ".png", {width: 480, height: 220, crop: 'limit'});
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
