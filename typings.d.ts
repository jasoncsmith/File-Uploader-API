
// over-rides vendor libraries that dont have a types file.
// JCS: 09/02/2020 below is an example of how to provide typescript
// with a type of any for a vendor lib that does not have typings.

// interface KnockoutStatic {
//     postbox: any;
// }

// // to import html into webpack .js files
// declare module '*.html' {
//     const value: any;
//     export default value;
//   }

declare module "*.html" {   
    const value: string
    export default value
  }