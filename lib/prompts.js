export function amendRfiDataPrompt(groupedData) {
  return `
  array of data:
  ${groupedData}

  For every object in the array of data above, keep the existing keys but add a new key called updatedRfi
  When creating the value for updatedRfi use the following rules:

  - Use the value of the rfi key but remove the "RFI" text at the beginning of the string and replace it with "The auditor noted that". 
    Additionally, finalise the text by formulating an action item for the client, for example, "can you please clarify?" or "can you provide additional evidence"
  - Don't solely use those two examples. Formulate an appropriate action item for the client depending on the content of the rfi attribute.
  - **DO NOT provide instructions on how to achieve this.
  - Strip any markdown text from the output
  - Return the new array of objects
  - Make sure that the new array has the same amount of objects in it

  **example output**

  [
    {
      rfi: 'RFI - CCEW has not been uploaded | invoice says $0, but list of sites listed $1,500',
      updatedRfi: "The auditor noted that the CCEW has not been uploaded and the invoice says $0, but list of sites listed $1,500 Please clarify?"
      projectsAffected: [ [Object] ]
    },
    {
      rfi: 'RFI - CCEW has not been provided',
      updatedRfi: "The auditor noted that the CCEW has not been provided. Can you please provide additional evidence?"
      projectsAffected: [ [Object] ]
    },
  ]
  `;
}
