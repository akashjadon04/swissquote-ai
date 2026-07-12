const fs = require('fs');
const path = require('path');

const targetFile = path.join(__dirname, 'src/components/ui/QuotePDFPreview.tsx');
let content = fs.readFileSync(targetFile, 'utf8');

const oldNav = `<Button
              variant="secondary"
              onClick={onClose}
              iconLeft={<ArrowLeft size={16} />}
              className="md:flex hidden"
            >
              Retour
            </Button>
            <button
              onClick={onClose}
              className="md:hidden p-2 rounded-full hover:bg-surface-2 transition-colors text-text-muted hover:text-text-primary"
            >
              <ArrowLeft size={24} />
            </button>`;

const newNav = `<Button
              variant="secondary"
              onClick={onClose}
              iconLeft={<ArrowLeft size={16} />}
            >
              Retour
            </Button>`;

content = content.replace(oldNav, newNav);

fs.writeFileSync(targetFile, content, 'utf8');
console.log("PDF Nav replaced successfully!");
