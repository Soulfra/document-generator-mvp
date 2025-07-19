/**
 * Safe Array Helpers - Prevent "Cannot read properties of undefined" errors
 * 
 * These utilities provide safe ways to work with arrays that might be undefined,
 * null, or not actually arrays.
 */

/**
 * Safely call map on an array-like value
 * @param {*} value - The value that might be an array
 * @param {Function} callback - The map callback function
 * @param {*} defaultValue - Default value if not an array (default: [])
 * @returns {Array} The mapped array or default value
 */
export const safeMap = (value, callback, defaultValue = []) => {
  if (!value || !Array.isArray(value)) {
    console.warn('[SafeMap] Value is not an array:', value);
    return defaultValue;
  }
  try {
    return value.map(callback);
  } catch (error) {
    console.error('[SafeMap] Error during map operation:', error);
    return defaultValue;
  }
};

/**
 * Safely access an array property and map it
 * @param {Object} obj - The object that might contain the array
 * @param {string} path - The property path (supports dot notation)
 * @param {Function} callback - The map callback function
 * @param {*} defaultValue - Default value if not found (default: [])
 * @returns {Array} The mapped array or default value
 */
export const safePropertyMap = (obj, path, callback, defaultValue = []) => {
  const value = getNestedProperty(obj, path);
  return safeMap(value, callback, defaultValue);
};

/**
 * Safely filter an array
 * @param {*} value - The value that might be an array
 * @param {Function} callback - The filter callback function
 * @returns {Array} The filtered array or empty array
 */
export const safeFilter = (value, callback) => {
  if (!value || !Array.isArray(value)) {
    return [];
  }
  try {
    return value.filter(callback);
  } catch (error) {
    console.error('[SafeFilter] Error during filter operation:', error);
    return [];
  }
};

/**
 * Safely find an item in an array
 * @param {*} value - The value that might be an array
 * @param {Function} callback - The find callback function
 * @param {*} defaultValue - Default value if not found
 * @returns {*} The found item or default value
 */
export const safeFind = (value, callback, defaultValue = undefined) => {
  if (!value || !Array.isArray(value)) {
    return defaultValue;
  }
  try {
    return value.find(callback) || defaultValue;
  } catch (error) {
    console.error('[SafeFind] Error during find operation:', error);
    return defaultValue;
  }
};

/**
 * Safely reduce an array
 * @param {*} value - The value that might be an array
 * @param {Function} callback - The reduce callback function
 * @param {*} initialValue - Initial value for reduce
 * @returns {*} The reduced value
 */
export const safeReduce = (value, callback, initialValue) => {
  if (!value || !Array.isArray(value)) {
    return initialValue;
  }
  try {
    return value.reduce(callback, initialValue);
  } catch (error) {
    console.error('[SafeReduce] Error during reduce operation:', error);
    return initialValue;
  }
};

/**
 * Ensure a value is an array
 * @param {*} value - The value to ensure is an array
 * @param {Array} defaultValue - Default array if value is not an array
 * @returns {Array} The value as an array
 */
export const ensureArray = (value, defaultValue = []) => {
  if (Array.isArray(value)) {
    return value;
  }
  if (value === null || value === undefined) {
    return defaultValue;
  }
  // If it's a single value, wrap it in an array
  return [value];
};

/**
 * Get nested property safely
 * @param {Object} obj - The object to traverse
 * @param {string} path - The property path (dot notation)
 * @param {*} defaultValue - Default value if not found
 * @returns {*} The property value or default
 */
export const getNestedProperty = (obj, path, defaultValue = undefined) => {
  if (!obj || typeof obj !== 'object') {
    return defaultValue;
  }
  
  const parts = path.split('.');
  let current = obj;
  
  for (const part of parts) {
    if (current === null || current === undefined || !(part in current)) {
      return defaultValue;
    }
    current = current[part];
  }
  
  return current;
};

/**
 * Safe array length check
 * @param {*} value - The value that might be an array
 * @returns {number} The array length or 0
 */
export const safeLength = (value) => {
  return Array.isArray(value) ? value.length : 0;
};

/**
 * Safe array access by index
 * @param {*} value - The value that might be an array
 * @param {number} index - The index to access
 * @param {*} defaultValue - Default value if not found
 * @returns {*} The item at index or default value
 */
export const safeAccess = (value, index, defaultValue = undefined) => {
  if (!Array.isArray(value) || index < 0 || index >= value.length) {
    return defaultValue;
  }
  return value[index];
};

/**
 * Create a HOC (Higher Order Component) that provides safe array props
 * @param {React.Component} Component - The component to wrap
 * @param {Array<string>} arrayPropNames - Names of props that should be arrays
 * @returns {React.Component} The wrapped component
 */
export const withSafeArrayProps = (Component, arrayPropNames = []) => {
  return (props) => {
    const safeProps = { ...props };
    
    arrayPropNames.forEach(propName => {
      safeProps[propName] = ensureArray(props[propName]);
    });
    
    return Component(safeProps);
  };
};

/**
 * Debug helper to log array operations
 * @param {string} operation - The operation name
 * @param {*} value - The value being operated on
 * @param {*} result - The operation result
 */
const debugLog = (operation, value, result) => {
  if (process.env.NODE_ENV === 'development') {
    console.group(`[SafeArray] ${operation}`);
    console.log('Input:', value);
    console.log('Output:', result);
    console.log('Type:', Array.isArray(value) ? 'Array' : typeof value);
    console.groupEnd();
  }
};

/**
 * Create a safe array wrapper with telemetry
 * @param {*} value - The value to wrap
 * @returns {Object} Object with safe array methods
 */
export const createSafeArray = (value) => {
  const array = ensureArray(value);
  
  return {
    value: array,
    map: (callback) => safeMap(array, callback),
    filter: (callback) => safeFilter(array, callback),
    find: (callback, defaultValue) => safeFind(array, callback, defaultValue),
    reduce: (callback, initialValue) => safeReduce(array, callback, initialValue),
    length: () => safeLength(array),
    at: (index, defaultValue) => safeAccess(array, index, defaultValue),
    isEmpty: () => safeLength(array) === 0,
    first: (defaultValue) => safeAccess(array, 0, defaultValue),
    last: (defaultValue) => safeAccess(array, array.length - 1, defaultValue),
  };
};

// Export a default safe array handler
export default {
  safeMap,
  safePropertyMap,
  safeFilter,
  safeFind,
  safeReduce,
  ensureArray,
  getNestedProperty,
  safeLength,
  safeAccess,
  withSafeArrayProps,
  createSafeArray
};