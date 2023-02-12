import 'knockout-postbox';

import {
    injectDynamicImportHtmlIntoDom,
    fetchComponent
} from './utils/utils.js';

export default function appLaunch() {
    fetchComponent({
        filePath: () => import(
            /* webpackChunkName: "applicationMessages_js" */
            './components/applicationMessages/applicationMessages.js'
        ),
        filePathTemplate: () => import(
            /* webpackChunkName: "applicationMessages_html" */
            './components/applicationMessages/applicationMessages.html'
        )
    }).then(arr => {
        const appMessagesApi = arr[0].default();
        const html = arr[1].default;

        const el = injectDynamicImportHtmlIntoDom({
            parentNode: document.querySelector('.app'),
            html: html
        });

        appMessagesApi.initialize();
        
        ko.applyBindings(appMessagesApi, el)
    });


    fetchComponent({
        filePath: () => import(
            /* webpackChunkName: "fileUploader_js" */
            './components/fileUploader/fileUploader.js'
        ),
        filePathTemplate: () => import(
            /* webpackChunkName: "fileUploader_html" */
            './components/fileUploader/fileUploader.html'
        )
    }).then(arr => {
        const fileUploaderApi = new arr[0].default();
        const html = arr[1].default;

        const el = injectDynamicImportHtmlIntoDom({
            parentNode: document.querySelector('.app__content'),
            html: html
        });

        fileUploaderApi.initialize({
            el,
            endpoint: data => Promise.resolve(data), // noop
            allowsMultiple: true,
            validatePlainTextContent: true,
            maxFileSize: 5242880, // 1mb = 1024 * 1024 bytes,
            allowedExtensions: ['.txt', '.jpg'],
            labelText: 'Drop file(s) here',
            labelButton: 'Choose file'
        });

        ko.applyBindings(fileUploaderApi, el);
    });
};