export function formatBytes(bytes: number): string {
/* 
It's convenient within the computer to organize things in groups of powers of
2. For example, 2^10 is 1024, and so a program might group 1024 items 
together, as a sort of "round" number of things within the computer. The term 
"kilobyte" above refers to this group size of 1024 things. However, people 
also group things by thousands -- 1 thousand or 1 million items.
There's this problem with the word "megabyte": does it mean 1024 * 1024 bytes,
i.e. 2^20, which is 1,048,576, or does it mean exactly 1 million, 1000 * 1000.
It's just a 5% difference, but marketers tend to prefer the 1 million 
interpretation, since it makes their hard drives etc. appear to hold a little
bit more.
https://stackoverflow.com/questions/15900485/correct-way-to-convert-size-in-bytes-to-kb-mb-gb-in-javascript
*/
    const units: string[] = ['B', 'KB', 'MB', 'GB', 'TB'];
    let i: number;
 
    for (i = 0; bytes >= 1024 && i < 4; i++) {
        bytes /= 1024;
    }
 
    return `${bytes.toFixed(1)}${units[i]}`;
}