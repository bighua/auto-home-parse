var nodemailer = require('nodemailer');

module.exports = function(file) {

    var transport = nodemailer.createTransport("SMTP", {
            // service: 'jihuomedia.com', // Actually, if you are authenticating with an e-mail address that has a domain name 
                              // like @gmail.com or @yahoo.com etc., 
                              // then you don't even need to provide the service name, it is detected automatically.
            host: "smtpcom.263xmail.com",
            port: "25",
            auth: {
                user: "zhuxianghua@8chedao.com",
                pass: "zxh123456789"
            }
        });

    console.log('SMTP Configured');

    // Message object
    var message = {

        // sender info
        from: 'zhuxianghua <zhuxianghua@8chedao.com>',

        // Comma separated list of recipients
        to: '"zhuxianghua" <zhuxianghua@jihuomedia.com>',

        // Subject of the message
        subject: '最新车型', //

        // headers: {
        //     'X-Laziness-level': 1000
        // },

        // plaintext body
        // text: 'Hello to myself!',
        html: "<b>最新车型</b>",

        // HTML body
        // html:'<p><b>Hello</b> to myself <img src="cid:note@node"/></p>'+
        //      '<p>Here\'s a nyan cat for you as an embedded attachment:<br/><img src="cid:nyan@node"/></p>',

        // An array of attachments
        attachments:[

            // String attachment
            // {
            //     fileName: 'notes.txt',
            //     contents: 'Some notes about this e-mail',
            //     contentType: 'text/plain' // optional, would be detected from the filename
            // },

            // // Binary Buffer attachment
            // {
            //     fileName: 'image.png',
            //     contents: new Buffer('iVBORw0KGgoAAAANSUhEUgAAABAAAAAQAQMAAAAlPW0iAAAABlBMVEUAAAD/' +
            //                          '//+l2Z/dAAAAM0lEQVR4nGP4/5/h/1+G/58ZDrAz3D/McH8yw83NDDeNGe4U' +
            //                          'g9C9zwz3gVLMDA/A6P9/AFGGFyjOXZtQAAAAAElFTkSuQmCC', 'base64'),

            //     cid: 'note@node' // should be as unique as possible
            // },

            // File Stream attachment
            {
                fileName: '最新车型.txt',
                filePath: file,
                // cid: 'nyan@node' // should be as unique as possible
            }
        ]
    };

    console.log('Sending Mail');
    transport.sendMail(message, function(error){
        if(error){
            console.log('Error occured');
            console.log(error.message);
            return;
        }
        console.log('Mail is sent successfully!');

        // if you don't want to use this transport object anymore, uncomment following line
        transport.close(); // close the connection pool
    });

};