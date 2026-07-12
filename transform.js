const fs = require('fs');
let content = fs.readFileSync('src/app/quotes/new/page.tsx', 'utf8');

// Replace the wizard-steps header with Stepper
let startStr = '<div className=\"wizard-steps\">';
let endStr = '</AnimatePresence>';

let startIndex = content.indexOf(startStr);
let endIndex = content.lastIndexOf(endStr);

if (startIndex !== -1 && endIndex !== -1) {
  let before = content.substring(0, startIndex);
  let after = content.substring(endIndex + endStr.length);
  let middle = content.substring(startIndex, endIndex);

  // We are going to reconstruct 'middle'
  // 1. Remove the old wizard-steps block completely
  let animatePresenceIdx = middle.indexOf('<AnimatePresence');
  middle = middle.substring(animatePresenceIdx); // Now starts with <AnimatePresence...

  // 2. Replace AnimatePresence with Stepper
  middle = middle.replace(/<AnimatePresence[^>]*>/, '<Stepper activeStep={currentStep + 1} hideFooter={true}>');

  // 3. Replace {currentStep === 0 && ( <motion.div ... > with <Step><div ... >
  middle = middle.replace(/\{currentStep === 0 && \(\s*<motion\.div[^>]*className=\"wizard-panel\"[^>]*>/g, '<Step>\n<div className=\"wizard-panel\">');
  middle = middle.replace(/\{currentStep === 1 && \(\s*<motion\.div[^>]*className=\"wizard-panel processing-panel[^>]*>/g, '<Step>\n<div className=\"wizard-panel processing-panel flex items-center justify-center min-h-[400px]\">');
  middle = middle.replace(/\{currentStep === 2 && \(\s*<motion\.div[^>]*className=\"wizard-panel review-panel\"[^>]*>/g, '<Step>\n<div className=\"wizard-panel review-panel\">');
  middle = middle.replace(/\{currentStep === 3 && \(\s*<motion\.div[^>]*className=\"wizard-panel\"[^>]*>/g, '<Step>\n<div className=\"wizard-panel\">');

  // 4. Replace </motion.div> )} with </div></Step>
  // We need to do this exactly 4 times for the outer motion divs.
  // Note: There are nested motion.divs inside step 0 and step 2!
  // To avoid breaking nested ones, we can match the specific pattern at the end of the steps.
  // Step 0 ends right before {/* Step 1
  middle = middle.replace(/<\/motion\.div>\s*\)\}\s*\{\/\* Step 1/g, '</div>\n</Step>\n{/* Step 1');
  middle = middle.replace(/<\/motion\.div>\s*\)\}\s*\{\/\* Step 2/g, '</div>\n</Step>\n{/* Step 2');
  middle = middle.replace(/<\/motion\.div>\s*\)\}\s*\{\/\* Step 3/g, '</div>\n</Step>\n{/* Step 3');
  
  // The final one is right at the end (which used to be before </AnimatePresence>)
  middle = middle.replace(/<\/motion\.div>\s*\)\}\s*$/g, '</div>\n</Step>\n');

  // Add the closing Stepper
  middle = middle + '</Stepper>';

  fs.writeFileSync('src/app/quotes/new/page.tsx', before + middle + after);
  console.log('Successfully replaced Stepper logic!');
} else {
  console.log('Could not find start or end index.');
}
