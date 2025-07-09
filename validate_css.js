const fs = require('fs');
const path = require('path');

// Read the CSS file
const cssPath = path.join(__dirname, 'src/components/MobilePhoneList.css');
const css = fs.readFileSync(cssPath, 'utf8');

// Simple bracket validation
let openBrackets = 0;
let line = 1;
let errors = [];

for (let i = 0; i < css.length; i++) {
  const char = css[i];
  
  if (char === '\n') {
    line++;
  } else if (char === '{') {
    openBrackets++;
  } else if (char === '}') {
    openBrackets--;
    if (openBrackets < 0) {
      errors.push(`Line ${line}: Unexpected closing bracket`);
    }
  }
}

if (openBrackets > 0) {
  errors.push(`Missing ${openBrackets} closing bracket(s)`);
}

if (errors.length === 0) {
  console.log('✅ CSS syntax validation passed!');
} else {
  console.log('❌ CSS syntax errors found:');
  errors.forEach(error => console.log(error));
}