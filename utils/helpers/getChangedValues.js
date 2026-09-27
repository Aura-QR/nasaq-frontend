export function getChangedValues(data, defaultValues, skipKeys = []) {
    return Object.keys(data).reduce((acc, key) => {
      if (skipKeys.includes(key)) return acc;
  
      // compare values deeply (basic: strict equality)
      if (data[key] !== defaultValues[key]) {
        acc[key] = data[key];
      }
  
      return acc;
    }, {});
}