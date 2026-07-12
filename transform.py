import sys
import re

with open('src/app/quotes/new/page.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Replace the wizard-steps div and AnimatePresence with Stepper
pattern1 = re.compile(r'<div className="wizard-steps">.*?</div>\s*<AnimatePresence mode="wait">', re.DOTALL)
content = pattern1.sub('<Stepper activeStep={currentStep + 1} hideFooter={true}>', content)

# 2. Replace {currentStep === X && ( <motion.div ... > with <Step> <motion.div ... >
content = re.sub(r'\{currentStep === 0 && \(\s*(<motion\.div\s*key="description")', r'<Step>\n              \1', content)
content = re.sub(r'\{currentStep === 1 && \(\s*(<motion\.div\s*key="processing")', r'<Step>\n              \1', content)
content = re.sub(r'\{currentStep === 2 && \(\s*(<motion\.div\s*key="review")', r'<Step>\n              \1', content)
content = re.sub(r'\{currentStep === 3 && \(\s*(<motion\.div\s*key="financials")', r'<Step>\n              \1', content)

# 3. Replace the closing )} of the steps
# We look for </motion.div> followed by )} which is at the same indentation level as {currentStep === X && (
# Step 0 ends before {/* Step 1
content = re.sub(r'(</motion\.div>)\s*\)\}\s*(?=\{\/\*\s*Step 1)', r'\1\n            </Step>\n            ', content)
# Step 1 ends before {/* Step 2
content = re.sub(r'(</motion\.div>)\s*\)\}\s*(?=\{\/\*\s*Step 2)', r'\1\n            </Step>\n            ', content)
# Step 2 ends before {/* Step 3
content = re.sub(r'(</motion\.div>)\s*\)\}\s*(?=\{\/\*\s*Step 3)', r'\1\n            </Step>\n            ', content)
# Step 3 ends before </AnimatePresence>
content = re.sub(r'(</motion\.div>)\s*\)\}\s*</AnimatePresence>', r'\1\n            </Step>\n          </Stepper>', content)

with open('src/app/quotes/new/page.tsx', 'w', encoding='utf-8') as f:
    f.write(content)

print("Updated with Python script!")
