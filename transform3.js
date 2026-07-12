const fs = require('fs');
let content = fs.readFileSync('src/app/quotes/new/page.tsx', 'utf8');

// Import Stepper, Step
content = content.replace("import { AIProcessingState", "import { AIProcessingState, Stepper, Step ");

// Replace wizard-steps block
const oldWizardStepsPattern = /<div className="wizard-steps">[\s\S]*?<\/div>\s*<AnimatePresence mode="wait">/;
const replacement = <Stepper activeStep={currentStep + 1} hideFooter={true} hideContent={true}>
              <Step>1</Step>
              <Step>2</Step>
              <Step>3</Step>
              <Step>4</Step>
            </Stepper>
  
            <AnimatePresence mode="wait">;

content = content.replace(oldWizardStepsPattern, replacement);

fs.writeFileSync('src/app/quotes/new/page.tsx', content);
console.log('Wizard progress bar updated!');
