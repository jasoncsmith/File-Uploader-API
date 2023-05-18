# File Uploader Api
A simple cross-browser native JavaScript file uploader API that removes the idiosyncrosies of the file input element. 

## To Run
1. Install Node.js
2. Clone project
3. Navigate to root project directory
4. Command Prompt > npm i
5. Command Prompt > npm run build
6. Right click index.html and open with browser

## To View
Click the link: https://jasoncsmith.github.io/File-Uploader-API/.

## Features
- Uses OWASP recommended DOMPurify library for DOM injection sanitization
- Dynamically imported components
- Allows unlimited interfaces per view
- Drag/Drop
- Single or Multiple File handling
- Configurable
- Creates a hoverable image preview of image files
- Various File Validation

## Built in Validation
- XSS and DOM injection attacks in plain text files
- File Name Length
- File Name Illegal Characters
- File Size
- File Extension

## Test File
- Located here is a test file that you can use to simulate a file upload attack: https://github.com/jasoncsmith/File-Uploader-API/tree/main/docs/test-attack-file.txt
- This test file has some DOM attacks as featured in the OWASP cheat sheet: https://cheatsheetseries.owasp.org/cheatsheets/XSS_Filter_Evasion_Cheat_Sheet.html

## TODO:
Do not allow queueing of same file
