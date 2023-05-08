# file-uploader-api
File Uploader Api

A simple cross-browser file uploader API that removes the idiosyncrosies of the file input element. 

## To Run
1. Install Node.js
2. Clone project
3. Navigate to root project directory
4. Command Prompt > npm i
5. Command Prompt > npm run build
6. Right click index.html and open with browser

## To View
copy and paste: https://jasoncsmith.github.io/File-Uploader-API/ into your favorite browser.

## Features
- Dynamically imported components
- Allows unlimited interfaces per view
- Drag/Drop
- Single or Multiple File handling
- Configurable
- Uses OWASP recommended DOMPurify library for DOM injection sanitization
- Creates a hoverable image preview of image files
- Various File Validation

## Built in Validation
- XSS and DOM injection attacks in plain text files
- File Name Length
- File Name Illegal Characters
- File Size
- File Extension

## TODO:
Do not allow queueing of same file
