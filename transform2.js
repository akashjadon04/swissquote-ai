const fs = require('fs');
let content = fs.readFileSync('src/app/quotes/new/page.tsx', 'utf8');

// Replace imports
content = content.replace("import { AIProcessingState", "import { AIProcessingState, Stepper, Step ");

// Replace wizard-steps with Stepper
const stepHeaderPattern = /<div className="wizard-steps">[\s\S]*?<\/div>\s*<AnimatePresence mode="wait">/;
content = content.replace(stepHeaderPattern, '<Stepper activeStep={currentStep + 1} hideFooter={true}>');

// Step 0 Start
content = content.replace(/\{currentStep === 0 && \(\s*(<motion\.div\s*key="description")/, '<Step>\n              ');
// Step 0 End
content = content.replace(/<\/motion\.div>\s*\)\}\s*\{\/\* Step 1: AI Processing Animation \*\/\}/, '</motion.div>\n            </Step>\n\n            {/* Step 1: AI Processing Animation */}');

// Step 1 Start
content = content.replace(/\{currentStep === 1 && \(\s*(<motion\.div\s*key="processing")/, '<Step>\n              ');
// Step 1 End
content = content.replace(/<\/motion\.div>\s*\)\}\s*\{\/\* Step 2: Review Articles \*\/\}/, '</motion.div>\n            </Step>\n\n            {/* Step 2: Review Articles */}');

// Step 2 Start
content = content.replace(/\{currentStep === 2 && \(\s*(<motion\.div\s*key="review")/, '<Step>\n              ');
// Step 2 End
content = content.replace(/<\/motion\.div>\s*\)\}\s*\{\/\* Step 3: Financial Summary \*\/\}/, '</motion.div>\n            </Step>\n\n            {/* Step 3: Financial Summary */}');

// Step 3 Start
content = content.replace(/\{currentStep === 3 && \(\s*(<motion\.div\s*key="financials")/, '<Step>\n              ');
// Step 3 End
content = content.replace(/<\/motion\.div>\s*\)\}\s*<\/AnimatePresence>/, '</motion.div>\n            </Step>\n          </Stepper>');

fs.writeFileSync('src/app/quotes/new/page.tsx', content);
console.log('Successfully updated with Node.js string replace!');
