/** 
* Properties in the target object are overwritten by 
* properties in the sources if they have the same key. 
* Later sources' properties overwrite earlier ones.

* @param object target
* @param object source
* @return object merged target/source
*/
export function objMerge(target, source) {
    return Object.assign(target, source);
}